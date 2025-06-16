"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Search, ShoppingBag, Heart, User, Menu, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function StickyHeader() {
  const [isVisible, setIsVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)

  useEffect(() => {
    const controlHeader = () => {
      const currentScrollY = window.scrollY

      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        // Scrolling down & past threshold
        setIsVisible(false)
      } else {
        // Scrolling up
        setIsVisible(true)
      }

      setLastScrollY(currentScrollY)
    }

    window.addEventListener("scroll", controlHeader)
    return () => window.removeEventListener("scroll", controlHeader)
  }, [lastScrollY])

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ease-in-out ${
        isVisible ? "translate-y-0" : "-translate-y-full"
      }`}
    >
      <div className="bg-white/80 backdrop-blur-xl border-b border-stone-200/50 shadow-lg">
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-md group-hover:shadow-lg transition-all duration-300 rotate-12 group-hover:rotate-0">
                <ShoppingBag className="w-5 h-5 text-white" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-stone-800 via-amber-700 to-rose-700 bg-clip-text text-transparent">
                BoutiqueBox
              </span>
            </Link>

            {/* Navigation */}
            <nav className="hidden md:flex items-center gap-8">
              <Link
                href="/categories"
                className="text-stone-600 hover:text-amber-600 font-medium transition-colors duration-300 relative group"
              >
                Collections
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-amber-500 to-rose-500 group-hover:w-full transition-all duration-300"></span>
              </Link>
              <Link
                href="/about"
                className="text-stone-600 hover:text-amber-600 font-medium transition-colors duration-300 relative group"
              >
                About
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-amber-500 to-rose-500 group-hover:w-full transition-all duration-300"></span>
              </Link>
              <Link
                href="/artisans"
                className="text-stone-600 hover:text-amber-600 font-medium transition-colors duration-300 relative group"
              >
                Artisans
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-amber-500 to-rose-500 group-hover:w-full transition-all duration-300"></span>
              </Link>
              <Link
                href="/sustainability"
                className="text-stone-600 hover:text-amber-600 font-medium transition-colors duration-300 relative group flex items-center gap-1"
              >
                <Sparkles className="w-4 h-4" />
                Sustainability
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-amber-500 to-rose-500 group-hover:w-full transition-all duration-300"></span>
              </Link>
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-4">
              {/* Search */}
              <Button
                variant="ghost"
                size="sm"
                className="hidden sm:flex text-stone-600 hover:text-amber-600 hover:bg-amber-50"
              >
                <Search className="w-5 h-5" />
              </Button>

              {/* Wishlist */}
              <Button
                variant="ghost"
                size="sm"
                className="text-stone-600 hover:text-rose-600 hover:bg-rose-50 relative"
              >
                <Heart className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white text-xs rounded-full flex items-center justify-center">
                  3
                </span>
              </Button>

              {/* Cart */}
              <Button
                variant="ghost"
                size="sm"
                className="text-stone-600 hover:text-emerald-600 hover:bg-emerald-50 relative"
              >
                <ShoppingBag className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 text-white text-xs rounded-full flex items-center justify-center">
                  2
                </span>
              </Button>

              {/* Profile */}
              <Button variant="ghost" size="sm" className="text-stone-600 hover:text-amber-600 hover:bg-amber-50">
                <User className="w-5 h-5" />
              </Button>

              {/* Mobile Menu */}
              <Button variant="ghost" size="sm" className="md:hidden text-stone-600 hover:text-amber-600">
                <Menu className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Organic decoration line */}
        <div className="h-1 bg-gradient-to-r from-emerald-400 via-amber-400 to-rose-400 opacity-60"></div>
      </div>
    </header>
  )
}
