import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET - fetch all cart items for a user
export async function GET(req: NextRequest){
  try {
    const {searchParams} = new URL(req.url);
    const userId = searchParams.get("userId");

    if(!userId){
      return NextResponse.json(
        {error: "userId required"},
        {status: 400}
      );
    }

    const items = await prisma.cartItem.findMany({
      where: {userId},
      include: {
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            price: true,
            comparePrice: true,
            images: true,
            stock: true,
          },
        },
      },
      orderBy: {createdAt: "desc"},
    });

    return NextResponse.json(items);
  } catch (error: any) {
    console.error("Cart GET error: ", error?.message);
    return NextResponse.json(
      {error: "Failed to fetch cart"},
      {status: 500}
    );
  }
}

// POST -- ADD item to cart
export async function POST(req: NextRequest){
  try {
    const {userId, productId, size, color, quantity} = await req.json();

    if(!userId || !productId || !size || !color){
      return NextResponse.json(
        {error: "Missing required feilds"},
        {status: 400}
      );
    }

    const item = await prisma.cartItem.upsert({
      where: {
        userId_productId_size_color: {userId, productId, size, color},
      },
      update: {quantity: {
        increment: quantity ?? 1
      }},
      create: {userId, productId, size, color, quantity: quantity ?? 1},
    });

    return NextResponse.json(item);
  } catch (error: any) {
    console.error("Cart POST error:", error?.message);
    return NextResponse.json(
      { error: "Failed to add to cart" },
      { status: 500 }
    );
  }
}

// PATCH -- update quantity
export async function PATCH(req: NextRequest){
  try {
    const {cartItemId, quantity} = await req.json();

    if(quantity < 1){
      return NextResponse.json(
        { error: "Quantity must be at least 1" },
        { status: 400 }
      );
    }

    const item = await prisma.cartItem.update({
      where: {id: cartItemId},
      data: {quantity},
    });

    return NextResponse.json(item);
  } catch (error: any) {
    console.error("Cart PATCH error:", error?.message);
    return NextResponse.json(
      { error: "Failed to update cart" },
      { status: 500 }
    );
  }
}

// DELETE - remove item from cart
export async function DELETE(req: NextRequest){
  try {
    const {cartItemId} = await req.json();

    await prisma.cartItem.delete(
      {where: {id: cartItemId}},
    );

    return NextResponse.json({
      success: true
    });
  } catch (error: any) {
    console.error("Cart DELETE error:", error?.message);
    return NextResponse.json(
      { error: "Failed to remove from cart" },
      { status: 500 }
    );
  }
}
