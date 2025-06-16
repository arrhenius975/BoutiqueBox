"use client"

import { useState, useEffect } from "react"
import { Search, Sparkles, Leaf, ShoppingBag } from "lucide-react"
import { Input } from "@/components/ui/input"
import CategoryCard from "./components/CategoryCard"
import StickyHeader from "./components/StickyHeader"
import Footer from "./components/Footer"

// Types
interface Category {
  id: string
  name: string
  description?: string
  image_url?: string
  icon?: string
  product_count?: number
  slug: string
  color?: string
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [filteredCategories, setFilteredCategories] = useState<Category[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)

  // Load demo categories on component mount
  useEffect(() => {
    loadDemoCategories()
  }, [])

  // Filter categories based on search term
  useEffect(() => {
    const filtered = categories.filter(
      (category) =>
        category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        category.description?.toLowerCase().includes(searchTerm.toLowerCase()),
    )
    setFilteredCategories(filtered)
  }, [categories, searchTerm])

  const loadDemoCategories = async () => {
    // Simulate loading delay for better UX
    await new Promise((resolve) => setTimeout(resolve, 1200))

    setCategories([
      {
        id: "1",
        name: "Luxury Fashion",
        description: "Premium designer clothing and haute couture",
        image_url: "https://placehold.co/320x240.png?text=Fashion",
        product_count: 156,
        slug: "luxury-fashion",
        color: "from-rose-400 to-pink-500",
      },
      {
        id: "2",
        name: "Artisan Jewelry",
        description: "Handcrafted precious metals and gemstones",
        image_url: "https://placehold.co/320x240.png?text=Jewelry",
        product_count: 89,
        slug: "artisan-jewelry",
        color: "from-amber-400 to-orange-500",
      },
      {
        id: "3",
        name: "Home Décor",
        description: "Curated pieces for sophisticated living",
        image_url: "https://placehold.co/320x240.png?text=Decor",
        product_count: 234,
        slug: "home-decor",
        color: "from-emerald-400 to-teal-500",
      },
      {
        id: "4",
        name: "Wellness & Beauty",
        description: "Organic skincare and wellness essentials",
        image_url: "https://placehold.co/320x240.png?text=Beauty",
        product_count: 167,
        slug: "wellness-beauty",
        color: "from-violet-400 to-purple-500",
      },
      {
        id: "5",
        name: "Artisan Crafts",
        description: "Unique handmade treasures from global artisans",
        image_url: "https://placehold.co/320x240.png?text=Crafts",
        product_count: 145,
        slug: "artisan-crafts",
        color: "from-cyan-400 to-blue-500",
      },
      {
        id: "6",
        name: "Gourmet Collection",
        description: "Premium foods and culinary experiences",
        image_url: "https://placehold.co/320x240.png?text=Gourmet",
        product_count: 78,
        slug: "gourmet-collection",
        color: "from-yellow-400 to-amber-500",
      },
    ])

    setLoading(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-stone-50 via-amber-50 to-rose-50">
        <div className="container mx-auto px-4 py-12">
          <div className="flex flex-col items-center justify-center min-h-[70vh]">
            <div className="relative mb-8">
              <div className="w-20 h-20 border-4 border-amber-200 border-t-amber-500 rounded-full animate-spin"></div>
              <div className="absolute inset-0 w-20 h-20 border-4 border-rose-200 border-t-rose-500 rounded-full animate-spin animate-reverse"></div>
            </div>
            <div className="flex items-center gap-3">
              <Leaf className="w-6 h-6 text-emerald-600 animate-pulse" />
              <p className="text-stone-600 font-medium">Curating your boutique experience...</p>
              <Sparkles className="w-6 h-6 text-amber-600 animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-amber-50 to-rose-50 relative overflow-hidden">
      {/* Sticky Header */}
      <StickyHeader />

      {/* Organic Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-80 h-80 bg-gradient-to-br from-emerald-200/30 to-teal-300/20 rounded-full blur-3xl animate-float"></div>
        <div className="absolute top-1/3 -right-32 w-96 h-96 bg-gradient-to-br from-rose-200/30 to-pink-300/20 rounded-full blur-3xl animate-float-delayed"></div>
        <div className="absolute -bottom-32 left-1/3 w-72 h-72 bg-gradient-to-br from-amber-200/30 to-orange-300/20 rounded-full blur-3xl animate-float-slow"></div>

        {/* Organic Shapes */}
        <svg className="absolute top-20 right-20 w-32 h-32 text-stone-200/40 animate-pulse" viewBox="0 0 100 100">
          <path d="M20,50 Q30,20 50,30 Q70,40 80,50 Q70,80 50,70 Q30,60 20,50 Z" fill="currentColor" />
        </svg>
        <svg
          className="absolute bottom-32 left-16 w-24 h-24 text-emerald-200/40 animate-pulse delay-1000"
          viewBox="0 0 100 100"
        >
          <path d="M30,50 Q40,25 60,35 Q75,45 70,65 Q55,75 40,65 Q25,55 30,50 Z" fill="currentColor" />
        </svg>
      </div>

      <div className="relative container mx-auto px-6 py-16 pt-32">
        {/* Header Section */}
        <div className="text-center mb-16 animate-fade-in-up">
          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg rotate-12 animate-gentle-bounce">
              <ShoppingBag className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-6xl md:text-7xl font-bold bg-gradient-to-r from-stone-800 via-amber-700 to-rose-700 bg-clip-text text-transparent tracking-tight">
              BoutiqueBox
            </h1>
            <div className="w-12 h-12 bg-gradient-to-br from-rose-500 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg -rotate-12 animate-gentle-bounce delay-300">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
          </div>
          <p className="text-2xl text-stone-600 max-w-3xl mx-auto leading-relaxed font-light">
            Discover curated collections of premium products,
            <span className="text-amber-700 font-medium"> handpicked for the discerning taste</span>
          </p>
          <div className="flex items-center justify-center gap-2 mt-4">
            <Leaf className="w-5 h-5 text-emerald-600" />
            <span className="text-stone-500 text-sm font-medium">Sustainably Sourced • Ethically Crafted</span>
            <Leaf className="w-5 h-5 text-emerald-600" />
          </div>
        </div>

        {/* Search Bar */}
        <div className="max-w-lg mx-auto mb-16 animate-slide-up">
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-amber-400/20 to-rose-400/20 rounded-3xl blur-xl opacity-0 group-focus-within:opacity-100 transition-all duration-500"></div>
            <div className="relative bg-white/80 backdrop-blur-xl border border-stone-200/50 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300">
              <Search className="absolute left-6 top-1/2 transform -translate-y-1/2 text-stone-400 w-5 h-5 group-focus-within:text-amber-600 transition-colors duration-300" />
              <Input
                type="text"
                placeholder="Search our curated collections..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-14 pr-6 py-4 bg-transparent border-0 text-stone-700 placeholder-stone-400 focus:ring-0 focus:outline-none text-lg font-medium rounded-3xl"
              />
            </div>
          </div>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10">
          {filteredCategories.map((category, index) => (
            <CategoryCard key={category.id} category={category} index={index} />
          ))}
        </div>

        {/* No Results */}
        {filteredCategories.length === 0 && searchTerm && (
          <div className="text-center py-20 animate-fade-in">
            <div className="w-32 h-32 mx-auto mb-8 bg-gradient-to-br from-stone-100 to-amber-100 rounded-full flex items-center justify-center shadow-inner">
              <Search className="w-16 h-16 text-stone-400" />
            </div>
            <h3 className="text-3xl font-bold text-stone-700 mb-4">No collections found</h3>
            <p className="text-stone-500 text-lg">Try exploring our other curated categories</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <Footer />
    </div>
  )
}
