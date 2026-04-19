"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Heart, ShoppingBag, Star } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  comparePrice: number | null;
  images: string[];
  sizes: string[];
  colors: string[];
  category: { name: string; slug: string };
  avgRating: number;
  reviewCount: number;
}

export default function ProductCard({ product }: { product: Product }) {
  const { dbUser } = useAuth();
  const [wishlisted, setWishlisted] = useState(false);
  const [adding, setAdding] = useState(false);

  const discount = product.comparePrice
    ? Math.round(
        ((product.comparePrice - product.price) / product.comparePrice) * 100,
      )
    : null;

  async function handleAddToCart(e: React.MouseEvent) {
    e.preventDefault();
    if (!dbUser) {
      toast.error("Please login first");
      return;
    }
    setAdding(true);

    try {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: dbUser.id,
          productId: product.id,
          size: product.sizes[0],
          color: product.colors[0],
          quantity: 1,
        }),
      });

      if (res.ok) toast.success("Added to cart!");
    } catch {
      toast.error("Something went wrong");
    } finally {
      setAdding(false);
    }
  }

  async function handleWishlist(e: React.MouseEvent) {
    e.preventDefault();
    if (!dbUser) {
      toast.error("Please login first");
      return;
    }

    try {
      const res = await fetch("api/wishlist", {
        method: wishlisted ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: dbUser.id,
          productId: product.id,
        }),
      });

      if (res.ok) {
        setWishlisted(wishlisted);
        toast.success(
          wishlisted ? "Removed from wishlist" : "Added to wishlist",
        );
      }
    } catch {
      toast.error("Something went wrong");
    }
  }

  return (
    <Link href={`/shop/${product.slug}`} className="group block">
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:border-gray-200 hover:shadow-md transition-all duration-200">
        {/* Image */}
        <div className="relative aspect-square overflow-hidden bg-gray-50">
          <Image
            src={product.images[0]}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 768px) 50vw, 25vw"
          />

          {/* Discount badge */}
          {discount && (
            <span className="absolute top-2 left-2 bg-red-500 text-white text-xs font-semibold px-2 py-0.5 rounded-full">
              -{discount}%
            </span>
          )}

          {/* Wishlist button */}
          <button
            onClick={handleWishlist}
            className="absolute top-2 right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm opacity-0 group-hover:opacity-100 transition-opacity hover:scale-110"
          >
            <Heart
              className={`w-4 h-4 transition-colors ${
                wishlisted ? "fill-red-500 text-red-500" : "text-gray-400"
              }`}
            />
          </button>

          {/* Quick add to cart */}
          <div className="absolute bottom-0 left-0 right-0 p-2 translate-y-full group-hover:translate-y-0 transition-transform duration-200">
            <button
              onClick={handleAddToCart}
              disabled={adding}
              className="w-full bg-gray-900 text-white text-xs font-medium py-2 rounded-xl flex items-center justify-center gap-2 hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              {adding ? "Adding..." : "Quick Add"}
            </button>
          </div>
        </div>

        {/* Info */}
        <div className="p-3">
          <p className="text-xs text-gray-400 mb-0.5">
            {product.category.name}
          </p>
          <p className="text-sm font-medium text-gray-900 line-clamp-1 mb-1">
            {product.name}
          </p>

          {/* Rating */}
          {product.reviewCount > 0 && (
            <div className="flex items-center gap-1 mb-2">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              <span className="text-xs text-gray-500">
                {product.avgRating.toFixed(1)} ({product.reviewCount})
              </span>
            </div>
          )}

          {/* Price */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-gray-900">
              ${product.price.toFixed(2)}
            </span>
            {product.comparePrice && (
              <span className="text-xs text-gray-400 line-through">
                ${product.comparePrice.toFixed(2)}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
