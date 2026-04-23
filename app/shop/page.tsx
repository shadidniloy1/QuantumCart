"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import FilterSidebar from "@/components/shop/FilterSidebar";
import ShopToolbar from "@/components/shop/ShopToolbar";
import Pagination from "@/components/shop/Pagination";
import ProductCard from "@/components/shop/ProductCard";
import ActiveFilters from "@/components/shop/ActiveFilters";

interface Filters {
  category: string;
  minPrice: number;
  maxPrice: number;
  size: string;
  color: string;
}

function ShopContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [products, setProducts] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [view, setView] = useState<"grid" | "list">("grid");

  const [filters, setFilters] = useState<Filters>({
    category: searchParams.get("category") || "",
    minPrice: Number(searchParams.get("minPrice") || 0),
    maxPrice: Number(searchParams.get("maxPrice") || 500),
    size: searchParams.get("size") || "",
    color: searchParams.get("color") || "",
  });
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [sort, setSort] = useState(searchParams.get("sort") || "featured");
  const [page, setPage] = useState(Number(searchParams.get("page") || 1));

  // Debounced search
  const [searchDebounced, setSearchDebounced] = useState(search);
  useEffect(() => {
    const t = setTimeout(() => setSearchDebounced(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  //   Fetch products whenever filters change
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        ...(filters.category && {
          category: filters.category,
        }),
        ...(searchDebounced && {
          search: searchDebounced,
        }),
        ...(filters.minPrice > 0 && { minPrice: String(filters.minPrice) }),
        ...(filters.maxPrice < 500 && { maxPrice: String(filters.maxPrice) }),
        ...(filters.size && { size: filters.size }),
        ...(filters.color && { color: filters.color }),
        sort,
        page: String(page),
        limit: "12",
      });

      const res = await fetch(`/api/products?${params}`);
      const data = await res.json();

      setProducts(data.products ?? []);
      setTotal(data.total ?? 0);
      setTotalPages(data.totalPages ?? 1);
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [filters, searchDebounced, sort, page]);

  useEffect(() => {
    setPage(1);
  }, [filters, searchDebounced, sort]);

  function handleFiltersChange(newFilters: Filters) {
    setFilters(newFilters);
    setPage(1);
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page heading */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          {filters.category
            ? filters.category.charAt(0).toUpperCase() +
              filters.category.slice(1).replace("-", " ")
            : "All Products"}
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          {loading
            ? "Loading..."
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
        onSort={setSort}
        onView={setView}
        onOpenFilter={() => setMobileOpen(true)}
      />

      <div className="flex gap-6">
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

        {/* Main content */}
        <div className="flex-1 min-w-0">
          {/* Active filter chips */}
          <ActiveFilters filters={filters} onChange={handleFiltersChange} />

          {/* Product grid / list */}
          {loading ? (
            <div
              className={
                view === "grid"
                  ? "grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4"
                  : "flex flex-col gap-4"
              }
            >
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
                  setFilters({
                    category: "",
                    minPrice: 0,
                    maxPrice: 500,
                    size: "",
                    color: "",
                  });
                  setSearch("");
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

export default function ShopPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-7xl mx-auto px-4 py-8">
          <Skeleton className="h-8 w-48 mb-6" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
