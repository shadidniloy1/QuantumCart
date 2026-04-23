"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

interface Props {
  page:       number;
  totalPages: number;
  onChange:   (page: number) => void;
}

export default function Pagination({ page, totalPages, onChange }: Props) {
  if (totalPages <= 1) return null;

  // Build page numbers to show
  const pages: (number | "...")[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (page > 3)             pages.push("...");
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
      pages.push(i);
    }
    if (page < totalPages - 2) pages.push("...");
    pages.push(totalPages);
  }

  return (
    <div className="flex items-center justify-center gap-1 mt-10">
      <button
        onClick={() => onChange(page - 1)}
        disabled={page === 1}
        className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:border-violet-300 hover:text-violet-600 disabled:opacity-30 disabled:cursor-not-allowed transition"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      {pages.map((p, i) =>
        p === "..." ? (
          <span key={`dots-${i}`} className="w-9 h-9 flex items-center justify-center text-gray-400 text-sm">
            ...
          </span>
        ) : (
          <button
            key={p}
            onClick={() => onChange(p as number)}
            className={`w-9 h-9 flex items-center justify-center rounded-lg text-sm font-medium transition-colors ${
              page === p
                ? "bg-violet-600 text-white border border-violet-600"
                : "border border-gray-200 text-gray-600 hover:border-violet-300 hover:text-violet-600"
            }`}
          >
            {p}
          </button>
        )
      )}

      <button
        onClick={() => onChange(page + 1)}
        disabled={page === totalPages}
        className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:border-violet-300 hover:text-violet-600 disabled:opacity-30 disabled:cursor-not-allowed transition"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}