"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const schema = z.object({
  fullName:   z.string().min(2,  "Full name is required"),
  phone:      z.string().min(7,  "Valid phone number required"),
  street:     z.string().min(5,  "Street address is required"),
  city:       z.string().min(2,  "City is required"),
  state:      z.string().min(2,  "State/Province is required"),
  postalCode: z.string().min(3,  "Postal code is required"),
  country:    z.string().min(2,  "Country is required"),
});

export type AddressData = z.infer<typeof schema>;

interface Props {
  onSubmit: (data: AddressData) => void;
  loading:  boolean;
}

function Field({
  label, error, children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      {children}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}

const inputClass =
  "w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition";

export default function AddressForm({ onSubmit, loading }: Props) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AddressData>({ resolver: zodResolver(schema) });

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      id="address-form"
      className="space-y-4"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Full Name" error={errors.fullName?.message}>
          <input
            {...register("fullName")}
            placeholder="John Doe"
            className={inputClass}
          />
        </Field>

        <Field label="Phone Number" error={errors.phone?.message}>
          <input
            {...register("phone")}
            placeholder="+1 234 567 8900"
            className={inputClass}
          />
        </Field>
      </div>

      <Field label="Street Address" error={errors.street?.message}>
        <input
          {...register("street")}
          placeholder="123 Main Street, Apt 4B"
          className={inputClass}
        />
      </Field>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="City" error={errors.city?.message}>
          <input
            {...register("city")}
            placeholder="New York"
            className={inputClass}
          />
        </Field>

        <Field label="State / Province" error={errors.state?.message}>
          <input
            {...register("state")}
            placeholder="NY"
            className={inputClass}
          />
        </Field>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Postal Code" error={errors.postalCode?.message}>
          <input
            {...register("postalCode")}
            placeholder="10001"
            className={inputClass}
          />
        </Field>

        <Field label="Country" error={errors.country?.message}>
          <select {...register("country")} className={inputClass}>
            <option value="">Select country</option>
            <option value="US">United States</option>
            <option value="BD">Bangladesh</option>
            <option value="GB">United Kingdom</option>
            <option value="CA">Canada</option>
            <option value="AU">Australia</option>
            <option value="IN">India</option>
            <option value="DE">Germany</option>
            <option value="FR">France</option>
            <option value="SG">Singapore</option>
            <option value="AE">UAE</option>
          </select>
        </Field>
      </div>
    </form>
  );
}