"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Mail } from "lucide-react";

export default function NewsLetterSection() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) {
      return;
    }
    setSubmitted(true);
    toast.success("You're subscribed! Check your inbox");
    setEmail("");
  }

  return (
    <section className="py-16 bg-white border-t border-gray-100">
      <div className="max-w-2xl mx-auto px-4 text-center">
        <div className="w-12 h-12 bg-violet-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Mail className="w-6 h-6 text-violet-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Stay in the loop
        </h2>
        <p className="text-gray-500 mb-8">
          Get early access to new drops, exclusive deals, and AI feature
          updates.
        </p>

        {submitted ? (
          <p className="text-violet-600 font-medium">Thanks for subscribing!</p>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
          >
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              className="flex-1 px-4 py-3 rounded-xl border border-green-200 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition"
            />

            <button
              type="submit"
              className="bg-violet-600 text-white font-semibold px-6 py-3 rounded-xl hover:bg-violet-700 transition-colors text-sm whitespace-nowrap"
            >
              Subscribe
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
