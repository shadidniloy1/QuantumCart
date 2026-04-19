import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      where: { featured: true, published: true },
      include: {
        category: { select: { name: true, slug: true } },
        reviews: {
          select: {
            rating: true,
          },
        },
      },
      take: 8,
      orderBy: { createdAt: "desc" },
    });

    const enriched = products.map((p) => ({
      ...p,
      avgRating:
        p.reviews.length > 0
          ? p.reviews.reduce((a, r) => a + r.rating, 0) / p.reviews.length
          : 0,
      reviewCount: p.reviews.length,
    }));

    return NextResponse.json(enriched);
  } catch (error) {
    return NextResponse.json(
        {error: "Failed to fetch featured products"},
        {status: 500}
    );
  }
}
