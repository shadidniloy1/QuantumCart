"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  Package, MapPin, CreditCard,
  CheckCircle, Clock, Truck,
  ChevronRight, Loader2,
} from "lucide-react";

const STATUS_CONFIG = {
  PENDING:    { label: "Pending",    color: "bg-yellow-100 text-yellow-700", icon: Clock       },
  PROCESSING: { label: "Processing", color: "bg-blue-100 text-blue-700",    icon: Package     },
  SHIPPED:    { label: "Shipped",    color: "bg-violet-100 text-violet-700", icon: Truck       },
  DELIVERED:  { label: "Delivered",  color: "bg-green-100 text-green-700",  icon: CheckCircle },
  CANCELLED:  { label: "Cancelled",  color: "bg-red-100 text-red-700",      icon: Clock       },
  REFUNDED:   { label: "Refunded",   color: "bg-gray-100 text-gray-700",    icon: Clock       },
} as const;

export default function OrderDetailPage() {
  const { id }    = useParams<{ id: string }>();
  const [order,   setOrder]   = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/orders/${id}`)
      .then((r) => r.json())
      .then((data) => { setOrder(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-violet-600 animate-spin" />
      </div>
    );
  }

  if (!order || order.error) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <h2 className="text-xl font-bold text-gray-900 mb-3">Order not found</h2>
        <Link href="/orders" className="text-violet-600 hover:underline">
          View all orders
        </Link>
      </div>
    );
  }

  const status = STATUS_CONFIG[order.status as keyof typeof STATUS_CONFIG];
  const StatusIcon = status.icon;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">

      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-400 mb-6">
        <Link href="/orders" className="hover:text-gray-600">My Orders</Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-gray-700 font-mono text-xs">{order.id.slice(0, 8)}...</span>
      </nav>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Order Details</h1>
          <p className="text-sm text-gray-400 mt-1">
            Placed on{" "}
            {new Date(order.createdAt).toLocaleDateString("en-US", {
              year: "numeric", month: "long", day: "numeric",
            })}
          </p>
        </div>
        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold ${status.color}`}>
          <StatusIcon className="w-4 h-4" />
          {status.label}
        </div>
      </div>

      <div className="space-y-4">

        {/* Items */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Package className="w-4 h-4 text-violet-500" />
            Items Ordered
          </h2>
          <div className="divide-y divide-gray-100">
            {order.items.map((item: any) => (
              <div key={item.id} className="flex gap-4 py-4 first:pt-0 last:pb-0">
                <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-gray-50 flex-shrink-0 border border-gray-100">
                  <Image
                    src={item.product.images?.[0] ?? ""}
                    alt={item.product.name}
                    fill
                    className="object-cover"
                    sizes="64px"
                  />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900">
                    {item.product.name}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Size: {item.size} · Color: {item.color} · Qty: {item.quantity}
                  </p>
                </div>
                <p className="text-sm font-bold text-gray-900">
                  ${(item.price * item.quantity).toFixed(2)}
                </p>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="border-t border-gray-100 mt-4 pt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Subtotal</span>
              <span>${order.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Shipping</span>
              <span className={order.shippingCost === 0 ? "text-green-600" : ""}>
                {order.shippingCost === 0 ? "Free" : `$${order.shippingCost.toFixed(2)}`}
              </span>
            </div>
            <div className="flex justify-between font-bold text-base pt-2 border-t border-gray-100">
              <span>Total</span>
              <span>${order.total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Address */}
        {order.address && (
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-violet-500" />
              Delivery Address
            </h2>
            <p className="text-sm font-semibold text-gray-900">
              {order.address.fullName}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {order.address.street}<br />
              {order.address.city}, {order.address.state} {order.address.postalCode}<br />
              {order.address.country}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {order.address.phone}
            </p>
          </div>
        )}

        {/* Payment info */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-violet-500" />
            Payment
          </h2>
          <p className="text-sm text-gray-500">
            Payment ID:{" "}
            <span className="font-mono text-gray-700 text-xs">
              {order.stripePaymentId ?? "N/A"}
            </span>
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Link
            href="/orders"
            className="flex-1 border border-gray-200 text-gray-700 font-medium py-3 rounded-xl text-center hover:bg-gray-50 transition-colors text-sm"
          >
            All Orders
          </Link>
          <Link
            href="/shop"
            className="flex-1 bg-violet-600 text-white font-semibold py-3 rounded-xl text-center hover:bg-violet-700 transition-colors text-sm"
          >
            Shop Again
          </Link>
        </div>
      </div>
    </div>
  );
}