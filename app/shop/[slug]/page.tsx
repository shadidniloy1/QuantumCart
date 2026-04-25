"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ShoppingBag,
  Heart,
  Share2,
  Sparkles,
  ChevronRight,
  Truck,
  RotateCcw,
  ShieldCheck,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import ImageGallery from "@/components/shop/ImageGallery";
import StarRating from "@/components/shop/StarRating";
import ReviewsSection from "@/components/shop/ReviewsSection";
import TryOnModal from "@/components/shop/TryOnModal";
import { Skeleton } from "@/components/ui/skeleton";
import ProductCard from "@/components/shop/ProductCard";

export default function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { dbUser } = useAuth();

  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [related, setRelated] = useState<any[]>([]);
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [addingCart, setAddingCart] = useState(false);
  const [wishlisted, setWishlisted] = useState(false);
  const [tryOnOpen, setTryOnOpen] = useState(false);

  //   Fetch
  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    fetch(`/api/products/${slug}`)
      .then((r) => r.json())
      .then((data) => {
        setProduct(data);
        // Set defaults
        if (data.sizes?.length) setSelectedSize(data.sizes[0]);
        if (data.colors?.length) setSelectedColor(data.colors[0]);
        setLoading(false);

        // Fetch related products
        return fetch(`/api/products?category=${data.category?.slug}&limit=4`);
      })
      .then((r) => r?.json())
      .then((data) =>
        setRelated(data.products?.filter((p: any) => p.slug !== slug) ?? []),
      )
      .catch(() => setLoading(false));
  }, [slug]);

  async function handleAddToCart() {
    if (!dbUser) {
      toast.error("Please login first");
      return;
    }
    if (!selectedSize) {
      toast.error("Please select a size");
      return;
    }
    if (!selectedColor) {
      toast.error("Please select a color");
      return;
    }
    setAddingCart(true);

    try {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: dbUser.id,
          productId: product.id,
          size: selectedSize,
          color: selectedColor,
          quantity,
        }),
      });
      if (res.ok) toast.success("Added to cart!");
      else toast.error("Failed to add to cart");
    } catch {
      toast.error("Something went wrong");
    } finally {
      setAddingCart(false);
    }
  }

  async function handleWishlist() {
    if (!dbUser) {
      toast.error("Please login first");
      return;
    }
    try {
      const res = await fetch("/api/wishlist", {
        method: wishlisted ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: dbUser.id,
          productId: product.id,
        }),
      });
      if (res.ok) {
        setWishlisted(!wishlisted);
        toast.success(
          wishlisted ? "Removed from wishlist" : "Added to wishlist",
        );
      }
    } catch {
      toast.error("Something went wrong");
    }
  }

  function handleShare() {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Link copied to clipboard!");
  }

  //   Loading skeleton
  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <Skeleton className="aspect-square rounded-2xl" />
          <div className="space-y-4">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-6 w-1/4" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!product || product.console.error) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-3">
          Product not found
        </h2>
        <Link href="/shop" className="text-violet-600 hover:underline">
          Back to shop
        </Link>
      </div>
    );
  }

  const discount = product.comparePrice
    ? Math.round(
        ((product.comparePrice - product.price) / product.comparePrice) * 100,
      )
    : null;

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-400 mb-6">
          <Link href="/" className="hover:text-gray-600">
            Home
          </Link>
          <ChevronRight className="w-3 h-3" />
          <Link href="/shop" className="hover:text-gray-600">
            Shop
          </Link>
          <ChevronRight className="w-3 h-3" />
          <Link
            href={`/shop?category=${product.category?.slug}`}
            className="hover:text-gray-600"
          >
            {product.category?.name}
          </Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-gray-700 line-clamp-1">{product.name}</span>
        </nav>

        {/* Main content */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-16">
          {/* Left - image gallery */}
          <ImageGallery />

          {/* Right - Product info */}
          <div className="flex flex-col gap-5">
            {/* Category + share */}
            <div className="flex items-center justify-between">
              <Link
                href={`/shop?category=${product.category?.slug}`}
                className="text-xs font-semibold text-violet-600 bg-violet-50 px-3 py-1 rounded-full hover:bg-violet-100 transition-colors"
              >
                {product.category?.name}
              </Link>
              <button
                onClick={handleShare}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
              >
                <Share2 className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            {/* Name */}
            <h1 className="text-2xl font-bold text-gray-900 leading-tight">{product.name}</h1>

            {/* Rating */}
            
          </div>
        </div>
      </div>
    </>
  );
}
