import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page  = Math.max(1, Number(searchParams.get("page")  ?? 1));
    const limit = Math.max(1, Number(searchParams.get("limit") ?? 10));
    const search = searchParams.get("search") ?? "";
    const skip  = (page - 1) * limit;

    const where: any = {};
    if (search) {
      where.OR = [
        { name:        { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          category: { select: { name: true, slug: true } },
          _count:   { select: { reviews: true, orderItems: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.product.count({ where }),
    ]);

    return NextResponse.json({
      products,
      total,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      name, description, price, comparePrice,
      images, sizes, colors, stock,
      categoryId, featured, published,
    } = body;

    // Generate slug from name
    const baseSlug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    const slug = `${baseSlug}-${Date.now()}`;

    const product = await prisma.product.create({
      data: {
        name, slug, description,
        price:        Number(price),
        comparePrice: comparePrice ? Number(comparePrice) : null,
        images:       images  ?? [],
        sizes:        sizes   ?? [],
        colors:       colors  ?? [],
        stock:        Number(stock ?? 0),
        featured:     featured  ?? false,
        published:    published ?? true,
        categoryId,
      },
    });

    return NextResponse.json(product);
  } catch (error: any) {
    console.error("Create product error:", error?.message);
    return NextResponse.json(
      { error: "Failed to create product" },
      { status: 500 }
    );
  }
}