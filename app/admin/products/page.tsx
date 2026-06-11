"use client";

import { useEffect, useState, useRef } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Loader2,
  Package,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import { toast } from "sonner";
// import ProductFormModal from "@/components/admin/ProductFormModal";
const ProductFormModal = dynamic(
  () => import("@/components/admin/ProductFormModal"),
  { ssr: false }
);

export default function AdminProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<any>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchProducts(), 400);
    return () => clearTimeout(debounceRef.current);
  }, [search, page]);

  async function fetchProducts() {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: "10",
        ...(search && { search }),
      });

      const res = await fetch(`/api/admin/products?${params}`);
      const data = await res.json();
      setProducts(data.products ?? []);
      setTotal(data.total ?? 0);
      setTotalPages(data.totalPages ?? 1);
    } catch {
      toast.error("Failed to load products");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    setDeleting(id);

    try {
      const res = await fetch(`/api/admin/products/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setProducts((prev) => prev.filter((p) => p.id !== id));
        toast.success("Product deleted");
      }
    } catch {
      toast.error("Failed to delete product");
    } finally {
      setDeleting(null);
    }
  }

  async function handleTogglePublish(product: any) {
    try {
      const res = await fetch(`/api/admin/products/${product.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...product, published: !product.published }),
      });
      if (res.ok) {
        setProducts((prev) =>
          prev.map((p) =>
            p.id === product.id ? { ...p, published: !p.published } : p,
          ),
        );
        toast.success(
          product.published ? "Product unpublished" : "Product published",
        );
      }
    } catch {
      toast.error("Failed to update product");
    }
  }

  function handleSaved(saved: any, isEdit: boolean) {
    if (isEdit) {
      setProducts((prev) =>
        prev.map((p) => (p.id === saved.id ? { ...p, ...saved } : p)),
      );
    } else {
      setProducts((prev) => [saved, ...prev]);
    }
    setModalOpen(false);
    setEditProduct(null);
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="text-gray-500 text-sm mt-1">{total} total products</p>
        </div>
        <button
          onClick={() => {
            setEditProduct(null);
            setModalOpen(true);
          }}
          className="flex items-center gap-2 bg-violet-600 text-white font-semibold px-4 py-2.5 rounded-xl hover:bg-violet-700 transition-colors text-sm"
        >
          <Plus className="w-4 h-4" />
          Add Product
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-5">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Search products..."
          className="w-full max-w-sm pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-violet-400"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left text-xs font-semibold text-gray-500 px-5 py-3">
                  Product
                </th>
                <th className="text-left text-xs font-semibold text-gray-500 px-5 py-3 hidden sm:table-cell">
                  Category
                </th>
                <th className="text-left text-xs font-semibold text-gray-500 px-5 py-3">
                  Price
                </th>
                <th className="text-left text-xs font-semibold text-gray-500 px-5 py-3 hidden md:table-cell">
                  Stock
                </th>
                <th className="text-left text-xs font-semibold text-gray-500 px-5 py-3 hidden lg:table-cell">
                  Status
                </th>
                <th className="text-right text-xs font-semibold text-gray-500 px-5 py-3">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {[1, 2, 3, 4, 5, 6].map((j) => (
                      <td key={j} className="px-5 py-4">
                        <div className="h-4 bg-gray-100 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-gray-400">
                    <Package className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">No products found</p>
                  </td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr
                    key={product.id}
                    className="hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="relative w-10 h-10 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                          <Image
                            src={product.images?.[0] ?? ""}
                            alt={product.name}
                            fill
                            className="object-cover"
                            sizes="40px"
                          />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900 line-clamp-1 max-w-[160px]">
                            {product.name}
                          </p>
                          <p className="text-xs text-gray-400">
                            {product._count?.orderItems ?? 0} sold
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 hidden sm:table-cell">
                      <span className="text-sm text-gray-600">
                        {product.category?.name}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          ${product.price.toFixed(2)}
                        </p>
                        {product.comparePrice && (
                          <p className="text-xs text-gray-400 line-through">
                            ${product.comparePrice.toFixed(2)}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4 hidden md:table-cell">
                      <span
                        className={`text-sm font-semibold ${
                          product.stock === 0
                            ? "text-red-500"
                            : product.stock <= 10
                              ? "text-amber-500"
                              : "text-green-600"
                        }`}
                      >
                        {product.stock}
                      </span>
                    </td>
                    <td className="px-5 py-4 hidden lg:table-cell">
                      <button
                        onClick={() => handleTogglePublish(product)}
                        className="flex items-center gap-1.5"
                      >
                        {product.published ? (
                          <>
                            <ToggleRight className="w-5 h-5 text-green-500" />
                            <span className="text-xs font-medium text-green-600">
                              Published
                            </span>
                          </>
                        ) : (
                          <>
                            <ToggleLeft className="w-5 h-5 text-gray-400" />
                            <span className="text-xs font-medium text-gray-400">
                              Hidden
                            </span>
                          </>
                        )}
                      </button>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setEditProduct(product);
                            setModalOpen(true);
                          }}
                          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(product.id, product.name)}
                          disabled={deleting === product.id}
                          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors disabled:opacity-30"
                        >
                          {deleting === product.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100">
            <p className="text-sm text-gray-500">
              Page {page} of {totalPages}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm disabled:opacity-30 hover:bg-gray-50"
              >
                Prev
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm disabled:opacity-30 hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* <ProductFormModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditProduct(null);
        }}
        product={editProduct}
        onSaved={handleSaved}
      /> */}
      {modalOpen && (
        <ProductFormModal
          open={modalOpen}
          onClose={() => {
            setModalOpen(false);
            setEditProduct(null);
          }}
          product={editProduct}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
