import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { firebaseId, email, name, avatar } = await req.json();

    if (!firebaseId || !email) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const existingByEmail = await prisma.user.findUnique({
      where: { email },
    });

    if (existingByEmail && existingByEmail.firebaseId !== firebaseId) {
      const updated = await prisma.user.update({
        where: { email },
        data:  { firebaseId, name, avatar },
      });
      return NextResponse.json(updated);
    }

    const user = await prisma.user.upsert({
      where:  { firebaseId },
      update: { name, avatar },
      create: { firebaseId, email, name, avatar, role: "USER" },
    });

    return NextResponse.json(user);
  } catch (error: any) {
    console.error("Sync error:", error?.message);
    return NextResponse.json(
      { error: "Failed to sync user" },
      { status: 500 }
    );
  }
}