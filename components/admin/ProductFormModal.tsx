"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { X, Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { Resolver } from "react-hook-form";

const SIZES_OPTIONS = [
  "XS",
  "S",
  "M",
  "L",
  "XL",
  "XXL",
  "28",
  "30",
  "32",
  "34",
  "36",
  "38",
  "39",
  "40",
  "41",
  "42",
  "43",
  "44",
  "45",
  "One Size",
];
const COLORS_OPTIONS = [
  "Black",
  "White",
  "Navy",
  "Gray",
  "Red",
  "Blue",
  "Green",
  "Beige",
];


const schema = z.object({
  name: z.string().min(2, "Required"),
  description: z.string().min(10, "Required"),
  price: z.coerce.number().min(0.01, "Required"),
  comparePrice: z.coerce.number().optional(),
  stock: z.coerce.number().min(0),
  categoryId: z.string().min(1, "Required"),
  featured: z.boolean().optional(),
  published: z.boolean().optional(),
});

// const resolver: Resolver<FormData> = zodResolver(schema);
const form = useForm<FormData>({
  resolver: zodResolver(schema) as any,
});

type FormData = z.infer<typeof schema>;

const inputClass =
  "w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition";

interface Props {
  open: boolean;
  onClose: () => void;
  product?: any;
  onSaved: (product: any, isEdit: boolean) => void;
}

export default function ProductFormModal({
  open,
  onClose,
  product,
  onSaved,
}: Props) {
  const isEdit = !!product;
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [images, setImages] = useState<string[]>([""]);
  const [sizes, setSizes] = useState<string[]>([]);
  const [colors, setColors] = useState<string[]>([]);

  // const {
  //   register,
  //   handleSubmit,
  //   reset,
  //   formState: { errors },
  // } = useForm<FormData>({ resolver: zodResolver(schema) });
  // const form = useForm<FormData>({
  //   resolver,
  // });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = form;

  // Load categories
  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((d) => setCategories(Array.isArray(d) ? d : []))
      .catch(() => {});
  }, []);

  // Populate form when editing
  useEffect(() => {
    if (!open) return;
    if (product) {
      reset({
        name: product.name,
        description: product.description,
        price: product.price,
        comparePrice: product.comparePrice ?? undefined,
        stock: product.stock,
        categoryId: product.categoryId,
        published: product.published ?? true,
        featured: product.featured ?? false,
      });
      setImages(product.images?.length > 0 ? product.images : [""]);
      setSizes(product.sizes ?? []);
      setColors(product.colors ?? []);
    } else {
      reset({
        name: "",
        description: "",
        price: 0,
        stock: 0,
        categoryId: "",
        featured: false,
        published: true,
      });
      setImages([""]);
      setSizes([]);
      setColors([]);
    }
  }, [product, open]);

  async function onSubmit(data: FormData) {
    setLoading(true);
    try {
      const cleanImages = images.filter((img) => img.trim() !== "");
      if (cleanImages.length === 0) {
        toast.error("Add at least one image URL");
        return;
      }

      const payload = {
        ...data,
        images: cleanImages,
        sizes,
        colors,
      };

      const url = isEdit
        ? `/api/admin/products/${product.id}`
        : "/api/admin/products";
      const method = isEdit ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const saved = await res.json();

      if (!res.ok) throw new Error(saved.error);
      toast.success(isEdit ? "Product updated!" : "Product created!");
      onSaved(saved, isEdit);
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to save product");
    } finally {
      setLoading(false);
    }
  }

  function toggleSize(s: string) {
    setSizes((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s],
    );
  }

  function toggleColor(c: string) {
    setColors((prev) =>
      prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c],
    );
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl p-0 rounded-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <h2 className="font-bold text-gray-900">
            {isEdit ? "Edit Product" : "Add New Product"}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Scrollable form */}
        <div className="overflow-y-auto flex-1">
          <form
            onSubmit={handleSubmit(onSubmit)}
            id="product-form"
            className="p-6 space-y-5"
          >
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Product Name
              </label>
              <input
                {...register("name")}
                className={inputClass}
                placeholder="Classic White Tee"
              />
              {errors.name && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.name.message}
                </p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                {...register("description")}
                rows={3}
                className={inputClass + " resize-none"}
                placeholder="Product description..."
              />
              {errors.description && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.description.message}
                </p>
              )}
            </div>

            {/* Price + Compare + Stock */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Price ($)
                </label>
                <input
                  {...register("price")}
                  type="number"
                  step="0.01"
                  className={inputClass}
                  placeholder="29.99"
                />
                {errors.price && (
                  <p className="text-xs text-red-500 mt-1">
                    {errors.price.message}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Compare Price ($)
                </label>
                <input
                  {...register("comparePrice")}
                  type="number"
                  step="0.01"
                  className={inputClass}
                  placeholder="39.99"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Stock
                </label>
                <input
                  {...register("stock")}
                  type="number"
                  className={inputClass}
                  placeholder="50"
                />
              </div>
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select {...register("categoryId")} className={inputClass}>
                <option value="">Select category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
              {errors.categoryId && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.categoryId.message}
                </p>
              )}
            </div>

            {/* Images */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Image URLs
              </label>
              <div className="space-y-2">
                {images.map((img, i) => (
                  <div key={i} className="flex gap-2">
                    <input
                      value={img}
                      onChange={(e) => {
                        const next = [...images];
                        next[i] = e.target.value;
                        setImages(next);
                      }}
                      className={inputClass}
                      placeholder="https://images.unsplash.com/..."
                    />
                    {images.length > 1 && (
                      <button
                        type="button"
                        onClick={() =>
                          setImages(images.filter((_, j) => j !== i))
                        }
                        className="w-10 flex items-center justify-center text-red-400 hover:text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setImages([...images, ""])}
                  className="flex items-center gap-1.5 text-sm text-violet-600 hover:underline"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add another image
                </button>
              </div>
            </div>

            {/* Sizes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sizes
              </label>
              <div className="flex flex-wrap gap-2">
                {SIZES_OPTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => toggleSize(s)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                      sizes.includes(s)
                        ? "bg-violet-600 text-white border-violet-600"
                        : "border-gray-200 text-gray-600 hover:border-violet-300"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Colors */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Colors
              </label>
              <div className="flex flex-wrap gap-2">
                {COLORS_OPTIONS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => toggleColor(c)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                      colors.includes(c)
                        ? "bg-violet-600 text-white border-violet-600"
                        : "border-gray-200 text-gray-600 hover:border-violet-300"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {/* Toggles */}
            <div className="flex gap-6">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  {...register("featured")}
                  className="w-4 h-4 accent-violet-600"
                />
                <span className="text-sm text-gray-600">Featured product</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  {...register("published")}
                  defaultChecked
                  className="w-4 h-4 accent-violet-600"
                />
                <span className="text-sm text-gray-600">Published</span>
              </label>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t border-gray-100 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 border border-gray-200 text-gray-600 font-medium py-2.5 rounded-xl hover:bg-gray-50 text-sm"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="product-form"
            disabled={loading}
            className="flex-1 bg-violet-600 text-white font-semibold py-2.5 rounded-xl hover:bg-violet-700 disabled:opacity-40 text-sm flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {isEdit ? "Save Changes" : "Create Product"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
