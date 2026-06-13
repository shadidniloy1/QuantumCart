import { NextRequest, NextResponse } from "next/server";

// ─── Constants ────────────────────────────────────────────────────────────────

/**
 * IDM-VTON model version hash (pinned for reproducibility).
 * Check https://replicate.com/yisol/idm-vton/versions for the latest.
 */
const REPLICATE_MODEL_VERSION =
  "c871bb9b046607b680449ecbae55fd8c6d945e0a1948644bf2361b3d021d3ff4";

const REPLICATE_API_URL = "https://api.replicate.com/v1/predictions";

/** How long to wait between polling attempts (ms) */
const POLL_INTERVAL_MS = 4_000;

/** Max total time we'll wait for the prediction (ms) — 5 minutes */
const MAX_WAIT_MS = 300_000;

// ─── Types ────────────────────────────────────────────────────────────────────

type PredictionStatus =
  | "starting"
  | "processing"
  | "succeeded"
  | "failed"
  | "canceled";

interface ReplicatePrediction {
  id: string;
  status: PredictionStatus;
  output: string[] | null;
  error: string | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Validates that a string is an absolute HTTP/HTTPS URL.
 * Replicate must be able to fetch both images publicly.
 */
function isValidUrl(value: unknown): value is string {
  if (typeof value !== "string") return false;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Polls a Replicate prediction until it succeeds, fails, or times out.
 * Returns the final prediction object.
 */
async function pollUntilDone(
  predictionId: string,
  token: string
): Promise<ReplicatePrediction> {
  const deadline = Date.now() + MAX_WAIT_MS;

  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));

    const res = await fetch(`${REPLICATE_API_URL}/${predictionId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Polling failed (${res.status}): ${text}`);
    }

    const prediction: ReplicatePrediction = await res.json();

    if (prediction.status === "succeeded") return prediction;
    if (prediction.status === "failed" || prediction.status === "canceled") {
      throw new Error(
        `Prediction ${prediction.status}: ${prediction.error ?? "unknown reason"}`
      );
    }
    // status is "starting" | "processing" — keep polling
  }

  throw new Error("Prediction timed out after 5 minutes");
}

// ─── Route Handler ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  // ── 1. Auth guard ──────────────────────────────────────────────────────────
  const token = process.env.REPLICATE_API_TOKEN;
  if (!token) {
    console.error("REPLICATE_API_TOKEN is not set");
    return NextResponse.json(
      { error: "Server configuration error" },
      { status: 500 }
    );
  }

  // ── 2. Parse & validate request body ──────────────────────────────────────
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { userPhotoUrl, garmentImageUrl, garmentDescription } = body as Record<
    string,
    unknown
  >;

  if (!isValidUrl(userPhotoUrl)) {
    return NextResponse.json(
      { error: "userPhotoUrl must be a valid HTTP/HTTPS URL" },
      { status: 400 }
    );
  }

  if (!isValidUrl(garmentImageUrl)) {
    return NextResponse.json(
      { error: "garmentImageUrl must be a valid HTTP/HTTPS URL" },
      { status: 400 }
    );
  }

  const description =
    typeof garmentDescription === "string" && garmentDescription.trim()
      ? garmentDescription.trim()
      : "a clothing item";

  // ── 3. Create the prediction (fire-and-forget style — no Prefer:wait) ─────
  let predictionId: string;

  try {
    // FIX: Use the versioned predictions endpoint, NOT /v1/models/.../predictions
    const createRes = await fetch(REPLICATE_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        // FIX: Provide the pinned version hash
        version: REPLICATE_MODEL_VERSION,
        input: {
          human_img: userPhotoUrl,
          garm_img: garmentImageUrl,
          garment_des: description,
          is_checked: true,
          is_checked_crop: false,
          denoise_steps: 30,
          seed: 42,
        },
      }),
    });

    if (!createRes.ok) {
      const errText = await createRes.text();
      // Log full error server-side; send a sanitized message to client
      console.error("Replicate create error:", errText);
      return NextResponse.json(
        { error: "Failed to start AI try-on", code: createRes.status },
        { status: 502 }
      );
    }

    const created: ReplicatePrediction = await createRes.json();
    predictionId = created.id;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("Network error creating prediction:", msg);
    return NextResponse.json(
      { error: "Could not reach AI service" },
      { status: 502 }
    );
  }

  // ── 4. Poll until done ─────────────────────────────────────────────────────
  try {
    const prediction = await pollUntilDone(predictionId, token);

    const resultUrl = Array.isArray(prediction.output)
      ? prediction.output[0]
      : null;

    if (!resultUrl) {
      console.error("Prediction succeeded but output was empty", prediction);
      return NextResponse.json(
        { error: "AI returned no output image" },
        { status: 502 }
      );
    }

    return NextResponse.json(
      { resultUrl, id: prediction.id },
      { status: 200 }
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("Polling/prediction error:", msg);

    const isTimeout = msg.includes("timed out");
    return NextResponse.json(
      {
        error: isTimeout ? "Try-on timed out — please try again" : "AI try-on failed",
      },
      { status: 504 }
    );
  }
}