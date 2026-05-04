"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ShoppingBag, Trash2, Plus, Minus,
  ArrowRight, Tag, ShieldCheck, ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { useCartStore } from "@/store/cartStore";
import { Skeleton } from "@/components/ui/skeleton";

interface CartItem {
  id:       string;
  quantity: number;
  size:     string;
  color:    string;
  product: {
    id:           string;
    name:         string;
    slug:         string;
    price:        number;
    comparePrice: number | null;
    images:       string[];
    stock:        number;
  };
}

const FREE_SHIPPING_THRESHOLD = 50;

export default function CartPage() {
  const { dbUser }   = useAuth();
  const router       = useRouter();
  const setCartCount = useCartStore((s) => s.setCount);

  const [items,    setItems]    = useState<CartItem[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [coupon,   setCoupon]   = useState("");
  const [discount, setDiscount] = useState(0);
  const [couponApplied, setCouponApplied] = useState(false);
  const [updating, setUpdating] = useState<string | null>(null);

  // ── Fetch cart ──────────────────────────────
  useEffect(() => {
    if (!dbUser?.id) {
      setLoading(false);
      return;
    }
    fetchCart();
  }, [dbUser]);

  async function fetchCart() {
    try {
      const res  = await fetch(`/api/cart?userId=${dbUser!.id}`);
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  // ── Calculations ────────────────────────────
  const subtotal = items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );
  const shipping      = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : 5.99;
  const discountAmt   = (subtotal * discount) / 100;
  const total         = subtotal + shipping - discountAmt;

  const totalItems    = items.reduce((sum, item) => sum + item.quantity, 0);
  const toFreeShipping = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);

  // ── Handlers ────────────────────────────────
  async function handleQuantityChange(
    itemId: string,
    currentQty: number,
    delta: number
  ) {
    const newQty = currentQty + delta;
    if (newQty < 1) { handleRemove(itemId); return; }

    setUpdating(itemId);
    try {
      const res = await fetch("/api/cart", {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cartItemId: itemId, quantity: newQty }),
      });
      if (res.ok) {
        setItems((prev) =>
          prev.map((i) => i.id === itemId ? { ...i, quantity: newQty } : i)
        );
      }
    } catch {
      toast.error("Failed to update quantity");
    } finally {
      setUpdating(null);
    }
  }

  async function handleRemove(itemId: string) {
    setUpdating(itemId);
    try {
      const res = await fetch("/api/cart", {
        method:  "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cartItemId: itemId }),
      });
      if (res.ok) {
        setItems((prev) => prev.filter((i) => i.id !== itemId));
        setCartCount(Math.max(0, totalItems - 1));
        toast.success("Item removed");
      }
    } catch {
      toast.error("Failed to remove item");
    } finally {
      setUpdating(null);
    }
  }

  async function handleClearCart() {
    if (!dbUser?.id) return;
    if (!confirm("Clear entire cart?")) return;
    try {
      await fetch("/api/cart/clear", {
        method:  "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: dbUser.id }),
      });
      setItems([]);
      setCartCount(0);
      toast.success("Cart cleared");
    } catch {
      toast.error("Failed to clear cart");
    }
  }

  function handleApplyCoupon() {
    const valid: Record<string, number> = {
      SAVE10: 10,
      SAVE20: 20,
      NEWUSER: 15,
    };
    const code = coupon.trim().toUpperCase();
    if (valid[code]) {
      setDiscount(valid[code]);
      setCouponApplied(true);
      toast.success(`Coupon applied! ${valid[code]}% off`);
    } else {
      toast.error("Invalid coupon code");
    }
  }

  function handleCheckout() {
    if (!dbUser) { toast.error("Please login first"); return; }
    if (items.length === 0) { toast.error("Your cart is empty"); return; }
    router.push("/checkout");
  }

  // ── Not logged in ───────────────────────────
  if (!loading && !dbUser) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <div className="w-20 h-20 bg-violet-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <ShoppingBag className="w-10 h-10 text-violet-400" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-3">
          Sign in to view your cart
        </h2>
        <p className="text-gray-500 mb-6">
          You need to be logged in to access your cart.
        </p>
        <Link
          href="/login"
          className="inline-flex items-center gap-2 bg-violet-600 text-white font-semibold px-6 py-3 rounded-xl hover:bg-violet-700 transition-colors"
        >
          Sign In
        </Link>
      </div>
    );
  }

  // ── Empty cart ──────────────────────────────
  if (!loading && items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <ShoppingBag className="w-10 h-10 text-gray-300" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-3">
          Your cart is empty
        </h2>
        <p className="text-gray-500 mb-6">
          Looks like you haven&apos;t added anything yet.
        </p>
        <Link
          href="/shop"
          className="inline-flex items-center gap-2 bg-violet-600 text-white font-semibold px-6 py-3 rounded-xl hover:bg-violet-700 transition-colors"
        >
          <ShoppingBag className="w-4 h-4" />
          Start Shopping
        </Link>
      </div>
    );
  }

  // ── Main render ─────────────────────────────
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Shopping Cart</h1>
          <p className="text-gray-500 text-sm mt-1">
            {loading ? "Loading..." : `${totalItems} item${totalItems !== 1 ? "s" : ""}`}
          </p>
        </div>
        {items.length > 0 && (
          <button
            onClick={handleClearCart}
            className="text-sm text-red-500 hover:text-red-600 font-medium hover:underline"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Free shipping progress */}
      {!loading && toFreeShipping > 0 && (
        <div className="mb-6 bg-amber-50 border border-amber-100 rounded-xl p-4">
          <p className="text-sm text-amber-800 mb-2">
            Add <span className="font-semibold">${toFreeShipping.toFixed(2)}</span> more
            for <span className="font-semibold">free shipping!</span>
          </p>
          <div className="w-full bg-amber-200 rounded-full h-1.5">
            <div
              className="bg-amber-500 h-1.5 rounded-full transition-all"
              style={{ width: `${Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD) * 100)}%` }}
            />
          </div>
        </div>
      )}
      {!loading && toFreeShipping === 0 && (
        <div className="mb-6 bg-green-50 border border-green-100 rounded-xl p-4">
          <p className="text-sm text-green-700 font-medium">
            🎉 You qualify for free shipping!
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Cart Items ─────────────────────── */}
        <div className="lg:col-span-2 space-y-4">

          {/* Items card */}
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            {loading ? (
              <div className="p-6 space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex gap-4">
                    <Skeleton className="w-20 h-20 rounded-xl flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                      <Skeleton className="h-8 w-1/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className={`flex gap-4 p-5 transition-opacity ${
                      updating === item.id ? "opacity-50" : ""
                    }`}
                  >
                    {/* Product image */}
                    <Link
                      href={`/shop/${item.product.slug}`}
                      className="relative w-20 h-20 rounded-xl overflow-hidden bg-gray-50 flex-shrink-0 border border-gray-100"
                    >
                      <Image
                        src={item.product.images?.[0] ?? ""}
                        alt={item.product.name}
                        fill
                        className="object-cover"
                        sizes="80px"
                      />
                    </Link>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <Link
                            href={`/shop/${item.product.slug}`}
                            className="text-sm font-semibold text-gray-900 hover:text-violet-600 transition-colors line-clamp-1"
                          >
                            {item.product.name}
                          </Link>
                          <p className="text-xs text-gray-400 mt-0.5">
                            Size: {item.size} · Color: {item.color}
                          </p>
                        </div>
                        {/* Remove button */}
                        <button
                          onClick={() => handleRemove(item.id)}
                          className="text-gray-300 hover:text-red-400 transition-colors flex-shrink-0 mt-0.5"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="flex items-center justify-between mt-3">
                        {/* Quantity control */}
                        <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                          <button
                            onClick={() =>
                              handleQuantityChange(item.id, item.quantity, -1)
                            }
                            disabled={updating === item.id}
                            className="w-8 h-8 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors disabled:opacity-30"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-8 h-8 flex items-center justify-center text-sm font-semibold">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() =>
                              handleQuantityChange(item.id, item.quantity, 1)
                            }
                            disabled={
                              updating === item.id ||
                              item.quantity >= item.product.stock
                            }
                            className="w-8 h-8 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors disabled:opacity-30"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        {/* Price */}
                        <div className="text-right">
                          <p className="text-sm font-bold text-gray-900">
                            ${(item.product.price * item.quantity).toFixed(2)}
                          </p>
                          {item.quantity > 1 && (
                            <p className="text-xs text-gray-400">
                              ${item.product.price.toFixed(2)} each
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Coupon code */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <p className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Tag className="w-4 h-4 text-violet-500" />
              Coupon Code
            </p>
            {couponApplied ? (
              <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-xl px-4 py-3">
                <p className="text-sm text-green-700 font-medium">
                  Coupon applied: {discount}% off
                </p>
                <button
                  onClick={() => {
                    setDiscount(0);
                    setCouponApplied(false);
                    setCoupon("");
                  }}
                  className="text-xs text-red-500 hover:underline"
                >
                  Remove
                </button>
              </div>
            ) : (
              <div className="flex gap-3">
                <input
                  type="text"
                  value={coupon}
                  onChange={(e) => setCoupon(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === "Enter" && handleApplyCoupon()}
                  placeholder="Enter coupon code (try SAVE10)"
                  className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
                />
                <button
                  onClick={handleApplyCoupon}
                  disabled={!coupon.trim()}
                  className="bg-violet-600 text-white font-medium px-5 py-2.5 rounded-xl hover:bg-violet-700 disabled:opacity-40 transition-colors text-sm whitespace-nowrap"
                >
                  Apply
                </button>
              </div>
            )}
            <p className="text-xs text-gray-400 mt-2">
              Try: SAVE10, SAVE20, NEWUSER
            </p>
          </div>

          {/* Continue shopping */}
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 text-violet-600 text-sm font-medium hover:underline"
          >
            <ChevronRight className="w-4 h-4 rotate-180" />
            Continue Shopping
          </Link>
        </div>

        {/* ── Order Summary ──────────────────── */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 p-6 sticky top-24">
            <h2 className="font-bold text-gray-900 mb-5">Order Summary</h2>

            <div className="space-y-3 mb-5">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">
                  Subtotal ({totalItems} item{totalItems !== 1 ? "s" : ""})
                </span>
                <span className="font-medium text-gray-900">
                  ${subtotal.toFixed(2)}
                </span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Shipping</span>
                <span className={`font-medium ${shipping === 0 ? "text-green-600" : "text-gray-900"}`}>
                  {shipping === 0 ? "Free" : `$${shipping.toFixed(2)}`}
                </span>
              </div>

              {discountAmt > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Discount ({discount}%)</span>
                  <span className="font-medium text-green-600">
                    −${discountAmt.toFixed(2)}
                  </span>
                </div>
              )}
            </div>

            <div className="border-t border-gray-100 pt-4 mb-5">
              <div className="flex justify-between">
                <span className="font-bold text-gray-900">Total</span>
                <span className="font-bold text-xl text-gray-900">
                  ${total.toFixed(2)}
                </span>
              </div>
              {discountAmt > 0 && (
                <p className="text-xs text-green-600 text-right mt-1">
                  You save ${discountAmt.toFixed(2)}!
                </p>
              )}
            </div>

            {/* Checkout button */}
            <button
              onClick={handleCheckout}
              disabled={items.length === 0 || loading}
              className="w-full bg-violet-600 text-white font-semibold py-3.5 rounded-xl flex items-center justify-center gap-2 hover:bg-violet-700 disabled:opacity-40 transition-colors"
            >
              Proceed to Checkout
              <ArrowRight className="w-4 h-4" />
            </button>

            {/* Security badge */}
            <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-400">
              <ShieldCheck className="w-4 h-4 text-green-500" />
              Secure checkout · SSL encrypted
            </div>

            {/* Payment icons */}
            <div className="mt-4 flex items-center justify-center gap-3">
              {["VISA", "MC", "AMEX", "PayPal"].map((brand) => (
                <div
                  key={brand}
                  className="px-2 py-1 border border-gray-200 rounded text-xs font-semibold text-gray-400"
                >
                  {brand}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}