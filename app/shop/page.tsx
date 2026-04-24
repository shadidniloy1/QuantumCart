"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import FilterSidebar from "@/components/shop/FilterSidebar";
import ShopToolbar from "@/components/shop/ShopToolbar";
import ActiveFilters from "@/components/shop/ActiveFilters";
import Pagination from "@/components/shop/Pagination";
import ProductCard from "@/components/shop/ProductCard";

interface Filters {
  category: string;
  minPrice: number;
  maxPrice: number;
  size: string;
  color: string;
}

const DEFAULT_FILTERS: Filters = {
  category: "",
  minPrice: 0,
  maxPrice: 500,
  size: "",
  color: "",
};

function ShopContent() {
  const searchParams = useSearchParams();

  // ── State ──────────────────────────────────
  const [products, setProducts] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [view, setView] = useState<"grid" | "list">("grid");
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState("featured");
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);

  // Debounce search input
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(debounceRef.current);
  }, [search]);

  // ── Single fetch effect ─────────────────────
  // All dependencies are listed directly — no useCallback needed
  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        params.set("page", String(page));
        params.set("limit", "12");
        params.set("sort", sort);

        if (filters.category) params.set("category", filters.category);
        if (debouncedSearch) params.set("search", debouncedSearch);
        if (filters.minPrice > 0)
          params.set("minPrice", String(filters.minPrice));
        if (filters.maxPrice < 500)
          params.set("maxPrice", String(filters.maxPrice));
        if (filters.size) params.set("size", filters.size);
        if (filters.color) params.set("color", filters.color);

        const res = await fetch(`/api/products?${params.toString()}`);

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const data = await res.json();

        // Only update state if this fetch wasn't cancelled
        if (!cancelled) {
          setProducts(data.products ?? []);
          setTotal(data.total ?? 0);
          setTotalPages(data.totalPages ?? 1);
        }
      } catch (err) {
        console.error("Failed to fetch products:", err);
        if (!cancelled) {
          setProducts([]);
          setTotal(0);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    // Cleanup: cancel stale fetches when dependencies change
    return () => {
      cancelled = true;
    };
  }, [page, sort, debouncedSearch, filters]); // ← direct deps, no useCallback

  // ── Handlers ───────────────────────────────
  function handleFiltersChange(newFilters: Filters) {
    setFilters(newFilters);
    setPage(1); // reset page when filters change
  }

  function handleSort(newSort: string) {
    setSort(newSort);
    setPage(1);
  }

  // Page title from category
  const pageTitle = filters.category
    ? filters.category.charAt(0).toUpperCase() +
      filters.category.slice(1).replace(/-/g, " ")
    : "All Products";

  // ── Render ─────────────────────────────────
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Heading */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{pageTitle}</h1>
        <p className="text-gray-500 text-sm mt-1">
          {loading
            ? "Loading products..."
            : `${total} product${total !== 1 ? "s" : ""} available`}
        </p>
      </div>

      {/* Toolbar */}
      <ShopToolbar
        search={search}
        sort={sort}
        view={view}
        total={total}
        onSearch={setSearch}
        onSort={handleSort}
        onView={setView}
        onOpenFilter={() => setMobileOpen(true)}
      />

      <div className="flex gap-6">
        {/* Desktop sidebar */}
        <aside className="hidden lg:block w-56 flex-shrink-0">
          <div className="sticky top-24">
            <FilterSidebar filters={filters} onChange={handleFiltersChange} />
          </div>
        </aside>

        {/* Mobile filter sheet */}
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetContent side="left" className="w-72 p-4 overflow-y-auto">
            <FilterSidebar
              filters={filters}
              onChange={handleFiltersChange}
              onClose={() => setMobileOpen(false)}
            />
          </SheetContent>
        </Sheet>

        {/* Products area */}
        <div className="flex-1 min-w-0">
          {/* Active filter chips */}
          <ActiveFilters filters={filters} onChange={handleFiltersChange} />

          {/* Grid */}
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="space-y-3">
                  <Skeleton className="aspect-square rounded-2xl" />
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-4 w-1/3" />
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No products found
              </h3>
              <p className="text-gray-500 text-sm mb-4">
                Try adjusting your filters or search term
              </p>
              <button
                onClick={() => {
                  setFilters(DEFAULT_FILTERS);
                  setSearch("");
                  setPage(1);
                }}
                className="text-violet-600 text-sm font-medium hover:underline"
              >
                Clear all filters
              </button>
            </div>
          ) : (
            <div
              className={
                view === "grid"
                  ? "grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4"
                  : "flex flex-col gap-4"
              }
            >
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}

          {/* Pagination */}
          <Pagination
            page={page}
            totalPages={totalPages}
            onChange={(p) => {
              setPage(p);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          />
        </div>
      </div>
    </div>
  );
}

// Suspense wrapper is still needed for useSearchParams
export default function ShopPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="aspect-square rounded-2xl" />
            ))}
          </div>
        </div>
      }
    >
      <ShopContent />
    </Suspense>
  );
}
