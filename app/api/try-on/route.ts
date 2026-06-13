import { NextRequest, NextResponse } from "next/server";

// ─── Hugging Face IDM-VTON Space ──────────────────────────────────────────────
// Free, no credit card needed. Same model as Replicate.
// Space: https://huggingface.co/spaces/yisol/IDM-VTON
const HF_API_URL = "https://yisol-idm-vton.hf.space";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isValidHttpUrl(value: unknown): value is string {
  if (typeof value !== "string" || !value.trim()) return false;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

async function urlToBase64(imageUrl: string): Promise<{ base64: string; mimeType: string }> {
  const res = await fetch(imageUrl);
  if (!res.ok) throw new Error(`Failed to fetch image: ${imageUrl} (${res.status})`);
  const buffer = await res.arrayBuffer();
  const mimeType = res.headers.get("content-type") ?? "image/jpeg";
  const base64 = Buffer.from(buffer).toString("base64");
  return { base64, mimeType };
}

// ─── POST /api/try-on ─────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  // ── 1. Parse & validate ──────────────────────────────────────────────────
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON" }, { status: 400 });
  }

  const { userPhotoUrl, garmentImageUrl, garmentDescription } = body;

  if (!isValidHttpUrl(userPhotoUrl)) {
    return NextResponse.json(
      { error: "userPhotoUrl is missing or not a valid HTTP/HTTPS URL" },
      { status: 400 }
    );
  }
  if (!isValidHttpUrl(garmentImageUrl)) {
    return NextResponse.json(
      { error: "garmentImageUrl is missing or not a valid HTTP/HTTPS URL" },
      { status: 400 }
    );
  }

  const description =
    typeof garmentDescription === "string" && garmentDescription.trim()
      ? garmentDescription.trim()
      : "a clothing item";

  // ── 2. Convert image URLs to base64 ─────────────────────────────────────
  // HF Gradio API requires base64-encoded images, not URLs
  console.log("[try-on] Fetching images for base64 conversion...");
  let humanBase64: string, humanMime: string;
  let garmentBase64: string, garmentMime: string;

  try {
    const [human, garment] = await Promise.all([
      urlToBase64(userPhotoUrl as string),
      urlToBase64(garmentImageUrl as string),
    ]);
    humanBase64 = human.base64;
    humanMime = human.mimeType;
    garmentBase64 = garment.base64;
    garmentMime = garment.mimeType;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[try-on] Image fetch error:", msg);
    return NextResponse.json(
      { error: "Could not fetch one of the images — check URLs are publicly accessible", debug: msg },
      { status: 422 }
    );
  }

  // ── 3. Submit job to Hugging Face Gradio API ─────────────────────────────
  console.log("[try-on] Submitting to Hugging Face IDM-VTON space...");

  let eventId: string;

  try {
    const submitRes = await fetch(`${HF_API_URL}/queue/join`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fn_index: 0,
        data: [
          { data: `data:${humanMime};base64,${humanBase64}`, type: "base64" },   // human image
          { data: `data:${garmentMime};base64,${garmentBase64}`, type: "base64" }, // garment image
          description,  // garment description
          true,         // is_checked (auto-masking)
          false,        // is_checked_crop
          30,           // denoise_steps
          42,           // seed
        ],
        session_hash: Math.random().toString(36).slice(2),
      }),
    });

    const submitText = await submitRes.text();

    if (!submitRes.ok) {
      console.error("[try-on] HF submit error:", submitRes.status, submitText);
      return NextResponse.json(
        { error: "Hugging Face space rejected the request", debug: submitText },
        { status: 502 }
      );
    }

    const submitData = JSON.parse(submitText);
    eventId = submitData.event_id;

    if (!eventId) {
      console.error("[try-on] No event_id returned:", submitData);
      return NextResponse.json(
        { error: "Hugging Face did not return a job ID", debug: submitData },
        { status: 502 }
      );
    }

    console.log("[try-on] Job queued, event_id:", eventId);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[try-on] Network error submitting to HF:", msg);
    return NextResponse.json(
      { error: "Could not connect to Hugging Face space", debug: msg },
      { status: 502 }
    );
  }

  // ── 4. Poll the SSE stream for the result ────────────────────────────────
  // HF Gradio streams events via SSE — we read until we get "process_completed"
  const MAX_WAIT_MS = 600_000; // 10 minutes (HF queue can be slow when cold)
  const deadline = Date.now() + MAX_WAIT_MS;

  console.log("[try-on] Polling SSE stream for result...");

  try {
    const streamRes = await fetch(
      `${HF_API_URL}/queue/data?session_hash=${eventId}`,
      {
        headers: { Accept: "text/event-stream" },
        signal: AbortSignal.timeout(MAX_WAIT_MS),
      }
    );

    if (!streamRes.ok || !streamRes.body) {
      const errText = await streamRes.text().catch(() => "");
      console.error("[try-on] SSE stream error:", streamRes.status, errText);
      return NextResponse.json(
        { error: "Could not connect to result stream", debug: errText },
        { status: 502 }
      );
    }

    const reader = streamRes.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (Date.now() < deadline) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? ""; // keep incomplete last line

      for (const line of lines) {
        if (!line.startsWith("data:")) continue;
        const jsonStr = line.slice(5).trim();
        if (!jsonStr) continue;

        let event: any;
        try {
          event = JSON.parse(jsonStr);
        } catch {
          continue;
        }

        console.log("[try-on] SSE event:", event.msg);

        if (event.msg === "process_completed") {
          reader.cancel();

          // Extract result image from Gradio output
          const output = event.output?.data?.[0];
          const resultUrl =
            typeof output === "string"
              ? output
              : output?.url ?? output?.data ?? null;

          if (!resultUrl) {
            console.error("[try-on] process_completed but no output:", event.output);
            return NextResponse.json(
              { error: "AI returned no output image", debug: event.output },
              { status: 502 }
            );
          }

          // If HF returns a relative path, prepend the space URL
          const finalUrl = resultUrl.startsWith("http")
            ? resultUrl
            : `${HF_API_URL}/file=${resultUrl}`;

          console.log("[try-on] Success! Result URL:", finalUrl);
          return NextResponse.json({ resultUrl: finalUrl }, { status: 200 });
        }

        if (event.msg === "process_errored" || event.msg === "queue_full") {
          reader.cancel();
          console.error("[try-on] HF process error:", event);
          return NextResponse.json(
            { error: "Hugging Face processing failed", debug: event.output?.error ?? event.msg },
            { status: 502 }
          );
        }
      }
    }

    return NextResponse.json(
      { error: "Try-on timed out — Hugging Face queue may be busy, please try again" },
      { status: 504 }
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[try-on] SSE polling error:", msg);
    return NextResponse.json(
      { error: "Lost connection to Hugging Face space", debug: msg },
      { status: 502 }
    );
  }
}