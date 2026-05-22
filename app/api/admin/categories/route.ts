import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { name, slug, image } = await req.json();
    const category = await prisma.category.create({
      data: { name, slug, image },
    });
    return NextResponse.json(category);
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to create category" },
      { status: 500 }
    );
  }
}