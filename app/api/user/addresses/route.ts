import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "userId required" }, { status: 400 });
    }

    const addresses = await prisma.address.findMany({
      where:   { userId },
      orderBy: { isDefault: "desc" },
    });

    return NextResponse.json(addresses);
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to fetch addresses" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const {
      userId, fullName, phone, street,
      city, state, postalCode, country, isDefault,
    } = await req.json();

    if (isDefault) {
      // Unset other defaults first
      await prisma.address.updateMany({
        where: { userId },
        data:  { isDefault: false },
      });
    }

    const address = await prisma.address.create({
      data: {
        userId, fullName, phone, street,
        city, state, postalCode, country,
        isDefault: isDefault ?? false,
      },
    });

    return NextResponse.json(address);
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to create address" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const {
      id, userId, fullName, phone, street,
      city, state, postalCode, country, isDefault,
    } = await req.json();

    if (isDefault) {
      await prisma.address.updateMany({
        where: { userId },
        data:  { isDefault: false },
      });
    }

    const address = await prisma.address.update({
      where: { id },
      data:  {
        fullName, phone, street,
        city, state, postalCode, country,
        isDefault: isDefault ?? false,
      },
    });

    return NextResponse.json(address);
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to update address" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json();
    await prisma.address.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to delete address" },
      { status: 500 }
    );
  }
}