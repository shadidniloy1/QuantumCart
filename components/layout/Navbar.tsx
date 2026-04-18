"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ShoppingBag,
  Search,
  Menu,
  Heart,
  Package,
  User,
  LogOut,
  LogIn,
  ChevronDown,
  Sparkles,
} from "lucide-react";

// --- Nav links

const navLinks = [
  { label: "Home", href: "/" },
  { label: "Shop", href: "/shop" },
  { label: "Categories", href: "/categories" },
  { label: "Sale", href: "/sale" },
];

// --- Avatar Initaials Helper

function getInitials(name: string | null | undefined): string {
  if (!name) return "U";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

// --- Main Navbar
export default function Navbar() {
  const { user, dbUser, logout } = useAuth();
  const pathname = usePathname();
  const [cartCount, setCartCount] = useState(0);
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Add shadow on scroll
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Fetch cart count when user logs in
  useEffect(() => {
    if (dbUser?.id) fetchCartCount();
  }, [dbUser]);

  async function fetchCartCount() {
    try {
      const res = await fetch(`/api/cart/count?userId=${dbUser?.id}`);
      const data = await res.json();
      setCartCount(data.count ?? 0);
    } catch {
      setCartCount(0);
    }
  }

  return (
    <header
      className={`sticky top-0 z-50 w-full bg-white border-b border-gray-100 transition-shadow duration-200 ${scrolled ? "shadow-sm" : "shadow-none"}`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* ---Logo */}
          <Link
            href="/"
            className="flex items-center gap-2 font-semibold text-xl tracking-tight"
          >
            <Sparkles className="w-5 h-5 text-violet-500" />
            QuantumCart
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${pathname === link.href ? "bg-gray-100 text-gray-900" : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"}`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right side actions */}
          <div className="flex items-center gap-2">
            {/* Search */}
            <Link href="/search">
              <Button variant="ghost" size="icon" className="hidden sm:flex">
                <Search className="w-4 h-4" />
              </Button>
            </Link>

            {/* Wishlist - only when logged in */}
            {user && (
              <Link href="/wishlist">
                <Button variant="ghost" size="icon">
                  <Heart className="w-4 h-4" />
                </Button>
              </Link>
            )}

            {/* Cart */}
            <Link href="/cart">
              <Button variant="ghost" size="icon" className="relative">
                <ShoppingBag className="w-4 h-4" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-semibold w-4 h-4 rounded-full flex items-center justify-center">
                    {cartCount > 9 ? "9+" : cartCount}
                  </span>
                )}
              </Button>
            </Link>

            {/* User Menu - Desktop */}
            <div className="hidden md:block">
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-full border border-gray-200 hover:border-gray-300 transition-colors">
                      {/* Avatar */}
                      <div className="w-7 h-7 rounded-full bg-violet-100 flex items-center justify-center text-violet-700 text-xs font-semibold">
                        {user.photoURL ? (
                          <img
                            src={user.photoURL}
                            alt="avatar"
                            className="w-7 h-7 rounded-full object-cover"
                          />
                        ) : (
                          getInitials(user.displayName)
                        )}
                      </div>
                      <span className="text-sm font-medium text-gray-700 max-w-[100px] truncate">
                        {user.displayName?.split(" ")[0] ?? "Account"}
                      </span>
                      <ChevronDown className="w-3 h-3 text-gray-400" />
                    </button>
                  </DropdownMenuTrigger>

                  <DropdownMenuContent align="end" className="w-48 mt-1">
                    <div className="px-3 py-2">
                      <p className="text-sm font-medium truncate">
                        {user.displayName ?? "User"}
                      </p>
                      <p className="text-xs text-gray-400 truncate">
                        {user.email}
                      </p>
                    </div>
                    <DropdownMenuSeparator />

                    <DropdownMenuItem asChild>
                      <Link href="/profile" className="cursor-pointer">
                        <User className="w-4 h-4 mr-2" />
                        My Profile
                      </Link>
                    </DropdownMenuItem>

                    <DropdownMenuItem asChild>
                      <Link href="/orders" className="cursor-pointer">
                        <Package className="w-4 h-4 mr-2" />
                        My Orders
                      </Link>
                    </DropdownMenuItem>

                    <DropdownMenuItem asChild>
                      <Link href="/wishlist" className="cursor-pointer">
                        <Heart className="w-4 h-4 mr-2" />
                        Wishlist
                      </Link>
                    </DropdownMenuItem>

                    {/* Admin link - only for admins */}
                    {dbUser?.role === "ADMIN" && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link
                            href="/admin"
                            className="cursor-pointer text-violet-600"
                          >
                            <Sparkles className="w-4 h-4 mr-2" />
                            Admin Dashboard
                          </Link>
                        </DropdownMenuItem>
                      </>
                    )}

                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={logout}
                      className="text-red-500 cursor-pointer focus:text-red-500"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <div className="flex items-center gap-2">
                  <Link href="/login">
                    <Button variant="ghost" size="sm">
                      Sign In
                    </Button>
                  </Link>
                  <Link href="/register">
                    <Button size="sm">Get Started</Button>
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile Menu */}
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>

              <SheetContent side="left" className="w-72 p-0">
                <MobileMenu
                  user={user}
                  dbUser={dbUser}
                  pathname={pathname}
                  onClose={() => setMobileOpen(false)}
                  onLogout={logout}
                />
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}


// Mobile Menu
function MobileMenu({
  user,
  dbUser,
  pathname,
  onClose,
  onLogout,
} : {
  user: any;
  dbUser: any;
  pathname: string;
  onClose: () => void;
  onLogout: () => void;
}){
  return (
    <div className="flex flex-col h-full">

      {/* Header */}
      <div className="flex items-center gap-3 p-5 border-b border-gray-100">
        <Sparkles className="w-5 h-5 text-violet-500" />
        <span className="font-semibold text-lg">QuantumCart</span>
      </div>

      {/* User info */}
      {user && (
        <div className="flex items-center gap-3 px-5 py-4 bg-gray-50 border-b border-gray-100">
          <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center text-violet-700 text-sm font-semibold">
            {user.photoURL ? (
              <img
                src={user.photoURL}
                alt="avatar"
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              getInitials(user.displayName)
            )}
          </div>
          <div>
            <p className="text-sm font-medium">{user.displayName ?? "User"}</p>
            <p className="text-xs text-gray-400 truncate max-w-[180px]">
              {user.email}
            </p>
          </div>
        </div>
      )}

      {/* Nav links */}
      <nav className="flex flex-col gap-1 p-3 flex-1">
        {navLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            onClick={onClose}
            className={`
              flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
              ${
                pathname === link.href
                  ? "bg-gray-100 text-gray-900"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }
            `}
          >
            {link.label}
          </Link>
        ))}

        <div className="h-px bg-gray-100 my-2" />

        {user ? (
          <>
            <Link href="/profile"  onClick={onClose} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
              <User    className="w-4 h-4" /> My Profile
            </Link>
            <Link href="/orders"   onClick={onClose} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
              <Package className="w-4 h-4" /> My Orders
            </Link>
            <Link href="/wishlist" onClick={onClose} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
              <Heart   className="w-4 h-4" /> Wishlist
            </Link>
            {dbUser?.role === "ADMIN" && (
              <Link href="/admin" onClick={onClose} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-violet-600 hover:bg-violet-50">
                <Sparkles className="w-4 h-4" /> Admin Dashboard
              </Link>
            )}
          </>
        ) : (
          <>
            <Link href="/login"    onClick={onClose} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
              <LogIn className="w-4 h-4" /> Sign In
            </Link>
          </>
        )}
      </nav>

      {/* Bottom logout */}
      {user && (
        <div className="p-3 border-t border-gray-100">
          <button
            onClick={() => { onLogout(); onClose(); }}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm text-red-500 hover:bg-red-50 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      )}
    </div>
  )
}