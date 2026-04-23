"use client";

import { Search, SlidersHorizontal, LayoutGrid, List } from "lucide-react";

interface Props {
  search: string;
  sort: string;
  view: "grid" | "list";
  total: number;
  onSearch: (v: string) => void;
  onSort: (v: string) => void;
  onView: (v: "grid" | "list") => void;
  onOpenFilter: () => void;
}

const SORT_OPTIONS = [
  { value: "featured", label: "Featured" },
  { value: "newest", label: "Newest" },
  { value: "price-asc", label: "Price: Low" },
  { value: "price-desc", label: "Price: High" },
];

export default function ShopToolbar({
  search,
  sort,
  view,
  total,
  onSearch,
  onSort,
  onView,
  onOpenFilter,
}: Props) {
  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-6">
      {/* Search */}
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder="Search products..."
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition"
        />
      </div>

      <div className="flex items-center gap-2">
        {/* Sort */}
        <select
          value={sort}
          onChange={(e) => onSort(e.target.value)}
          className="px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-600 focus:outline-none focus:border-violet-400 cursor-pointer"
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>

        {/* Mobile filter button */}
        <button
          onClick={onOpenFilter}
          className="lg:hidden flex items-center gap-2 px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-600 hover:border-violet-300 transition"
        >
          <SlidersHorizontal className="w-4 h-4" />
          Filters
        </button>

        {/* View toggle */}
        <div className="hidden sm:flex items-center bg-white border border-gray-200 rounded-xl overflow-hidden">
          <button
            onClick={() => onView("grid")}
            className={`p-2.5 transition-colors ${
              view === "grid"
                ? "bg-violet-50 text-violet-600"
                : "text-gray-400 hover:text-gray-600"
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
          </button>

          <button
            onClick={() => onView("list")}
            className={`p-2.5 transition-colors ${
              view === "list"
                ? "bg-violet-50 text-violet-600"
                : "text-gray-400 hover:text-gray-600"
            }`}
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Result count */}
      {total > 0 && (
        <span className="hidden lg:block text-sm text-gray-400 whitespace-nowrap">
          {total} product{total !== 1 ? "s" : ""}
        </span>
      )}
    </div>
  );
}
