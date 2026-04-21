import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest){
    try {
        const {userId, productId, size, color, quantity} = await req.json();

        const item = await prisma.cartItem.upsert({
            where: {
                userId_productId_size_color: {userId, productId, size, color},
            },
            update: {quantity: {
                increment: quantity
            }},
            create: {userId, productId, size, color, quantity},
        });

        return NextResponse.json(item);
    } catch (error) {
        return NextResponse.json(
            {error: "Failed to add to cart"},
            {status: 500}
        );
    }
}