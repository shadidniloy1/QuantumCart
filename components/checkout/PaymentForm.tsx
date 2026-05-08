"use client";

import { useState } from "react";
import {
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { Loader2, ShieldCheck } from "lucide-react";

interface Props {
  onSuccess: (paymentIntentId: string) => void;
  onError:   (msg: string) => void;
  disabled:  boolean;
}

export default function PaymentForm({ onSuccess, onError, disabled }: Props) {
  const stripe   = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements || disabled) return;

    setProcessing(true);
    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        redirect: "if_required",
      });

      if (error) {
        onError(error.message ?? "Payment failed");
      } else if (paymentIntent?.status === "succeeded") {
        onSuccess(paymentIntent.id);
      } else {
        onError("Unexpected payment status: " + paymentIntent?.status);
      }
    } catch (err: any) {
      onError(err?.message ?? "Payment error");
    } finally {
      setProcessing(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <PaymentElement
        options={{
          layout: "tabs",
        }}
      />

      <div className="flex items-center gap-2 text-xs text-gray-400">
        <ShieldCheck className="w-4 h-4 text-green-500 flex-shrink-0" />
        Your payment info is encrypted and secure. We never store card details.
      </div>

      <button
        type="submit"
        disabled={!stripe || !elements || processing || disabled}
        className="w-full bg-violet-600 text-white font-semibold py-3.5 rounded-xl flex items-center justify-center gap-2 hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        {processing && <Loader2 className="w-4 h-4 animate-spin" />}
        {processing ? "Processing..." : "Pay Now"}
      </button>
    </form>
  );
}