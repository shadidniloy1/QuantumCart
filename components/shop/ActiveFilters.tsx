"use client";

import { X } from "lucide-react";

interface Filters {
  category: string;
  minPrice: number;
  maxPrice: number;
  size:     string;
  color:    string;
}

interface Props {
  filters:  Filters;
  onChange: (filters: Filters) => void;
}

export default function ActiveFilters({ filters, onChange }: Props) {
  const chips: { label: string; key: keyof Filters; value: any }[] = [];

  if (filters.category)       chips.push({ label: filters.category, key: "category", value: "" });
  if (filters.size)           chips.push({ label: `Size: ${filters.size}`, key: "size", value: "" });
  if (filters.color)          chips.push({ label: `Color: ${filters.color}`, key: "color", value: "" });
  if (filters.minPrice > 0)   chips.push({ label: `Min: $${filters.minPrice}`, key: "minPrice", value: 0 });
  if (filters.maxPrice < 500) chips.push({ label: `Max: $${filters.maxPrice}`, key: "maxPrice", value: 500 });

  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 mb-4">
      <span className="text-xs text-gray-400 font-medium">Active:</span>
      {chips.map((chip) => (
        <button
          key={chip.key}
          onClick={() => onChange({ ...filters, [chip.key]: chip.value })}
          className="inline-flex items-center gap-1.5 px-3 py-1 bg-violet-50 text-violet-700 text-xs font-medium rounded-full hover:bg-violet-100 transition-colors"
        >
          {chip.label}
          <X className="w-3 h-3" />
        </button>
      ))}
    </div>
  );
}