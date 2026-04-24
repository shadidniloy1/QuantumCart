import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) return NextResponse.json({ count: 0 });

    const count = await prisma.cartItem.count({
      where: { userId },
    });

    return NextResponse.json({ count });
  } catch (error: any) {
    console.error("Cart count error:", error?.message);
    return NextResponse.json({ count: 0 });
  }
}