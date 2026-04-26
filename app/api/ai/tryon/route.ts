import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { userPhotoUrl, garmentImageUrl, garmentDescription } =
      await req.json();

    if (!userPhotoUrl || !garmentImageUrl) {
      return NextResponse.json(
        { error: "Missing photo or garment image" },
        { status: 400 },
      );
    }

    const response = await fetch(
      "https://api.replicate.com/v1/models/yisol/idm-vton/predictions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.REPLICATE_API_TOKEN}`,
          "Content-Type": "application/json",
          Prefer: "wait",
        },
        body: JSON.stringify({
          input: {
            human_img: userPhotoUrl,
            garm_img: garmentImageUrl,
            garment_des: garmentDescription || "a clothing item",
            is_checked: true,
            is_checked_crop: false,
            denoise_steps: 30,
            seed: 42,
          },
        }),
      },
    );

    if (!response.ok) {
      const err = await response.text();
      console.error("Replicate error:", err);
      return NextResponse.json(
        { error: "AI service failed", detail: err },
        { status: 500 },
      );
    }

    const prediction = await response.json();

    // Output is an array - first item is the result image URL
    const resultUrl = Array.isArray(prediction.output)
      ? prediction.output[0]
      : prediction.output;

    return NextResponse.json({
      resultUrl,
      id: prediction.id,
    });
  } catch (error: any) {
    console.error("Try-on error:", error?.message);
    return NextResponse.json(
      { error: "Try-on failed", detail: error?.message },
      { status: 500 },
    );
  }
}
