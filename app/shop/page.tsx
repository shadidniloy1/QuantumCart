"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import FilterSidebar from "@/components/shop/FilterSidebar";

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
}
