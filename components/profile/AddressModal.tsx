"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { X, Loader2 } from "lucide-react";

const schema = z.object({
  fullName:   z.string().min(2,  "Required"),
  phone:      z.string().min(7,  "Required"),
  street:     z.string().min(5,  "Required"),
  city:       z.string().min(2,  "Required"),
  state:      z.string().min(2,  "Required"),
  postalCode: z.string().min(3,  "Required"),
  country:    z.string().min(2,  "Required"),
  isDefault:  z.boolean().optional(),
});

type FormData = z.infer<typeof schema>;

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
  open:      boolean;
  onClose:   () => void;
  onSave:    (data: FormData) => Promise<void>;
  address?:  Address | null;
  loading:   boolean;
}

const inputClass =
  "w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition";

export default function AddressModal({
  open, onClose, onSave, address, loading,
}: Props) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  // Populate form when editing
  useEffect(() => {
    if (address) {
      reset(address);
    } else {
      reset({
        fullName: "", phone: "", street: "",
        city: "", state: "", postalCode: "",
        country: "", isDefault: false,
      });
    }
  }, [address, open]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg p-0 rounded-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">
            {address ? "Edit Address" : "Add New Address"}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSave)} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <input {...register("fullName")} className={inputClass} placeholder="John Doe" />
              {errors.fullName && (
                <p className="text-xs text-red-500 mt-1">{errors.fullName.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone
              </label>
              <input {...register("phone")} className={inputClass} placeholder="+1 234 567 8900" />
              {errors.phone && (
                <p className="text-xs text-red-500 mt-1">{errors.phone.message}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Street Address
            </label>
            <input {...register("street")} className={inputClass} placeholder="123 Main Street" />
            {errors.street && (
              <p className="text-xs text-red-500 mt-1">{errors.street.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
              <input {...register("city")} className={inputClass} placeholder="New York" />
              {errors.city && (
                <p className="text-xs text-red-500 mt-1">{errors.city.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
              <input {...register("state")} className={inputClass} placeholder="NY" />
              {errors.state && (
                <p className="text-xs text-red-500 mt-1">{errors.state.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Postal Code
              </label>
              <input {...register("postalCode")} className={inputClass} placeholder="10001" />
              {errors.postalCode && (
                <p className="text-xs text-red-500 mt-1">{errors.postalCode.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
              <select {...register("country")} className={inputClass}>
                <option value="">Select</option>
                <option value="US">United States</option>
                <option value="BD">Bangladesh</option>
                <option value="GB">United Kingdom</option>
                <option value="CA">Canada</option>
                <option value="AU">Australia</option>
                <option value="IN">India</option>
                <option value="DE">Germany</option>
                <option value="SG">Singapore</option>
              </select>
              {errors.country && (
                <p className="text-xs text-red-500 mt-1">{errors.country.message}</p>
              )}
            </div>
          </div>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              {...register("isDefault")}
              className="w-4 h-4 accent-violet-600"
            />
            <span className="text-sm text-gray-600">Set as default address</span>
          </label>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-gray-200 text-gray-600 font-medium py-2.5 rounded-xl hover:bg-gray-50 text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-violet-600 text-white font-semibold py-2.5 rounded-xl hover:bg-violet-700 disabled:opacity-40 text-sm flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {address ? "Save Changes" : "Add Address"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}