"use client";

import { ReactNode, useEffect, useState } from "react";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe, type StripeElementsOptions } from "@stripe/stripe-js";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

interface Props {
  clientSecret: string;
  children:     ReactNode;
}

export default function StripeProvider({ clientSecret, children }: Props) {
  const options: StripeElementsOptions = {
    clientSecret,
    appearance: {
      theme:     "stripe",
      variables: {
        colorPrimary:       "#7c3aed",
        colorBackground:    "#ffffff",
        colorText:          "#111827",
        colorDanger:        "#dc2626",
        fontFamily:         "Inter, sans-serif",
        borderRadius:       "12px",
        spacingUnit:        "4px",
      },
    },
  };

  return (
    <Elements stripe={stripePromise} options={options}>
      {children}
    </Elements>
  );
}