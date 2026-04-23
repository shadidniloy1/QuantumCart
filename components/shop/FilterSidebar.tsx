"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { X, ChevronDown, ChevronUp } from "lucide-react";

interface Category {
  id: string;
  name: string;
  slug: string;
  _count: { products: number };
}

const SIZES = ["XS", "S", "M", "L", "XL", "XXL"];
const COLORS = [
  { label: "Black", value: "Black", hex: "#1a1a1a" },
  { label: "White", value: "White", hex: "#f9fafb" },
  { label: "Navy", value: "Navy", hex: "#1e3a5f" },
  { label: "Gray", value: "Gray", hex: "#9ca3af" },
  { label: "Red", value: "Red", hex: "#dc2626" },
  { label: "Blue", value: "Blue", hex: "#2563eb" },
  { label: "Green", value: "Green", hex: "#16a34a" },
  { label: "Beige", value: "Beige", hex: "#d4b483" },
];

interface Filters {
  category: string;
  minPrice: number;
  maxPrice: number;
  size: string;
  color: string;
}

interface Props {
  filters: Filters;
  onChange: (filters: Filters) => void;
  onClose?: () => void;
}

// --- Collapsible section helper
function FilterSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(true);

  return (
    <div className="border-b border-gray-100 pb-4 mb-4 last:border-0 last:mb-0 last:pb-0">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full mb-3"
      >
        <span className="text-sm font-semibold text-gray-900">{title}</span>
        {open ? (
          <ChevronUp className="w-4 h-4 text-gray-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-400" />
        )}
      </button>
      {open && children}
    </div>
  );
}

export default function FilterSidebar({ filters, onChange, onClose }: Props) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [localMin, setLocalMin] = useState(filters.minPrice);
  const [localMax, setLocalMax] = useState(filters.maxPrice);

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then(setCategories)
      .catch(() => {});
  }, []);

  function update(key: keyof Filters, value: any) {
    onChange({ ...filters, [key]: value });
  }

  function clearAll() {
    onChange({ category: "", minPrice: 0, maxPrice: 500, size: "", color: "" });
    setLocalMin(0);
    setLocalMax(500);
  }

  const hasActiveFilters =
    filters.category ||
    filters.size ||
    filters.color ||
    filters.minPrice > 0 ||
    filters.maxPrice < 500;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-semibold text-gray-900">Filters</h3>
        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <button
              onClick={clearAll}
              className="text-xs text-violet-600 hover:underline font-medium"
            >
              Clear all
            </button>
          )}
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Category */}
      <FilterSection title="Category">
        <div className="space-y-1.5">
          <button
            onClick={() => update("category", "")}
            className={`w-full text-left flex items-center justify-between px-2 py-1.5 rounded-lg text-sm transition-colors ${
              !filters.category
                ? "bg-violet-50 text-violet-700 font-medium"
                : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            <span>All Categories</span>
            <span className="text-xs text-gray-400">
              {categories.reduce((a, c) => a + c._count.products, 0)}
            </span>
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => update("category", cat.slug)}
              className={`w-full text-left flex items-center justify-between px-2 py-1.5 rounded-lg text-sm transition-colors ${
                filters.category === cat.slug
                  ? "bg-violet-50 text-violet-700 font-medium"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <span>{cat.name}</span>
              <span className="text-xs text-gray-400">
                {cat._count.products}
              </span>
            </button>
          ))}
        </div>
      </FilterSection>

      {/* Price */}
      <FilterSection title="Price Range">
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">${localMin}</span>
            <span className="text-gray-500">${localMax}</span>
          </div>
          <input
            type="range"
            min={0}
            max={500}
            step={10}
            value={localMax}
            onChange={(e) => setLocalMax(Number(e.target.value))}
            onMouseUp={() => update("maxPrice", localMax)}
            onTouchEnd={() => update("maxPrice", localMax)}
            className="w-full accent-violet-600"
          />
          <div className="flex gap-2">
            <input
              type="number"
              value={localMin}
              min={0}
              max={localMax}
              onChange={(e) => setLocalMin(Number(e.target.value))}
              onBlur={() => update("minPrice", localMin)}
              className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-violet-400"
              placeholder="Min"
            />
            <input
              type="number"
              value={localMax}
              min={localMin}
              max={500}
              onChange={(e) => setLocalMax(Number(e.target.value))}
              onBlur={() => update("maxPrice", localMax)}
              className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-violet-400"
              placeholder="Max"
            />
          </div>
        </div>
      </FilterSection>

      {/* Size */}
      <FilterSection title="Size">
        <div className="flex flex-wrap gap-2">
          {SIZES.map((s) => (
            <button
              key={s}
              onClick={() => update("size", filters.size === s ? "" : s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                filters.size === s
                  ? "bg-violet-600 text-white border-violet-600"
                  : "border-gray-200 text-gray-600 hover:border-violet-300 hover:text-violet-600"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </FilterSection>

      {/* Color */}
      <FilterSection title="Color">
        <div className="flex flex-wrap gap-2">
          {COLORS.map((c) => (
            <button
              key={c.value}
              onClick={() =>
                update("color", filters.color === c.value ? "" : c.value)
              }
              title={c.label}
              className={`w-7 h-7 rounded-full border-2 transition-transform hover:scale-110 ${
                filters.color === c.value
                  ? "border-violet-500 scale-110"
                  : "border-transparent"
              }`}
              style={{
                background: c.hex,
                outline: c.hex === "#f9fafb" ? "1px solid #e5e7eb" : "none",
              }}
            />
          ))}
        </div>
        {filters.color && (
          <p className="text-xs text-violet-600 mt-2">
            Selected: {filters.color}
          </p>
        )}
      </FilterSection>
    </div>
  );
}
