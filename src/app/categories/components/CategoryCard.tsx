
"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { ArrowRight, Package, Star } from "lucide-react"

interface Category {
  id: string; // Expect string ID from page component
  name: string;
  description?: string | null;
  image_url: string; // Now required, placeholder will be provided by page
  product_count?: number;
  slug: string;
  color?: string;
}

interface CategoryCardProps {
  category: Category
  index: number
}

export default function CategoryCard({ category, index }: CategoryCardProps) {
  const [imageError, setImageError] = useState(false) // Kept for robustness if an image_url is somehow invalid
  const [isHovered, setIsHovered] = useState(false)

  return (
    <Link
      href={`/category/${category.id}`} // Changed to link to /category/[categoryId]
      className="group block"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className="relative h-96 rounded-3xl overflow-hidden transition-all duration-700 hover:scale-[1.02] hover:-translate-y-3 animate-fade-in-up shadow-xl hover:shadow-2xl"
        style={{
          animationDelay: `${index * 150}ms`,
          animationFillMode: "both",
        }}
      >
        <div className="absolute inset-0 bg-white/90 backdrop-blur-xl border border-stone-200/50 rounded-3xl"></div>
        <div
          className={`absolute inset-0 bg-gradient-to-br ${category.color || "from-stone-400 to-stone-600"}/10 rounded-3xl opacity-0 group-hover:opacity-100 transition-all duration-500`}
        ></div>
        <div
          className={`absolute inset-0 bg-gradient-to-br ${category.color || "from-stone-400 to-stone-600"}/20 rounded-3xl opacity-0 group-hover:opacity-100 transition-all duration-500 blur-xl scale-105`}
        ></div>

        <div className="relative h-56 overflow-hidden rounded-t-3xl">
          {category.image_url && !imageError ? (
            <Image
              src={category.image_url} // Assumes valid placeholder or real URL
              alt={category.name}
              fill
              className="object-cover transition-all duration-700 group-hover:scale-110"
              onError={() => setImageError(true)} // Fallback if provided URL fails
              data-ai-hint={category.slug || 'category item'}
            />
          ) : (
            <div
              className={`w-full h-full bg-gradient-to-br ${category.color || "from-stone-400 to-stone-600"}/20 flex items-center justify-center relative`}
            >
              <Package className="w-20 h-20 text-stone-400/60" />
              <div className="absolute top-4 left-4 w-8 h-8 bg-white/30 rounded-full animate-pulse"></div>
              <div className="absolute bottom-6 right-6 w-6 h-6 bg-white/20 rounded-full animate-pulse delay-500"></div>
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"></div>
          <div className="absolute top-4 left-4 px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full text-stone-700 text-xs font-semibold border border-stone-200/50 shadow-lg">
            <Star className="w-3 h-3 inline mr-1 text-amber-500" />
            Premium
          </div>
          {category.product_count && (
            <div className="absolute top-4 right-4 px-3 py-1 bg-black/20 backdrop-blur-sm rounded-full text-white text-sm font-medium border border-white/20">
              {category.product_count} items
            </div>
          )}
        </div>

        <div className="relative p-6 h-40 flex flex-col justify-between">
          <div>
            <h3 className="text-2xl font-bold text-stone-800 mb-3 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-amber-600 group-hover:to-rose-600 group-hover:bg-clip-text transition-all duration-500 leading-tight">
              {category.name}
            </h3>
            {category.description && (
              <p className="text-stone-600 text-sm leading-relaxed line-clamp-2 group-hover:text-stone-700 transition-colors duration-300">
                {category.description}
              </p>
            )}
          </div>

          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-2">
              <div
                className={`w-3 h-3 rounded-full bg-gradient-to-r ${category.color || "from-stone-400 to-stone-600"} animate-pulse`}
              ></div>
              <span className="text-stone-500 text-xs font-medium uppercase tracking-wider">Explore Collection</span>
            </div>
            <div className="relative">
              <div
                className={`absolute inset-0 bg-gradient-to-r ${category.color || "from-stone-400 to-stone-600"} rounded-full opacity-0 group-hover:opacity-20 transition-all duration-300 scale-150 blur-sm`}
              ></div>
              <div className="relative w-12 h-12 bg-stone-100 group-hover:bg-white rounded-full flex items-center justify-center border border-stone-200 group-hover:border-stone-300 transition-all duration-300 shadow-sm group-hover:shadow-lg">
                <ArrowRight
                  className={`w-5 h-5 text-stone-600 group-hover:text-stone-800 transition-all duration-300 ${isHovered ? "translate-x-1" : ""}`}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-1000 ease-out skew-x-12"></div>
        <div className="absolute top-1/2 left-1/2 w-2 h-2 bg-amber-400/40 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-500 animate-float transform -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute top-1/3 right-1/4 w-1 h-1 bg-rose-400/40 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-700 animate-float-delayed transform"></div>
      </div>
    </Link>
  )
}
