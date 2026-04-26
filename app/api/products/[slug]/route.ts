import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;

    const product = await prisma.product.findUnique({
      where: { slug },
      include: {
        category: true,
        reviews: {
          include: {
            user: {
              select: { id: true, name: true, avatar: true },
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!product) {
      return NextResponse.json(
        {
          error: "Product not found",
        },
        { status: 404 },
      );
    }

    const avgRating =
      product.reviews.length > 0
        ? product.reviews.reduce((a, r) => a + r.rating, 0) /
          product.reviews.length
        : 0;

    return NextResponse.json({ ...product, avgRating });
  } catch (error: any) {
    console.error("Product detail error:", error?.message);
    return NextResponse.json(
      { error: "Failed to fetch product" },
      { status: 500 },
    );
  }
}
