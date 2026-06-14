import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";

// ─── Config ───────────────────────────────────────────────────────────────────
const SPACE_ID = "yisol/IDM-VTON";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

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

/**
 * Downloads the ephemeral HF result file and re-uploads it to Cloudinary
 * for a permanent, publicly accessible URL.
 */
async function persistResultToCloudinary(
  hfFileUrl: string,
  hfToken: string
): Promise<string> {
  // The HF temp file endpoint may require the auth token for ZeroGPU spaces
  let fileRes = await fetch(hfFileUrl, {
    headers: { Authorization: `Bearer ${hfToken}` },
  });

  // Some spaces serve /file= publicly without auth — retry without header
  if (!fileRes.ok) {
    fileRes = await fetch(hfFileUrl);
  }

  if (!fileRes.ok) {
    throw new Error(
      `Could not download result image from HF (${fileRes.status}): ${hfFileUrl}`
    );
  }

  const arrayBuffer = await fileRes.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString("base64");
  const mimeType = fileRes.headers.get("content-type") ?? "image/png";
  const dataUri = `data:${mimeType};base64,${base64}`;

  const uploadResult = await cloudinary.uploader.upload(dataUri, {
    folder: "ai-ecommerce/tryon-results",
    resource_type: "image",
  });

  return uploadResult.secure_url;
}

// ─── POST /api/try-on ─────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  // ── 1. Token guards ──────────────────────────────────────────────────────
  const hfToken = process.env.HF_TOKEN;
  if (!hfToken) {
    console.error("[try-on] HF_TOKEN is not configured");
    return NextResponse.json(
      { error: "Server misconfiguration: HF_TOKEN missing" },
      { status: 500 }
    );
  }

  if (
    !process.env.CLOUDINARY_CLOUD_NAME ||
    !process.env.CLOUDINARY_API_KEY ||
    !process.env.CLOUDINARY_API_SECRET
  ) {
    console.error("[try-on] Cloudinary env vars missing");
    return NextResponse.json(
      { error: "Server misconfiguration: Cloudinary credentials missing" },
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

  // ── 3. Fetch input images as blobs ───────────────────────────────────────
  console.log("[try-on] Fetching input images...");
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

  // ── 4. Call IDM-VTON via @gradio/client ──────────────────────────────────
  console.log("[try-on] Connecting to Hugging Face space...");

  let hfResultUrl: string;

  try {
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

    const output = (result as any)?.data?.[0];
    const resultUrl =
      typeof output === "string" ? output : output?.url ?? output?.path ?? null;

    if (!resultUrl) {
      console.error("[try-on] No output URL in result:", result);
      return NextResponse.json(
        { error: "AI returned no output image", debug: result },
        { status: 502 }
      );
    }

    hfResultUrl = resultUrl.startsWith("http")
      ? resultUrl
      : `https://yisol-idm-vton.hf.space/file=${resultUrl}`;

    console.log("[try-on] HF result URL (ephemeral):", hfResultUrl);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[try-on] Gradio client error:", msg);

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

    return NextResponse.json(
      { error: "Hugging Face try-on failed", debug: msg },
      { status: 502 }
    );
  }

  // ── 5. Re-host the ephemeral HF result on Cloudinary ─────────────────────
  // FIX: HF /tmp/gradio/ URLs are session-bound and disappear quickly in prod.
  // Download immediately and persist on Cloudinary for a permanent public URL.
  console.log("[try-on] Persisting result to Cloudinary...");
  try {
    const permanentUrl = await persistResultToCloudinary(hfResultUrl, hfToken);
    console.log("[try-on] ✅ Success. Permanent URL:", permanentUrl);
    return NextResponse.json({ resultUrl: permanentUrl }, { status: 200 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[try-on] Cloudinary persist error:", msg);
    return NextResponse.json(
      { error: "Generated image could not be saved", debug: msg },
      { status: 502 }
    );
  }
}