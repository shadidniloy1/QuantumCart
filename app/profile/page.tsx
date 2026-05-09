"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  User, Mail, Shield, MapPin,
  Plus, Pencil, LogOut, Loader2,
  Package, Heart, Camera,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import AddressCard  from "@/components/profile/AddressCard";
import AddressModal from "@/components/profile/AddressModal";

type Tab = "profile" | "addresses" | "security";

export default function ProfilePage() {
  const { user, dbUser, logout } = useAuth();
  const router = useRouter();

  const [tab,         setTab]         = useState<Tab>("profile");
  const [addresses,   setAddresses]   = useState<any[]>([]);
  const [loadingAddr, setLoadingAddr] = useState(false);
  const [modalOpen,   setModalOpen]   = useState(false);
  const [editAddress, setEditAddress] = useState<any>(null);
  const [savingAddr,  setSavingAddr]  = useState(false);
  const [name,        setName]        = useState(user?.displayName ?? "");
  const [savingProfile, setSavingProfile] = useState(false);
  const [orderCount,  setOrderCount]  = useState(0);
  const [wishCount,   setWishCount]   = useState(0);

  // Redirect if not logged in
  useEffect(() => {
    if (!user) { router.push("/login"); return; }
    setName(user.displayName ?? "");
  }, [user]);

  // Fetch addresses when tab opens
  useEffect(() => {
    if (tab === "addresses" && dbUser?.id) fetchAddresses();
  }, [tab, dbUser]);

  // Fetch order and wishlist counts
  useEffect(() => {
    if (!dbUser?.id) return;
    fetch(`/api/orders?userId=${dbUser.id}`)
      .then((r) => r.json())
      .then((d) => setOrderCount(Array.isArray(d) ? d.length : 0))
      .catch(() => {});

    fetch(`/api/wishlist?userId=${dbUser.id}`)
      .then((r) => r.json())
      .then((d) => setWishCount(Array.isArray(d) ? d.length : 0))
      .catch(() => {});
  }, [dbUser]);

  async function fetchAddresses() {
    setLoadingAddr(true);
    try {
      const res  = await fetch(`/api/user/addresses?userId=${dbUser!.id}`);
      const data = await res.json();
      setAddresses(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Failed to load addresses");
    } finally {
      setLoadingAddr(false);
    }
  }

  async function handleSaveProfile() {
    if (!dbUser?.id) return;
    setSavingProfile(true);
    try {
      const res = await fetch("/api/user/profile", {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: dbUser.id, name }),
      });
      if (res.ok) toast.success("Profile updated!");
      else        toast.error("Failed to update profile");
    } catch {
      toast.error("Something went wrong");
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleSaveAddress(data: any) {
    if (!dbUser?.id) return;
    setSavingAddr(true);
    try {
      const isEdit = !!editAddress;
      const res = await fetch("/api/user/addresses", {
        method:  isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          userId: dbUser.id,
          ...(isEdit && { id: editAddress.id }),
        }),
      });
      const saved = await res.json();
      if (res.ok) {
        if (isEdit) {
          setAddresses((prev) =>
            prev.map((a) => (a.id === saved.id ? saved : a))
          );
        } else {
          setAddresses((prev) => [...prev, saved]);
        }
        toast.success(isEdit ? "Address updated!" : "Address added!");
        setModalOpen(false);
        setEditAddress(null);
      }
    } catch {
      toast.error("Failed to save address");
    } finally {
      setSavingAddr(false);
    }
  }

  async function handleSetDefault(id: string) {
    if (!dbUser?.id) return;
    try {
      await fetch("/api/user/addresses", {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, userId: dbUser.id, isDefault: true }),
      });
      setAddresses((prev) =>
        prev.map((a) => ({ ...a, isDefault: a.id === id }))
      );
      toast.success("Default address updated");
    } catch {
      toast.error("Failed to update default address");
    }
  }

  const TABS: { key: Tab; label: string; icon: any }[] = [
    { key: "profile",   label: "Profile",   icon: User   },
    { key: "addresses", label: "Addresses", icon: MapPin  },
    { key: "security",  label: "Security",  icon: Shield  },
  ];

  if (!user) return null;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">

      {/* Profile header */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">

          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <div className="w-20 h-20 rounded-2xl overflow-hidden bg-violet-100 flex items-center justify-center">
              {user.photoURL ? (
                <Image
                  src={user.photoURL}
                  alt="Avatar"
                  width={80}
                  height={80}
                  className="object-cover"
                />
              ) : (
                <span className="text-2xl font-bold text-violet-600">
                  {user.displayName?.[0]?.toUpperCase() ?? "U"}
                </span>
              )}
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 text-center sm:text-left">
            <h1 className="text-xl font-bold text-gray-900">
              {user.displayName ?? "User"}
            </h1>
            <p className="text-gray-500 text-sm mt-0.5">{user.email}</p>
            <div className="flex items-center justify-center sm:justify-start gap-2 mt-2">
              {dbUser?.role === "ADMIN" && (
                <span className="text-xs font-semibold bg-violet-100 text-violet-700 px-2.5 py-1 rounded-full">
                  Admin
                </span>
              )}
              <span className="text-xs text-gray-400">
                Member since{" "}
                {user.metadata?.creationTime
                  ? new Date(user.metadata.creationTime).getFullYear()
                  : "N/A"}
              </span>
            </div>
          </div>

          {/* Stats */}
          <div className="flex gap-6 text-center">
            <Link href="/orders" className="hover:text-violet-600 transition-colors">
              <p className="text-2xl font-bold text-gray-900">{orderCount}</p>
              <p className="text-xs text-gray-500 flex items-center gap-1 justify-center">
                <Package className="w-3 h-3" /> Orders
              </p>
            </Link>
            <Link href="/wishlist" className="hover:text-violet-600 transition-colors">
              <p className="text-2xl font-bold text-gray-900">{wishCount}</p>
              <p className="text-xs text-gray-500 flex items-center gap-1 justify-center">
                <Heart className="w-3 h-3" /> Wishlist
              </p>
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

        {/* Sidebar */}
        <aside className="lg:col-span-1">
          <div className="bg-white rounded-2xl border border-gray-100 p-3">
            <nav className="space-y-1">
              {TABS.map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setTab(key)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    tab === key
                      ? "bg-violet-50 text-violet-700"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </button>
              ))}

              <div className="h-px bg-gray-100 my-2" />

              <Link
                href="/orders"
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                <Package className="w-4 h-4" />
                My Orders
              </Link>

              <Link
                href="/wishlist"
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                <Heart className="w-4 h-4" />
                Wishlist
              </Link>

              <div className="h-px bg-gray-100 my-2" />

              <button
                onClick={logout}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </nav>
          </div>
        </aside>

        {/* Main content */}
        <div className="lg:col-span-3">

          {/* ── PROFILE TAB ─────────────────── */}
          {tab === "profile" && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h2 className="font-bold text-gray-900 mb-5 flex items-center gap-2">
                <User className="w-4 h-4 text-violet-500" />
                Personal Information
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name
                  </label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
                    placeholder="Your full name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <input
                    value={user.email ?? ""}
                    disabled
                    className="w-full border border-gray-100 rounded-xl px-4 py-2.5 text-sm bg-gray-50 text-gray-400 cursor-not-allowed"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Email is managed by your login provider
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Account Role
                  </label>
                  <input
                    value={dbUser?.role ?? "USER"}
                    disabled
                    className="w-full border border-gray-100 rounded-xl px-4 py-2.5 text-sm bg-gray-50 text-gray-400 cursor-not-allowed"
                  />
                </div>
                <button
                  onClick={handleSaveProfile}
                  disabled={savingProfile}
                  className="bg-violet-600 text-white font-semibold px-6 py-2.5 rounded-xl hover:bg-violet-700 disabled:opacity-40 transition-colors text-sm flex items-center gap-2"
                >
                  {savingProfile && <Loader2 className="w-4 h-4 animate-spin" />}
                  Save Changes
                </button>
              </div>
            </div>
          )}

          {/* ── ADDRESSES TAB ───────────────── */}
          {tab === "addresses" && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-gray-900 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-violet-500" />
                  Saved Addresses
                </h2>
                <button
                  onClick={() => { setEditAddress(null); setModalOpen(true); }}
                  className="flex items-center gap-2 bg-violet-600 text-white font-medium px-4 py-2 rounded-xl hover:bg-violet-700 transition-colors text-sm"
                >
                  <Plus className="w-4 h-4" />
                  Add Address
                </button>
              </div>

              {loadingAddr ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="w-6 h-6 text-violet-600 animate-spin" />
                </div>
              ) : addresses.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
                  <MapPin className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm mb-4">No saved addresses</p>
                  <button
                    onClick={() => { setEditAddress(null); setModalOpen(true); }}
                    className="text-violet-600 text-sm font-medium hover:underline"
                  >
                    Add your first address
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {addresses.map((addr) => (
                    <AddressCard
                      key={addr.id}
                      address={addr}
                      onEdit={(a) => { setEditAddress(a); setModalOpen(true); }}
                      onDelete={(id) =>
                        setAddresses((prev) => prev.filter((a) => a.id !== id))
                      }
                      onDefault={handleSetDefault}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── SECURITY TAB ────────────────── */}
          {tab === "security" && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h2 className="font-bold text-gray-900 mb-5 flex items-center gap-2">
                <Shield className="w-4 h-4 text-violet-500" />
                Security Settings
              </h2>
              <div className="space-y-4">

                {/* Login provider info */}
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-sm font-semibold text-gray-700 mb-1">
                    Login Method
                  </p>
                  <p className="text-sm text-gray-500">
                    {user.providerData?.[0]?.providerId === "google.com"
                      ? "Google Account"
                      : "Email & Password"}
                  </p>
                </div>

                {/* Account info */}
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-sm font-semibold text-gray-700 mb-1">
                    Firebase UID
                  </p>
                  <p className="text-xs font-mono text-gray-400 break-all">
                    {user.uid}
                  </p>
                </div>

                {/* Email verified */}
                <div className="p-4 bg-gray-50 rounded-xl flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-700">
                      Email Verification
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">{user.email}</p>
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                    user.emailVerified
                      ? "bg-green-100 text-green-700"
                      : "bg-yellow-100 text-yellow-700"
                  }`}>
                    {user.emailVerified ? "Verified" : "Not verified"}
                  </span>
                </div>

                {/* Danger zone */}
                <div className="border border-red-100 rounded-xl p-4">
                  <p className="text-sm font-semibold text-red-600 mb-1">
                    Danger Zone
                  </p>
                  <p className="text-xs text-gray-500 mb-3">
                    Once you sign out, you&apos;ll need to log in again.
                  </p>
                  <button
                    onClick={logout}
                    className="flex items-center gap-2 text-sm font-medium text-red-500 hover:text-red-600 border border-red-200 px-4 py-2 rounded-xl hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Address modal */}
      <AddressModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditAddress(null); }}
        onSave={handleSaveAddress}
        address={editAddress}
        loading={savingAddr}
      />
    </div>
  );
}