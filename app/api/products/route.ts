import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const category = searchParams.get("category") ?? "";
    const search   = searchParams.get("search")   ?? "";
    const sort     = searchParams.get("sort")      ?? "featured";
    const minPrice = Number(searchParams.get("minPrice") ?? 0);
    const maxPrice = Number(searchParams.get("maxPrice") ?? 999999);
    const page     = Math.max(1, Number(searchParams.get("page")  ?? 1));
    const limit    = Math.max(1, Number(searchParams.get("limit") ?? 12));
    const skip     = (page - 1) * limit;
    const size     = searchParams.get("size")  ?? "";
    const color    = searchParams.get("color") ?? "";

    const where: any = {
      published: true,
      price: { gte: minPrice, lte: maxPrice },
    };

    if (category) where.category = { slug: category };
    if (search) {
      where.OR = [
        { name:        { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }
    if (size)  where.sizes  = { has: size  };
    if (color) where.colors = { has: color };

    let orderBy: any = { featured: "desc" };
    if (sort === "price-asc")  orderBy = { price:     "asc"  };
    if (sort === "price-desc") orderBy = { price:     "desc" };
    if (sort === "newest")     orderBy = { createdAt: "desc" };

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          category: { select: { name: true, slug: true } },
          reviews:  { select: { rating: true } },
        },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.product.count({ where }),
    ]);

    const enriched = products.map((p) => ({
      ...p,
      avgRating:
        p.reviews.length > 0
          ? p.reviews.reduce((a, r) => a + r.rating, 0) / p.reviews.length
          : 0,
      reviewCount: p.reviews.length,
    }));

    return NextResponse.json({
      products: enriched,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      hasMore:    skip + limit < total,
    });

  } catch (error: any) {
    console.error("Products API error:", error?.message);
    return NextResponse.json(
      { error: "Failed to fetch products", detail: error?.message },
      { status: 500 }
    );
  }
}