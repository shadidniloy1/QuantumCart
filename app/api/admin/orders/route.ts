import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page   = Math.max(1, Number(searchParams.get("page")   ?? 1));
    const limit  = Math.max(1, Number(searchParams.get("limit")  ?? 10));
    const status = searchParams.get("status") ?? "";
    const skip   = (page - 1) * limit;

    const where: any = {};
    if (status && status !== "ALL") where.status = status;

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          user:    { select: { name: true, email: true } },
          items:   { include: { product: { select: { name: true, images: true } } } },
          address: true,
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.order.count({ where }),
    ]);

    return NextResponse.json({
      orders,
      total,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { orderId, status } = await req.json();

    const order = await prisma.order.update({
      where: { id: orderId },
      data:  { status },
    });

    return NextResponse.json(order);
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to update order status" },
      { status: 500 }
    );
  }
}