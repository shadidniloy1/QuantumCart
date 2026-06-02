import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import prisma from "@/lib/prisma";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: NextRequest) {
  try {
    const { message, history } = await req.json();

    if (!message?.trim()) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 },
      );
    }

    // Fetch some products for context
    const products = await prisma.product.findMany({
      where: { published: true },
      include: { category: { select: { name: true } } },
      take: 20,
      orderBy: { featured: "desc" },
    });

    const productContext = products
      .map(
        (p) =>
          `- ${p.name} (${p.category.name}): $${p.price.toFixed(2)}, ` +
          `sizes: ${p.sizes.join(", ")}, colors: ${p.colors.join(", ")}, ` +
          `stock: ${p.stock}, slug: ${p.slug}`,
      )
      .join("\n");

    const systemPrompt = `
You are a helpful, friendly shopping assistant for Quantum Cart — a modern AI-powered fashion e-commerce store.

Your role:
- Help customers find the right products
- Suggest sizes, colors, and styles
- Answer questions about shipping, returns, and policies
- Be concise and friendly — keep responses under 3 sentences when possible
- Use emojis occasionally to be friendly
- When recommending a product, mention its name and price

Store policies:
- Free shipping on orders over $50
- 30-day easy returns
- Secure SSL encrypted checkout
- We accept Visa, Mastercard, Amex, and PayPal

Available products (use this to make recommendations):
${productContext}

Important: Never make up products. Only recommend from the list above.
If asked about something we don't have, politely say so and suggest alternatives.
    `.trim();

    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      systemInstruction: systemPrompt,
    });

    // Build chat history for context
    const chatHistory = (history ?? [])
      .slice(-10)
      .map((msg: { role: string; content: string }) => ({
        role: msg.role === "user" ? "user" : "model",
        parts: [{ text: msg.content }],
      }));

      const chat = model.startChat({history: chatHistory});
      const result = await chat.sendMessage(message);
      const reply = result.response.text();

      return NextResponse.json({reply});
  } catch (error: any) {
    console.error("Chat error:", error?.message);
    return NextResponse.json(
      { error: "Chat failed", detail: error?.message },
      { status: 500 }
    );
  }
}
