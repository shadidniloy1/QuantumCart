"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Loader2, ShoppingCart } from "lucide-react";
import { toast } from "sonner";

const STATUSES = [
  "ALL","PENDING","PROCESSING","SHIPPED","DELIVERED","CANCELLED","REFUNDED",
] as const;

const STATUS_COLORS: Record<string, string> = {
  PENDING:    "bg-yellow-100 text-yellow-700",
  PROCESSING: "bg-blue-100 text-blue-700",
  SHIPPED:    "bg-violet-100 text-violet-700",
  DELIVERED:  "bg-green-100 text-green-700",
  CANCELLED:  "bg-red-100 text-red-700",
  REFUNDED:   "bg-gray-100 text-gray-700",
};

export default function AdminOrdersPage() {
  const [orders,     setOrders]     = useState<any[]>([]);
  const [total,      setTotal]      = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading,    setLoading]    = useState(true);
  const [status,     setStatus]     = useState("ALL");
  const [page,       setPage]       = useState(1);
  const [updating,   setUpdating]   = useState<string | null>(null);

  useEffect(() => {
    fetchOrders();
  }, [status, page]);

  async function fetchOrders() {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page:   String(page),
        limit:  "10",
        status,
      });
      const res  = await fetch(`/api/admin/orders?${params}`);
      const data = await res.json();
      setOrders(data.orders     ?? []);
      setTotal(data.total       ?? 0);
      setTotalPages(data.totalPages ?? 1);
    } catch {
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusChange(orderId: string, newStatus: string) {
    setUpdating(orderId);
    try {
      const res = await fetch("/api/admin/orders", {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, status: newStatus }),
      });
      if (res.ok) {
        setOrders((prev) =>
          prev.map((o) =>
            o.id === orderId ? { ...o, status: newStatus } : o
          )
        );
        toast.success("Order status updated");
      }
    } catch {
      toast.error("Failed to update order");
    } finally {
      setUpdating(null);
    }
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
        <p className="text-gray-500 text-sm mt-1">{total} total orders</p>
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-5">
        {STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => { setStatus(s); setPage(1); }}
            className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
              status === s
                ? "bg-violet-600 text-white"
                : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            {s === "ALL" ? "All" : s.charAt(0) + s.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                {["Order","Customer","Items","Total","Status","Update"].map((h) => (
                  <th
                    key={h}
                    className="text-left text-xs font-semibold text-gray-500 px-5 py-3"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {[1,2,3,4,5,6].map((j) => (
                      <td key={j} className="px-5 py-4">
                        <div className="h-4 bg-gray-100 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-gray-400">
                    <ShoppingCart className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">No orders found</p>
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr
                    key={order.id}
                    className={`hover:bg-gray-50/50 transition-colors ${
                      updating === order.id ? "opacity-50" : ""
                    }`}
                  >
                    {/* Order ID + date */}
                    <td className="px-5 py-4">
                      <p className="text-sm font-mono font-semibold text-gray-900">
                        #{order.id.slice(0, 8).toUpperCase()}
                      </p>
                      <p className="text-xs text-gray-400">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </p>
                    </td>

                    {/* Customer */}
                    <td className="px-5 py-4">
                      <p className="text-sm font-medium text-gray-900">
                        {order.user?.name ?? "Guest"}
                      </p>
                      <p className="text-xs text-gray-400">{order.user?.email}</p>
                    </td>

                    {/* Items */}
                    <td className="px-5 py-4">
                      <div className="flex -space-x-1.5">
                        {order.items?.slice(0, 3).map((item: any, i: number) => (
                          <div
                            key={item.id}
                            className="relative w-8 h-8 rounded-lg overflow-hidden border-2 border-white bg-gray-100"
                            style={{ zIndex: 3 - i }}
                          >
                            <Image
                              src={item.product?.images?.[0] ?? ""}
                              alt={item.product?.name ?? ""}
                              fill
                              className="object-cover"
                              sizes="32px"
                            />
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        {order.items?.length} item{order.items?.length !== 1 ? "s" : ""}
                      </p>
                    </td>

                    {/* Total */}
                    <td className="px-5 py-4">
                      <p className="text-sm font-bold text-gray-900">
                        ${order.total.toFixed(2)}
                      </p>
                    </td>

                    {/* Status badge */}
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold ${
                        STATUS_COLORS[order.status] ?? "bg-gray-100 text-gray-600"
                      }`}>
                        {order.status}
                      </span>
                    </td>

                    {/* Status update dropdown */}
                    <td className="px-5 py-4">
                      <select
                        value={order.status}
                        onChange={(e) =>
                          handleStatusChange(order.id, e.target.value)
                        }
                        disabled={updating === order.id}
                        className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:border-violet-400 bg-white disabled:opacity-50 cursor-pointer"
                      >
                        {STATUSES.filter((s) => s !== "ALL").map((s) => (
                          <option key={s} value={s}>
                            {s.charAt(0) + s.slice(1).toLowerCase()}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100">
            <p className="text-sm text-gray-500">
              Page {page} of {totalPages}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm disabled:opacity-30 hover:bg-gray-50"
              >
                Prev
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm disabled:opacity-30 hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}