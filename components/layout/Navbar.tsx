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
      const res = await fetch("/api/cart/count");
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
            
          </div>
        </div>
      </div>
    </header>
  );
}
