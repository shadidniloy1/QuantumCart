"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";

interface Category {
  id: string;
  name: string;
  slug: string;
  image: string | null;
  _count: { products: number };
}

// Fallback colors per category if no image
const categoryColors: Record<string, string> = {
  "t-shirts": "bg-violet-50",
  shirts: "bg-blue-50",
  pants: "bg-amber-50",
  jackets: "bg-gray-100",
  shoes: "bg-rose-50",
  accessories: "bg-teal-50",
};

export default function CategoriesSection() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((data) => {
        setCategories(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Shop by Category
            </h2>
            <p className="text-gray-500 mt-1">
              Find exactly what you're looking for
            </p>
          </div>

          <Link
            href="/categories"
            className="hidden sm:flex items-center gap-1 text-violet-600 font-medium text-sm hover:underline"
          >
            View all <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl h-32 animate-pulse"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/shop?category=${cat.slug}`}
                className="group bg-white rounded-2xl border border-gray-100 overflow-hidden hover:border-violet-200 hover:shadow-sm transition-all duration-200"
              >
                {/* Image */}
                <div
                  className={`relative h-24 ${categoryColors[cat.slug] ?? "bg-gray-50"} overflow-hidden`}
                >
                  {cat.image && (
                    <Image
                      src={cat.image}
                      alt={cat.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      sizes="200px"
                    />
                  )}
                </div>

                {/* Label */}
                <div className="p-3">
                  <p className="text-sm font-medium text-gray-900 group-hover:text-violet-600 transition-colors">
                    {cat.name}
                  </p>
                  <p className="text-xs text-gray-400">
                    {cat._count.products} items
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
