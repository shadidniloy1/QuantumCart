import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function DELETE(req: NextRequest) {
  try {
    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: "User id required" }, { status: 400 });
    }

    await prisma.cartItem.deleteMany({ where: userId });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Cart clear error:", error?.message);
    return NextResponse.json(
      { error: "Failed to clear cart" },
      { status: 500 }
    );
  }
}
