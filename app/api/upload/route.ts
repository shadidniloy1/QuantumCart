import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(req: NextResponse) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Convert file to base64
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = `data:${file.type};base64,${buffer.toString("base64")}`;

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(base64, {
      folder: "ai-ecommerce/tryon",
      transformation: [{ width: 768, height: 1024, crop: "fill" }],
    });

    return NextResponse.json({ url: result.secure_url });
  } catch (error: any) {
    console.error("Upload error:", error?.message);
    return NextResponse.json(
      { error: "Upload failed", detail: error?.message },
      { status: 500 },
    );
  }
}
