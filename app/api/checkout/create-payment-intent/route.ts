import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2026-04-22.dahlia",
});

export async function POST(req: NextRequest){
    try {
        const {amount, currency = "usd", metadata} = await req.json();

        if(!amount || amount < 1){
            return NextResponse.json(
                {error: "inavlid amount"},
                {status: 400}
            );
        }

        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(amount * 100),
            currency,
            metadata,
            automatic_payment_methods: {enabled: true},
        });

        return NextResponse.json({
            clientSecret: paymentIntent.client_secret,
            id: paymentIntent.id,
        });
    } catch (error: any) {
    console.error("Payment intent error:", error?.message);
    return NextResponse.json(
      { error: error?.message ?? "Failed to create payment intent" },
      { status: 500 }
    );
  }
}