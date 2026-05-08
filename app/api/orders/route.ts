import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const {
      userId,
      items,
      address,
      subtotal,
      shippingCost,
      total,
      stripePaymentId,
    } = await req.json();

    if (!userId || !items?.length || !address) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Create order + items + address in one transaction
    const order = await prisma.order.create({
      data: {
        userId,
        subtotal,
        shippingCost,
        total,
        stripePaymentId,
        status: "PROCESSING",
        items: {
          create: items.map((item: any) => ({
            productId: item.product.id,
            quantity: item.quantity,
            price: item.product.price,
            size: item.size,
            color: item.color,
          })),
        },
        address: {
          create: {
            fullName: address.fullName,
            phone: address.phone,
            street: address.street,
            city: address.city,
            state: address.state,
            postalCode: address.postalCode,
            country: address.country,
          },
        },
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        address: true,
      },
    });

    // clear after successfull order
    await prisma.cartItem.deleteMany({ where: { userId } });

    return NextResponse.json(order);
  } catch (error: any) {
    console.error("Order creation error:", error?.message);
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 },
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "userId required" }, { status: 400 });
    }

    const orders = await prisma.order.findMany({
      where: { userId },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
                images: true,
              },
            },
          },
        },
        address: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(orders);
  } catch (error: any) {
    console.error("Orders GET error:", error?.message);
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 },
    );
  }
}
