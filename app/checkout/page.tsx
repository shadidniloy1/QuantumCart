"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ChevronRight, MapPin,
  CreditCard, CheckCircle, Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth }         from "@/context/AuthContext";
import { useCartStore }    from "@/store/cartStore";
import StripeProvider      from "@/components/checkout/StripeProvider";
import PaymentForm         from "@/components/checkout/PaymentForm";
import AddressForm,
  { type AddressData }     from "@/components/checkout/AddressForm";
import CheckoutSummary     from "@/components/checkout/CheckoutSummary";

const FREE_SHIPPING = 50;
const STEPS = ["Address", "Payment", "Confirmation"] as const;
type Step = typeof STEPS[number];

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

export default function CheckoutPage() {
  const { dbUser }   = useAuth();
  const router       = useRouter();
  const resetCart    = useCartStore((s) => s.reset);

  const [step,          setStep]          = useState<Step>("Address");
  const [items,         setItems]         = useState<CartItem[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [address,       setAddress]       = useState<AddressData | null>(null);
  const [clientSecret,  setClientSecret]  = useState("");
  const [paymentId,     setPaymentId]     = useState("");
  const [orderId,       setOrderId]       = useState("");
  const [creatingOrder, setCreatingOrder] = useState(false);

  // Calculations
  const subtotal  = items.reduce((s, i) => s + i.product.price * i.quantity, 0);
  const shipping  = subtotal >= FREE_SHIPPING ? 0 : 5.99;
  const total     = subtotal + shipping;

  // Fetch cart on load
  useEffect(() => {
    if (!dbUser?.id) { setLoading(false); return; }
    fetch(`/api/cart?userId=${dbUser.id}`)
      .then((r) => r.json())
      .then((data) => {
        const cartItems = Array.isArray(data) ? data : [];
        setItems(cartItems);
        // Redirect to cart if empty
        if (cartItems.length === 0) {
          toast.error("Your cart is empty");
          router.push("/cart");
        }
      })
      .catch(() => router.push("/cart"))
      .finally(() => setLoading(false));
  }, [dbUser]);

  // Redirect if not logged in
  useEffect(() => {
    if (!loading && !dbUser) {
      toast.error("Please login to checkout");
      router.push("/login");
    }
  }, [loading, dbUser]);

  // ── Step 1: Address submitted ────────────────
  async function handleAddressSubmit(data: AddressData) {
    setAddress(data);
    setLoading(true);
    try {
      // Create payment intent
      const res = await fetch("/api/checkout/create-payment-intent", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount:   total,
          metadata: { userId: dbUser!.id },
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setClientSecret(json.clientSecret);
      setStep("Payment");
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to initialize payment");
    } finally {
      setLoading(false);
    }
  }

  // ── Step 2: Payment succeeded ────────────────
  async function handlePaymentSuccess(stripePaymentId: string) {
    setPaymentId(stripePaymentId);
    setCreatingOrder(true);
    try {
      const res = await fetch("/api/orders", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId:          dbUser!.id,
          items,
          address,
          subtotal,
          shippingCost:    shipping,
          total,
          stripePaymentId,
        }),
      });
      const order = await res.json();
      if (!res.ok) throw new Error(order.error);
      setOrderId(order.id);
      resetCart(); // Clear cart badge in navbar
      setStep("Confirmation");
    } catch (err: any) {
      toast.error("Payment succeeded but order creation failed. Contact support.");
      console.error(err);
    } finally {
      setCreatingOrder(false);
    }
  }

  // ── Loading ──────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-violet-600 animate-spin" />
      </div>
    );
  }

  // ── Confirmation screen ──────────────────────
  if (step === "Confirmation") {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10 text-green-500" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Order Confirmed!
        </h1>
        <p className="text-gray-500 mb-2">
          Thank you for your purchase. We&apos;ll send you a confirmation
          shortly.
        </p>
        <p className="text-sm text-gray-400 mb-8">
          Order ID: <span className="font-mono text-gray-600">{orderId}</span>
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href={`/orders/${orderId}`}
            className="bg-violet-600 text-white font-semibold px-6 py-3 rounded-xl hover:bg-violet-700 transition-colors"
          >
            View Order
          </Link>
          <Link
            href="/shop"
            className="border border-gray-200 text-gray-700 font-medium px-6 py-3 rounded-xl hover:bg-gray-50 transition-colors"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  // ── Main checkout ────────────────────────────
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-400 mb-8">
        <Link href="/cart" className="hover:text-gray-600">Cart</Link>
        <ChevronRight className="w-3 h-3" />
        <span className={step === "Address" ? "text-gray-900 font-medium" : ""}>
          Address
        </span>
        <ChevronRight className="w-3 h-3" />
        <span className={step === "Payment" ? "text-gray-900 font-medium" : ""}>
          Payment
        </span>
      </nav>

      {/* Step indicators */}
      <div className="flex items-center gap-2 mb-8">
        {(["Address", "Payment"] as const).map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              step === s
                ? "bg-violet-600 text-white"
                : step === "Payment" && s === "Address"
                ? "bg-green-100 text-green-700"
                : "bg-gray-100 text-gray-400"
            }`}>
              {step === "Payment" && s === "Address"
                ? <CheckCircle className="w-4 h-4" />
                : s === "Address"
                ? <MapPin       className="w-4 h-4" />
                : <CreditCard   className="w-4 h-4" />
              }
              {s}
            </div>
            {i < 1 && <ChevronRight className="w-4 h-4 text-gray-300" />}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">

        {/* Left — form area */}
        <div className="lg:col-span-3">

          {/* ── ADDRESS STEP ─────────────────── */}
          {step === "Address" && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h2 className="font-bold text-gray-900 mb-5 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-violet-500" />
                Delivery Address
              </h2>
              <AddressForm
                onSubmit={handleAddressSubmit}
                loading={loading}
              />
              <button
                type="submit"
                form="address-form"
                disabled={loading}
                className="w-full mt-5 bg-violet-600 text-white font-semibold py-3.5 rounded-xl flex items-center justify-center gap-2 hover:bg-violet-700 disabled:opacity-40 transition-colors"
              >
                {loading
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <ChevronRight className="w-4 h-4" />
                }
                {loading ? "Processing..." : "Continue to Payment"}
              </button>
            </div>
          )}

          {/* ── PAYMENT STEP ─────────────────── */}
          {step === "Payment" && clientSecret && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h2 className="font-bold text-gray-900 mb-5 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-violet-500" />
                Payment Details
              </h2>

              {/* Address summary */}
              {address && (
                <div className="mb-5 p-4 bg-gray-50 rounded-xl">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Delivering to
                    </p>
                    <button
                      onClick={() => setStep("Address")}
                      className="text-xs text-violet-600 hover:underline"
                    >
                      Edit
                    </button>
                  </div>
                  <p className="text-sm text-gray-900 font-medium">
                    {address.fullName}
                  </p>
                  <p className="text-sm text-gray-500">
                    {address.street}, {address.city}, {address.state}{" "}
                    {address.postalCode}, {address.country}
                  </p>
                </div>
              )}

              {creatingOrder ? (
                <div className="py-8 flex flex-col items-center gap-3">
                  <Loader2 className="w-8 h-8 text-violet-600 animate-spin" />
                  <p className="text-sm text-gray-500">Creating your order...</p>
                </div>
              ) : (
                <StripeProvider clientSecret={clientSecret}>
                  <PaymentForm
                    onSuccess={handlePaymentSuccess}
                    onError={(msg) => toast.error(msg)}
                    disabled={creatingOrder}
                  />
                </StripeProvider>
              )}

              {/* Test card hint */}
              <div className="mt-4 p-3 bg-amber-50 border border-amber-100 rounded-xl">
                <p className="text-xs font-semibold text-amber-800 mb-1">
                  Test mode — use this card:
                </p>
                <p className="text-xs text-amber-700 font-mono">
                  4242 4242 4242 4242 · 12/34 · 123
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Right — order summary */}
        <div className="lg:col-span-2">
          <CheckoutSummary
            items={items}
            subtotal={subtotal}
            shipping={shipping}
            discount={0}
            total={total}
          />
        </div>
      </div>
    </div>
  );
}