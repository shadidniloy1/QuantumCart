"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Package, Clock, Truck, CheckCircle,
  ChevronRight, Loader2, ShoppingBag,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const STATUS_CONFIG = {
  PENDING:    { label: "Pending",    color: "bg-yellow-100 text-yellow-700", icon: Clock       },
  PROCESSING: { label: "Processing", color: "bg-blue-100 text-blue-700",    icon: Package     },
  SHIPPED:    { label: "Shipped",    color: "bg-violet-100 text-violet-700", icon: Truck       },
  DELIVERED:  { label: "Delivered",  color: "bg-green-100 text-green-700",  icon: CheckCircle },
  CANCELLED:  { label: "Cancelled",  color: "bg-red-100 text-red-700",      icon: Clock       },
  REFUNDED:   { label: "Refunded",   color: "bg-gray-100 text-gray-700",    icon: Clock       },
} as const;

export default function OrdersPage() {
  const { dbUser }  = useAuth();
  const router      = useRouter();
  const [orders,   setOrders]   = useState<any[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [filter,   setFilter]   = useState<string>("ALL");

  useEffect(() => {
    if (!dbUser?.id) { setLoading(false); return; }
    fetch(`/api/orders?userId=${dbUser.id}`)
      .then((r) => r.json())
      .then((data) => setOrders(Array.isArray(data) ? data : []))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, [dbUser]);

  useEffect(() => {
    if (!loading && !dbUser) router.push("/login");
  }, [loading, dbUser]);

  const filtered = filter === "ALL"
    ? orders
    : orders.filter((o) => o.status === filter);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-violet-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Orders</h1>
        <p className="text-gray-500 text-sm mt-1">
          {orders.length} order{orders.length !== 1 ? "s" : ""} placed
        </p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
        {["ALL", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
              filter === s
                ? "bg-violet-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {s === "ALL" ? "All Orders" : STATUS_CONFIG[s as keyof typeof STATUS_CONFIG]?.label ?? s}
            {s === "ALL"
              ? ` (${orders.length})`
              : ` (${orders.filter((o) => o.status === s).length})`
            }
          </button>
        ))}
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <ShoppingBag className="w-8 h-8 text-gray-300" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {filter === "ALL" ? "No orders yet" : `No ${filter.toLowerCase()} orders`}
          </h3>
          <p className="text-gray-500 text-sm mb-6">
            {filter === "ALL"
              ? "Start shopping to see your orders here"
              : "Try a different filter"
            }
          </p>
          {filter === "ALL" && (
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 bg-violet-600 text-white font-semibold px-6 py-3 rounded-xl hover:bg-violet-700 transition-colors"
            >
              <ShoppingBag className="w-4 h-4" />
              Browse Products
            </Link>
          )}
        </div>
      )}

      {/* Orders list */}
      <div className="space-y-4">
        {filtered.map((order) => {
          const status     = STATUS_CONFIG[order.status as keyof typeof STATUS_CONFIG];
          const StatusIcon = status?.icon ?? Clock;

          return (
            <div
              key={order.id}
              className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:border-gray-200 hover:shadow-sm transition-all"
            >
              {/* Order header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 border-b border-gray-100">
                <div className="flex items-center gap-4">
                  <div>
                    <p className="text-xs text-gray-400 font-medium">Order ID</p>
                    <p className="text-sm font-mono text-gray-700">
                      #{order.id.slice(0, 8).toUpperCase()}
                    </p>
                  </div>
                  <div className="hidden sm:block h-8 w-px bg-gray-100" />
                  <div>
                    <p className="text-xs text-gray-400 font-medium">Date</p>
                    <p className="text-sm text-gray-700">
                      {new Date(order.createdAt).toLocaleDateString("en-US", {
                        month: "short", day: "numeric", year: "numeric",
                      })}
                    </p>
                  </div>
                  <div className="hidden sm:block h-8 w-px bg-gray-100" />
                  <div>
                    <p className="text-xs text-gray-400 font-medium">Total</p>
                    <p className="text-sm font-semibold text-gray-900">
                      ${order.total.toFixed(2)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold ${status?.color}`}>
                    <StatusIcon className="w-3.5 h-3.5" />
                    {status?.label}
                  </span>
                  <Link
                    href={`/orders/${order.id}`}
                    className="flex items-center gap-1 text-violet-600 text-sm font-medium hover:underline"
                  >
                    Details
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>

              {/* Order items preview */}
              <div className="px-5 py-4">
                <div className="flex items-center gap-3">
                  {/* Product image thumbnails */}
                  <div className="flex -space-x-2">
                    {order.items.slice(0, 3).map((item: any, i: number) => (
                      <div
                        key={item.id}
                        className="relative w-10 h-10 rounded-lg overflow-hidden border-2 border-white bg-gray-100 flex-shrink-0"
                        style={{ zIndex: 3 - i }}
                      >
                        <Image
                          src={item.product?.images?.[0] ?? ""}
                          alt={item.product?.name ?? ""}
                          fill
                          className="object-cover"
                          sizes="40px"
                        />
                      </div>
                    ))}
                    {order.items.length > 3 && (
                      <div className="w-10 h-10 rounded-lg border-2 border-white bg-gray-100 flex items-center justify-center text-xs font-semibold text-gray-500 flex-shrink-0">
                        +{order.items.length - 3}
                      </div>
                    )}
                  </div>

                  {/* Item names */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-700 line-clamp-1">
                      {order.items
                        .slice(0, 2)
                        .map((i: any) => i.product?.name)
                        .join(", ")}
                      {order.items.length > 2 && ` +${order.items.length - 2} more`}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {order.items.length} item{order.items.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}