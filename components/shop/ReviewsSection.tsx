"use client";

import { useState } from "react";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";
import StarRating from "./StarRating";
import { toast } from "sonner";
import { Loader2, MessageSquare, Star } from "lucide-react";

interface Review {
  id:        string;
  rating:    number;
  comment:   string | null;
  createdAt: string;
  user: {
    id:     string;
    name:   string | null;
    avatar: string | null;
  };
}

interface Props {
  slug:        string;
  reviews:     Review[];
  avgRating:   number;
  onNewReview: (review: Review) => void;
}

export default function ReviewsSection({
  slug, reviews, avgRating, onNewReview,
}: Props) {
  const { dbUser } = useAuth();
  const [rating,   setRating]   = useState(5);
  const [comment,  setComment]  = useState("");
  const [loading,  setLoading]  = useState(false);
  const [showForm, setShowForm] = useState(false);

  // Rating distribution
  const distribution = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
    pct:
      reviews.length > 0
        ? (reviews.filter((r) => r.rating === star).length / reviews.length) * 100
        : 0,
  }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!dbUser) { toast.error("Please login to review"); return; }
    setLoading(true);
    try {
      const res = await fetch(`/api/products/${slug}/reviews`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: dbUser.id, rating, comment }),
      });
      if (!res.ok) throw new Error("Failed to submit");
      const newReview = await res.json();
      onNewReview(newReview);
      setComment("");
      setRating(5);
      setShowForm(false);
      toast.success("Review submitted!");
    } catch {
      toast.error("Failed to submit review");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-12">
      <h2 className="text-xl font-bold text-gray-900 mb-6">
        Customer Reviews
      </h2>

      {/* Summary */}
      {reviews.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-8 mb-8 p-6 bg-gray-50 rounded-2xl">
          <div className="text-center">
            <p className="text-5xl font-bold text-gray-900">
              {avgRating.toFixed(1)}
            </p>
            <StarRating value={Math.round(avgRating)} readonly size="md" />
            <p className="text-sm text-gray-500 mt-1">
              {reviews.length} review{reviews.length !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="flex-1 space-y-2">
            {distribution.map(({ star, count, pct }) => (
              <div key={star} className="flex items-center gap-3">
                <span className="text-xs text-gray-500 w-4">{star}</span>
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-400 rounded-full transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="text-xs text-gray-400 w-4">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Write review button */}
      {dbUser && !showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="mb-6 flex items-center gap-2 border border-violet-300 text-violet-600 font-medium px-4 py-2 rounded-xl hover:bg-violet-50 transition-colors text-sm"
        >
          <MessageSquare className="w-4 h-4" />
          Write a Review
        </button>
      )}

      {/* Review form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="mb-8 bg-white border border-gray-200 rounded-2xl p-5 space-y-4"
        >
          <h3 className="font-semibold text-gray-900">Your Review</h3>
          <div>
            <p className="text-sm text-gray-600 mb-2">Rating</p>
            <StarRating value={rating} onChange={setRating} size="lg" />
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-2">Comment (optional)</p>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              placeholder="Share your experience with this product..."
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 resize-none"
            />
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="flex-1 border border-gray-200 text-gray-600 font-medium py-2.5 rounded-xl hover:bg-gray-50 text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-violet-600 text-white font-medium py-2.5 rounded-xl hover:bg-violet-700 disabled:opacity-50 text-sm flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Submit Review
            </button>
          </div>
        </form>
      )}

      {/* Review list */}
      {reviews.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm">No reviews yet. Be the first!</p>
        </div>
      ) : (
        <div className="space-y-5">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="border-b border-gray-100 pb-5 last:border-0"
            >
              <div className="flex items-start gap-3 mb-2">
                <div className="w-9 h-9 rounded-full overflow-hidden bg-violet-100 flex-shrink-0 flex items-center justify-center text-violet-700 text-sm font-semibold">
                  {review.user.avatar ? (
                    <Image
                      src={review.user.avatar}
                      alt={review.user.name ?? "User"}
                      width={36}
                      height={36}
                      className="object-cover"
                    />
                  ) : (
                    (review.user.name?.[0] ?? "U").toUpperCase()
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-gray-900">
                      {review.user.name ?? "Anonymous"}
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date(review.createdAt).toLocaleDateString("en-US", {
                        year: "numeric", month: "short", day: "numeric",
                      })}
                    </p>
                  </div>
                  <StarRating value={review.rating} readonly size="sm" />
                </div>
              </div>
              {review.comment && (
                <p className="text-sm text-gray-600 leading-relaxed ml-12">
                  {review.comment}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}