import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  {
    params,
  }: {
    params: Promise<{
      slug: string;
    }>;
  },
) {
  try {
    const { slug } = await params;
    const { userId, rating, comment } = await req.json();

    if (!userId || !rating) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const product = await prisma.product.findUnique({ where: { slug } });
    if (!product) {
      return NextResponse.json(
        {
          error: "Product not found",
        },
        { status: 404 },
      );
    }

    // upsert - one review per user per product
    const review = await prisma.review.upsert({
      where: {
        userId_productId: { userId, productId: product.id },
      },
      update: { rating, comment },
      create: { userId, productId: product.id, rating, comment },
      include: {
        user: { select: { id: true, name: true, avatar: true } },
      },
    });

    return NextResponse.json(review);
  } catch (error: any) {
    console.error("Review error: ", error?.message);
    return NextResponse.json(
      { error: "Failed to submit review" },
      { status: 500 },
    );
  }
}
