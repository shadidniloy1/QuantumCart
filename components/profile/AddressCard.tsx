"use client";

import { useState } from "react";
import { MapPin, Pencil, Trash2, Star } from "lucide-react";
import { toast } from "sonner";

interface Address {
  id:         string;
  fullName:   string;
  phone:      string;
  street:     string;
  city:       string;
  state:      string;
  postalCode: string;
  country:    string;
  isDefault:  boolean;
}

interface Props {
  address:   Address;
  onEdit:    (address: Address) => void;
  onDelete:  (id: string) => void;
  onDefault: (id: string) => void;
}

export default function AddressCard({
  address, onEdit, onDelete, onDefault,
}: Props) {
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!confirm("Delete this address?")) return;
    setDeleting(true);
    try {
      const res = await fetch("/api/user/addresses", {
        method:  "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: address.id }),
      });
      if (res.ok) {
        onDelete(address.id);
        toast.success("Address deleted");
      }
    } catch {
      toast.error("Failed to delete address");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className={`relative bg-white rounded-2xl border p-5 transition-all ${
      address.isDefault
        ? "border-violet-300 ring-1 ring-violet-200"
        : "border-gray-100 hover:border-gray-200"
    }`}>
      {/* Default badge */}
      {address.isDefault && (
        <span className="absolute top-3 right-3 inline-flex items-center gap-1 text-xs font-semibold text-violet-600 bg-violet-50 px-2 py-0.5 rounded-full">
          <Star className="w-3 h-3 fill-violet-500" />
          Default
        </span>
      )}

      <div className="flex items-start gap-3 mb-3">
        <div className="w-8 h-8 bg-violet-50 rounded-lg flex items-center justify-center flex-shrink-0">
          <MapPin className="w-4 h-4 text-violet-500" />
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-900">{address.fullName}</p>
          <p className="text-xs text-gray-500 mt-0.5">{address.phone}</p>
        </div>
      </div>

      <p className="text-sm text-gray-600 leading-relaxed mb-4">
        {address.street}<br />
        {address.city}, {address.state} {address.postalCode}<br />
        {address.country}
      </p>

      <div className="flex items-center gap-2">
        {!address.isDefault && (
          <button
            onClick={() => onDefault(address.id)}
            className="text-xs text-violet-600 hover:underline font-medium"
          >
            Set as default
          </button>
        )}
        <div className="flex-1" />
        <button
          onClick={() => onEdit(address)}
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600"
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 transition-colors text-gray-400 hover:text-red-500 disabled:opacity-30"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}