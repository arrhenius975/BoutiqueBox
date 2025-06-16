"use client"

import { useParams } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Grid, List } from "lucide-react"
import { Button } from "@/components/ui/button"
// Note: This page will use the StickyHeader and Footer from its layout or parent if not overridden.
// For now, we'll assume a global header/footer provided by a higher-level layout.
// Or, if CategoriesPage has its own StickyHeader/Footer, this page might not need them explicitly.

export default function CategoryPage() {
  const params = useParams()
  const slug = params.slug as string

  // Convert slug to readable name
  const categoryName =
    slug
      ?.split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ") || "Category"

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="relative container mx-auto px-4 py-12 pt-24"> {/* Added pt-24 for sticky header */}
        {/* Header - Assuming a global sticky header is present. If not, import and use StickyHeader from components */}
        
        {/* Back Button and Title */}
        <div className="flex items-center justify-between mb-8">
            <Link href="/categories">
                <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/10 hover:text-purple-400 transition-colors flex items-center"
                >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Categories
                </Button>
            </Link>
        </div>


        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent mb-4">
            {categoryName}
          </h1>
          <p className="text-slate-300 text-lg">Discover amazing products in {categoryName}</p>
        </div>

        {/* View Toggle */}
        <div className="flex justify-center mb-8">
          <div className="flex bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-1">
            <Button variant="ghost" size="sm" className="text-white hover:bg-white/10 rounded-xl">
              <Grid className="w-4 h-4 mr-2" />
              Grid
            </Button>
            <Button variant="ghost" size="sm" className="text-white hover:bg-white/10 rounded-xl">
              <List className="w-4 h-4 mr-2" />
              List
            </Button>
          </div>
        </div>

        {/* Placeholder for products */}
        <div className="text-center py-16">
          <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-purple-400/20 to-cyan-400/20 rounded-full flex items-center justify-center backdrop-blur-sm">
            <Grid className="w-12 h-12 text-slate-400" />
          </div>
          <h3 className="text-2xl font-semibold text-slate-300 mb-2">Products Coming Soon</h3>
          <p className="text-slate-400">Real products for '{categoryName}' will be listed here!</p>
        </div>
      </div>
      {/* Footer - Assuming a global footer or the one from CategoriesPage layout */}
    </div>
  )
}
