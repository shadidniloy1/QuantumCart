"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Loader2, Tag } from "lucide-react";
import { toast } from "sonner";

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [saving,     setSaving]     = useState(false);
  const [editCat,    setEditCat]    = useState<any>(null);
  const [showForm,   setShowForm]   = useState(false);
  const [form, setForm] = useState({ name: "", slug: "", image: "" });

  useEffect(() => {
    fetchCategories();
  }, []);

  async function fetchCategories() {
    setLoading(true);
    fetch("/api/categories")
      .then((r) => r.json())
      .then((d) => setCategories(Array.isArray(d) ? d : []))
      .catch(() => toast.error("Failed to load categories"))
      .finally(() => setLoading(false));
  }

  function openAdd() {
    setEditCat(null);
    setForm({ name: "", slug: "", image: "" });
    setShowForm(true);
  }

  function openEdit(cat: any) {
    setEditCat(cat);
    setForm({ name: cat.name, slug: cat.slug, image: cat.image ?? "" });
    setShowForm(true);
  }

  function autoSlug(name: string) {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  }

  async function handleSave() {
    if (!form.name || !form.slug) {
      toast.error("Name and slug are required");
      return;
    }
    setSaving(true);
    try {
      const url    = editCat ? `/api/admin/categories/${editCat.id}` : "/api/admin/categories";
      const method = editCat ? "PATCH" : "POST";

      const res  = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const saved = await res.json();
      if (!res.ok) throw new Error(saved.error);

      if (editCat) {
        setCategories((prev) =>
          prev.map((c) => (c.id === saved.id ? saved : c))
        );
        toast.success("Category updated!");
      } else {
        setCategories((prev) => [...prev, saved]);
        toast.success("Category created!");
      }
      setShowForm(false);
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to save category");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete category "${name}"?`)) return;
    try {
      const res = await fetch(`/api/admin/categories/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setCategories((prev) => prev.filter((c) => c.id !== id));
        toast.success("Category deleted");
      }
    } catch {
      toast.error("Failed to delete category");
    }
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
          <p className="text-gray-500 text-sm mt-1">
            {categories.length} categories
          </p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 bg-violet-600 text-white font-semibold px-4 py-2.5 rounded-xl hover:bg-violet-700 transition-colors text-sm"
        >
          <Plus className="w-4 h-4" />
          Add Category
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-6">
          <h2 className="font-bold text-gray-900 mb-4">
            {editCat ? "Edit Category" : "New Category"}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name
              </label>
              <input
                value={form.name}
                onChange={(e) =>
                  setForm({ ...form, name: e.target.value, slug: autoSlug(e.target.value) })
                }
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-violet-400"
                placeholder="T-Shirts"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Slug
              </label>
              <input
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-violet-400"
                placeholder="t-shirts"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Image URL
              </label>
              <input
                value={form.image}
                onChange={(e) => setForm({ ...form, image: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-violet-400"
                placeholder="https://..."
              />
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowForm(false)}
              className="px-4 py-2 border border-gray-200 text-gray-600 rounded-xl text-sm hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 bg-violet-600 text-white font-semibold px-4 py-2 rounded-xl hover:bg-violet-700 disabled:opacity-40 text-sm"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {editCat ? "Save Changes" : "Create Category"}
            </button>
          </div>
        </div>
      )}

      {/* Categories grid */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 text-violet-600 animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-4 hover:border-gray-200 transition-colors"
            >
              <div className="w-12 h-12 rounded-xl overflow-hidden bg-violet-50 flex-shrink-0 flex items-center justify-center">
                {cat.image ? (
                  <img
                    src={cat.image}
                    alt={cat.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Tag className="w-5 h-5 text-violet-400" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900">{cat.name}</p>
                <p className="text-xs text-gray-400">/{cat.slug}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {cat._count?.products ?? 0} products
                </p>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => openEdit(cat)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDelete(cat.id, cat.name)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}