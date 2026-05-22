"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Package,
  ShoppingCart,
  Users,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  Clock,
  Loader2,
} from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-700",
  PROCESSING: "bg-blue-100 text-blue-700",
  SHIPPED: "bg-violet-100 text-violet-700",
  DELIVERED: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-700",
  REFUNDED: "bg-gray-100 text-gray-700",
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => r.json())
      .then((d) => {
        setStats(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 text-violet-600 animate-spin" />
      </div>
    );
  }

  const statCards = [
    {
      label: "Total Revenue",
      value: `$${(stats?.totalRevenue ?? 0).toFixed(2)}`,
      icon: DollarSign,
      color: "bg-green-50 text-green-600",
      change: "+12% this month",
    },
    {
      label: "Total Orders",
      value: stats?.totalOrders ?? 0,
      icon: ShoppingCart,
      color: "bg-blue-50 text-blue-600",
      change: "All time",
    },
    {
      label: "Products",
      value: stats?.totalProducts ?? 0,
      icon: Package,
      color: "bg-violet-50 text-violet-600",
      change: "Published",
    },
    {
      label: "Customers",
      value: stats?.totalUsers ?? 0,
      icon: Users,
      color: "bg-amber-50 text-amber-600",
      change: "Registered users",
    },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">
          Welcome back! Here&apos;s what&apos;s happening.
        </p>
      </div>

      {/* Stat card */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map(({ label, value, icon: Icon, color, change }) => (
          <div
            key={label}
            className="bg-white rounded-2xl border border-gray-100 p-5"
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-gray-500 font-medium">{label}</p>
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center ${color}`}
              >
                <Icon className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-green-500" />
              {change}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent orders */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-bold text-gray-900">Recent Orders</h2>
            <Link
              href="/admin/orders"
              className="text-sm text-violet-600 hover:underline font-medium"
            >
              View all
            </Link>
          </div>

          {stats?.recentOrders?.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">
              No orders yet
            </p>
          ) : (
            <div className="space-y-3">
              {stats?.recentOrders?.map((order: any) => (
                <Link
                  key={order.id}
                  href={`/admin/orders`}
                  className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  <div className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <ShoppingCart className="w-4 h-4 text-gray-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900">
                      {order.user?.name ?? order.user?.email ?? "Guest"}
                    </p>
                    <p className="text-xs text-gray-400">
                      {order.items?.length ?? 0} item
                      {(order.items?.length ?? 0) !== 1 ? "s" : ""} ·{" "}
                      {new Date(order.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-bold text-gray-900">
                      ${order.total.toFixed(2)}
                    </p>
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        STATUS_COLORS[order.status] ??
                        "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {order.status}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Low Stock */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-bold text-gray-900 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              Low Stock
            </h2>
            <Link
              href="/admin/products"
              className="text-sm text-violet-600 hover:underline"
            >
              View all
            </Link>
          </div>

          {stats?.lowStockProducts?.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">
              All products well stocked!
            </p>
          ) : (
            <div className="space-y-3">
              {stats?.lowStockProducts?.map((product: any) => (
                <div key={product.id} className="flex items-center gap-3">
                  <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                    <Image
                      src={product.images?.[0] ?? ""}
                      alt={product.name}
                      fill
                      className="object-cover"
                      sizes="40px"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 line-clamp-1">
                      {product.name}
                    </p>
                    <p
                      className={`text-xs font-semibold ${
                        product.stock === 0
                          ? "text-red-500"
                          : product.stock <= 5
                            ? "text-amber-500"
                            : "text-gray-400"
                      }`}
                    >
                      {product.stock === 0
                        ? "Out of stock"
                        : `${product.stock} left`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Order status breakdown */}
      {stats?.ordersByStatus?.length > 0 && (
        <div className="mt-6 bg-white rounded-2xl border border-gray-100 p-5">
          <h2 className="font-bold text-gray-900 mb-5">Orders by Status</h2>
          <div className="flex flex-wrap gap-3">
            {stats.ordersByStatus.map((s: any) => (
              <div
                key={s.status}
                className={`px-4 py-2.5 rounded-xl text-sm font-semibold ${
                  STATUS_COLORS[s.status] ?? "bg-gray-100 text-gray-600"
                }`}
              >
                {s.status}: {s._count.status}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
