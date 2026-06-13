import { NextRequest, NextResponse } from "next/server";

// ─── Config ───────────────────────────────────────────────────────────────────
// The original yisol/IDM-VTON space uses ZeroGPU which blocks raw API calls.
// We use the @gradio/client npm package which handles the ZeroGPU auth handshake.
// Requires a FREE Hugging Face token (read-only is fine):
//   1. Go to https://huggingface.co/settings/tokens
//   2. Create a token (Read access is enough)
//   3. Add to .env.local: HF_TOKEN=hf_xxxxxxxxxxxxxxxxxxxx

const SPACE_ID = "yisol/IDM-VTON";

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

async function urlToBlob(imageUrl: string): Promise<Blob> {
  const res = await fetch(imageUrl);
  if (!res.ok) throw new Error(`Failed to fetch image: ${imageUrl} (${res.status})`);
  return res.blob();
}

// ─── POST /api/try-on ─────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  // ── 1. Token guard ───────────────────────────────────────────────────────
  const hfToken = process.env.HF_TOKEN;
  if (!hfToken) {
    console.error("[try-on] HF_TOKEN is not configured");
    return NextResponse.json(
      {
        error: "Server misconfiguration: HF_TOKEN missing",
        debug: "Add HF_TOKEN=hf_xxx to your .env.local. Get a free token at https://huggingface.co/settings/tokens",
      },
      { status: 500 }
    );
  }

  // ── 2. Parse & validate body ─────────────────────────────────────────────
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

  // ── 3. Fetch images as blobs ─────────────────────────────────────────────
  console.log("[try-on] Fetching images...");
  let humanBlob: Blob, garmentBlob: Blob;
  try {
    [humanBlob, garmentBlob] = await Promise.all([
      urlToBlob(userPhotoUrl as string),
      urlToBlob(garmentImageUrl as string),
    ]);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[try-on] Image fetch error:", msg);
    return NextResponse.json(
      { error: "Could not fetch one of the images — make sure URLs are publicly accessible", debug: msg },
      { status: 422 }
    );
  }

  // ── 4. Call via @gradio/client (handles ZeroGPU auth automatically) ──────
  console.log("[try-on] Connecting to Hugging Face space...");
  try {
    // Dynamic import — install with: npm install @gradio/client
    const { Client } = await import("@gradio/client");

    const client = await Client.connect(SPACE_ID, {
      token: hfToken as `hf_${string}`,
    });

    console.log("[try-on] Connected. Submitting prediction...");

    const result = await client.predict("/tryon", {
      dict: { background: humanBlob, layers: [], composite: null },
      garm_img: garmentBlob,
      garment_des: description,
      is_checked: true,
      is_checked_crop: false,
      denoise_steps: 30,
      seed: 42,
    });

    console.log("[try-on] Raw result:", JSON.stringify(result?.data)?.slice(0, 300));

    // result.data is an array; first element is the try-on output image object
    const output = (result as any)?.data?.[0];

    // Gradio returns { url, path, orig_name, ... } or a direct URL string
    const resultUrl =
      typeof output === "string"
        ? output
        : output?.url ?? output?.path ?? null;

    if (!resultUrl) {
      console.error("[try-on] No output URL in result:", result);
      return NextResponse.json(
        { error: "AI returned no output image", debug: result },
        { status: 502 }
      );
    }

    // Gradio sometimes returns a relative path — prepend space URL if needed
    const finalUrl = resultUrl.startsWith("http")
      ? resultUrl
      : `https://yisol-idm-vton.hf.space/file=${resultUrl}`;

    console.log("[try-on] ✅ Success:", finalUrl);
    return NextResponse.json({ resultUrl: finalUrl }, { status: 200 });

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[try-on] Gradio client error:", msg);

    // Give a helpful message for common failure modes
    if (msg.includes("is currently unavailable") || msg.includes("503")) {
      return NextResponse.json(
        { error: "Hugging Face space is sleeping — please try again in 30 seconds", debug: msg },
        { status: 503 }
      );
    }
    if (msg.includes("401") || msg.includes("unauthorized")) {
      return NextResponse.json(
        { error: "Invalid HF_TOKEN — check your token at https://huggingface.co/settings/tokens", debug: msg },
        { status: 500 }
      );
    }
    if (msg.includes("Cannot find module")) {
      return NextResponse.json(
        { error: "Missing dependency — run: npm install @gradio/client", debug: msg },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: "Hugging Face try-on failed", debug: msg },
      { status: 502 }
    );
  }
}