
"use client"

import { useState, useEffect } from "react"
import { Search, Sparkles, Leaf, ShoppingBag, Loader2, AlertTriangle } from "lucide-react"
import { Input } from "@/components/ui/input"
import CategoryCard from "./components/CategoryCard"
import StickyHeader from "./components/StickyHeader"
import Footer from "./components/Footer"
import type { SupabaseCategory } from "@/types"; // Import SupabaseCategory

// Updated Category interface for CategoryCard props
interface Category {
  id: string; // Will be SupabaseCategory.id.toString()
  name: string;
  description?: string | null; // Match SupabaseCategory
  image_url: string; // We'll generate this
  product_count?: number; // This is optional as API doesn't provide it directly
  slug: string; // Generated from name
  color?: string; // Optional for styling
}

export default function CategoriesPage() {
  const [allCategories, setAllCategories] = useState<SupabaseCategory[]>([])
  const [filteredCategories, setFilteredCategories] = useState<Category[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchCategoriesFromAPI = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/categories');
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Failed to fetch categories' }));
          throw new Error(errorData.error || `Server error: ${response.status}`);
        }
        const data: SupabaseCategory[] = await response.json();
        setAllCategories(data);
      } catch (err) {
        console.error("Error fetching categories:", err);
        setError((err as Error).message);
        setAllCategories([]);
      } finally {
        setLoading(false);
      }
    };
    fetchCategoriesFromAPI();
  }, [])

  // Transform and filter categories based on search term
  useEffect(() => {
    const transformed = allCategories.map((sc, index) => {
      const colors = [
        "from-rose-400 to-pink-500",
        "from-amber-400 to-orange-500",
        "from-emerald-400 to-teal-500",
        "from-violet-400 to-purple-500",
        "from-cyan-400 to-blue-500",
        "from-yellow-400 to-amber-500",
      ];
      return {
        id: sc.id.toString(),
        name: sc.name,
        description: sc.description,
        slug: sc.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, ''),
        image_url: `https://placehold.co/320x240.png?text=${encodeURIComponent(sc.name.substring(0,3))}`,
        color: colors[index % colors.length],
        // product_count could be fetched separately or added to API if needed
      };
    });

    const filtered = transformed.filter(
      (category) =>
        category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (category.description && category.description.toLowerCase().includes(searchTerm.toLowerCase())),
    )
    setFilteredCategories(filtered)
  }, [allCategories, searchTerm])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-stone-50 via-amber-50 to-rose-50">
        <StickyHeader />
        <div className="container mx-auto px-4 py-12 pt-32">
          <div className="flex flex-col items-center justify-center min-h-[calc(100vh-20rem)]">
            <div className="relative mb-8">
              <Loader2 className="w-20 h-20 text-amber-500 animate-spin" />
            </div>
            <div className="flex items-center gap-3">
              <Leaf className="w-6 h-6 text-emerald-600 animate-pulse" />
              <p className="text-stone-600 font-medium">Curating your boutique experience...</p>
              <Sparkles className="w-6 h-6 text-amber-600 animate-pulse" />
            </div>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  if (error) {
     return (
      <div className="min-h-screen bg-gradient-to-br from-stone-50 via-amber-50 to-rose-50">
        <StickyHeader />
        <div className="container mx-auto px-4 py-12 pt-32">
          <div className="flex flex-col items-center justify-center min-h-[calc(100vh-20rem)] text-center">
            <AlertTriangle className="w-20 h-20 text-destructive mb-6" />
            <h2 className="text-3xl font-bold text-stone-800 mb-3">Failed to Load Categories</h2>
            <p className="text-stone-600 mb-6 max-w-md">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-amber-50 to-rose-50 relative overflow-hidden">
      <StickyHeader />
      <div className="relative container mx-auto px-6 py-16 pt-32">
        <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
          <div className="absolute -top-40 -left-40 w-80 h-80 bg-gradient-to-br from-emerald-200/30 to-teal-300/20 rounded-full blur-3xl animate-float"></div>
          <div className="absolute top-1/3 -right-32 w-96 h-96 bg-gradient-to-br from-rose-200/30 to-pink-300/20 rounded-full blur-3xl animate-float-delayed"></div>
          <div className="absolute -bottom-32 left-1/3 w-72 h-72 bg-gradient-to-br from-amber-200/30 to-orange-300/20 rounded-full blur-3xl animate-float-slow"></div>
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

        {filteredCategories.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10">
            {filteredCategories.map((category, index) => (
              <CategoryCard key={category.id} category={category} index={index} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 animate-fade-in">
            <div className="w-32 h-32 mx-auto mb-8 bg-gradient-to-br from-stone-100 to-amber-100 rounded-full flex items-center justify-center shadow-inner">
              <Search className="w-16 h-16 text-stone-400" />
            </div>
            <h3 className="text-3xl font-bold text-stone-700 mb-4">
              {allCategories.length === 0 ? "No Collections Yet" : "No Collections Found"}
            </h3>
            <p className="text-stone-500 text-lg">
              {allCategories.length === 0 ? "The administrator can add new collections via the admin panel." : "Try adjusting your search or explore all our curated categories."}
            </p>
          </div>
        )}
      </div>
      <Footer />
    </div>
  )
}
