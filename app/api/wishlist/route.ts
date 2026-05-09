import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "userId required" },
        { status: 400 }
      );
    }

    const items = await prisma.wishlistItem.findMany({
      where:   { userId },
      include: {
        product: {
          include: {
            category: { select: { name: true, slug: true } },
            reviews:  { select: { rating: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const enriched = items.map((item) => ({
      ...item,
      product: {
        ...item.product,
        avgRating:
          item.product.reviews.length > 0
            ? item.product.reviews.reduce((a, r) => a + r.rating, 0) /
              item.product.reviews.length
            : 0,
        reviewCount: item.product.reviews.length,
      },
    }));

    return NextResponse.json(enriched);
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to fetch wishlist" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId, productId } = await req.json();
    const item = await prisma.wishlistItem.upsert({
      where:  { userId_productId: { userId, productId } },
      update: {},
      create: { userId, productId },
    });
    return NextResponse.json(item);
  } catch (error: any) {
    console.error("Wishlist POST error:", error?.message);
    return NextResponse.json(
      { error: "Failed to add to wishlist" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { userId, productId } = await req.json();
    await prisma.wishlistItem.delete({
      where: { userId_productId: { userId, productId } },
    });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Wishlist DELETE error:", error?.message);
    return NextResponse.json(
      { error: "Failed to remove from wishlist" },
      { status: 500 }
    );
  }
}