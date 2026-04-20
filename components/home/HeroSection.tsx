import Link from "next/link";
import { Sparkles, ArrowRight } from "lucide-react";

export default function HeroSection() {
  return (
    <section className="bg-white border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
        <div className="flex flex-col md:flex-row items-center justify-between gap-12">
          {/* Left Text */}
          <div className="flex-1 max-w-xl">
            <div className="inline-flex items-center gap-2 bg-violet-50 text-violet-700 text-sm font-medium px-3 py-1.5 rounded-full mb-6">
              <Sparkles className="w-3.5 h-3.5" />
              AI-powered virtual try-on
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6">
              Wear it before
              <br />
              <span className="text-violet-600">you but it</span>
            </h1>

            <p className="text-lg text-gray-500 mb-8 leading-relaxed">
              Upload your photo and see exactly how any outfit looks on you —
              powered by cutting-edge AI. Shop smarter, return less.
            </p>

            <div className="flex flex-wrap items-center gap-4">
              <Link
                href="/shop"
                className="inline-flex items-center gap-2 bg-violet-600 text-white font-semibold px-6 py-3 rounded-xl hover:bg-violet-700 transition-colors"
              >
                Shop Now
                <ArrowRight className="w-4 h-4" />
              </Link>

              <Link
                href="/shop"
                className="inline-flex items-center gap-2 border border-gray-200 text-gray-700 font-medium px-6 py-3 rounded-xl hover:border-gray-300 hover:bg-gray-50 transition-colors"
              >
                <Sparkles className="w-4 h-4 text-violet-500" />
                Try AI Look
              </Link>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-8 mt-10 pt-8 border-t border-gray-100">
              {[
                { value: "10K+", label: "Happy customers" },
                { value: "500+", label: "Products" },
                { value: "98%", label: "Satisfaction" },
              ].map((stat) => (
                <div key={stat.label}>
                  <p className="text-2xl font-bold text-gray-900">
                    {stat.value}
                  </p>
                  <p className="text-sm text-gray-500">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right visual */}
          <div className="flex-1 flex justify-center">
            <div className="relative w-full max-w-sm aspect-square">
              {/* Main image card */}
              <div className="absolute inset-0 bg-violet-50 rounded-3xl overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1483985988355-763728e1935b?w=600"
                  alt="Fashion hero"
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Floating AI badge */}
              <div className="absolute -bottom-4 -left-4 bg-white rounded-2xl shadow-lg p-4 flex items-center gap-3 border border-gray-100">
                <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-violet-600" />
                </div>

                <div>
                  <p className="text-xs font-semibold text-gray-900">
                    AI Try-On Ready
                  </p>
                  <p className="text-xs text-gray-400">Upload your photo</p>
                </div>
              </div>

              {/* Floating rating badge */}
              <div className="absolute -top-4 -right-4 bg-white rounded-2xl shadow-lg px-4 py-3 border border-gray-100">
                <p className="text-2xl font-bold text-gray-900">4.9 ⭐</p>
                <p className="text-xs text-gray-400">Customer rating</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
