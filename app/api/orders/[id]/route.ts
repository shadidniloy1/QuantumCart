import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const order = await prisma.order.findUnique({
      where:   { id },
      include: {
        items: {
          include: {
            product: {
              select: {
                id:     true,
                name:   true,
                slug:   true,
                images: true,
                price:  true,
              },
            },
          },
        },
        address: true,
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(order);
  } catch (error: any) {
    console.error("Order GET error:", error?.message);
    return NextResponse.json(
      { error: "Failed to fetch order" },
      { status: 500 }
    );
  }
}