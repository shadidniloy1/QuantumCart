import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const [
      totalProducts,
      totalOrders,
      totalUsers,
      totalRevenue,
      recentOrders,
      ordersByStatus,
      lowStockProducts,
    ] = await Promise.all([
      prisma.product.count({ where: { published: true } }),
      prisma.order.count(),
      prisma.user.count({ where: { role: "USER" } }),
      prisma.order.aggregate({
        _sum: { total: true },
        where: { status: { not: "CANCELLED" } },
      }),
      prisma.order.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { name: true, email: true } },
          items: { include: { product: { select: { name: true } } } },
        },
      }),
      prisma.order.groupBy({
        by: ["status"],
        _count: { status: true },
      }),
      prisma.product.findMany({
        where: { stock: { lte: 10 }, published: true },
        orderBy: {stock: "asc"},
        take: 5,
        select: {id: true, name: true, stock: true, images: true},
      }),
    ]);

    return NextResponse.json({
      totalProducts,
      totalOrders,
      totalUsers,
      totalRevenue: totalRevenue._sum.total ?? 0,
      recentOrders,
      ordersByStatus,
      lowStockProducts,
    });
  } catch (error: any) {
    console.error("Stats error:", error?.message);
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}
