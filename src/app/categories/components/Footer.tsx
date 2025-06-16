"use client"

import Link from "next/link"
import { Twitter, Instagram, Facebook, Youtube } from "lucide-react"

export default function Footer() {
  return (
    <footer className="relative bg-gradient-to-t from-stone-100 via-white to-white pt-16 pb-8 border-t border-stone-200/80">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-10 mb-12">
          {/* Logo & Mission */}
          <div className="lg:col-span-2 space-y-4">
            <Link href="/" className="flex items-center gap-3 mb-4 group">
               <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-md group-hover:shadow-lg transition-all duration-300 rotate-12 group-hover:rotate-0">
                {/* You can use an actual logo/icon here, ShoppingBag is a placeholder */}
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-stone-800 via-amber-700 to-rose-700 bg-clip-text text-transparent">
                BoutiqueBox
              </span>
            </Link>
            <p className="text-stone-600 text-sm leading-relaxed max-w-md">
              Discover curated collections of premium products, handpicked for the discerning taste. We believe in quality, craftsmanship, and a touch of luxury in everyday life.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h5 className="text-stone-700 font-semibold mb-4 text-lg">Quick Links</h5>
            <ul className="space-y-2">
              <li><Link href="/categories" className="text-stone-600 hover:text-amber-600 transition-colors text-sm">Collections</Link></li>
              <li><Link href="/about" className="text-stone-600 hover:text-amber-600 transition-colors text-sm">About Us</Link></li>
              <li><Link href="/artisans" className="text-stone-600 hover:text-amber-600 transition-colors text-sm">Our Artisans</Link></li>
              <li><Link href="/sustainability" className="text-stone-600 hover:text-amber-600 transition-colors text-sm">Sustainability</Link></li>
              <li><Link href="/blog" className="text-stone-600 hover:text-amber-600 transition-colors text-sm">Blog</Link></li>
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h5 className="text-stone-700 font-semibold mb-4 text-lg">Support</h5>
            <ul className="space-y-2">
              <li><Link href="/contact" className="text-stone-600 hover:text-amber-600 transition-colors text-sm">Contact Us</Link></li>
              <li><Link href="/faq" className="text-stone-600 hover:text-amber-600 transition-colors text-sm">FAQ</Link></li>
              <li><Link href="/shipping" className="text-stone-600 hover:text-amber-600 transition-colors text-sm">Shipping & Returns</Link></li>
              <li><Link href="/privacy" className="text-stone-600 hover:text-amber-600 transition-colors text-sm">Privacy Policy</Link></li>
              <li><Link href="/terms" className="text-stone-600 hover:text-amber-600 transition-colors text-sm">Terms of Service</Link></li>
            </ul>
          </div>

          {/* Connect */}
          <div>
            <h5 className="text-stone-700 font-semibold mb-4 text-lg">Connect</h5>
            <div className="flex space-x-4 mb-4">
              <Link href="#" className="text-stone-500 hover:text-amber-600 transition-colors"><Twitter size={20} /></Link>
              <Link href="#" className="text-stone-500 hover:text-amber-600 transition-colors"><Instagram size={20} /></Link>
              <Link href="#" className="text-stone-500 hover:text-amber-600 transition-colors"><Facebook size={20} /></Link>
              <Link href="#" className="text-stone-500 hover:text-amber-600 transition-colors"><Youtube size={20} /></Link>
            </div>
            <p className="text-stone-600 text-sm mb-2">Stay updated with our latest collections and offers.</p>
            <form className="flex">
              <input type="email" placeholder="Enter your email" className="w-full px-4 py-2.5 text-sm border border-stone-300 rounded-l-lg focus:ring-amber-500 focus:border-amber-500 outline-none transition-colors" />
              <button type="submit" className="bg-gradient-to-r from-amber-500 to-rose-500 text-white px-4 py-2.5 text-sm font-medium rounded-r-lg hover:from-amber-600 hover:to-rose-600 transition-all">
                Subscribe
              </button>
            </form>
          </div>
        </div>

        {/* Copyright */}
        <div className="text-center border-t border-stone-200/80 pt-8">
          <p className="text-stone-500 text-sm">
            &copy; {new Date().getFullYear()} BoutiqueBox. All Rights Reserved.
          </p>
          <p className="text-stone-400 text-xs mt-1">
            Crafted with <span className="text-rose-500">♥</span> by Your Name/Company
          </p>
        </div>
      </div>

      {/* Decorative elements for footer */}
      <div className="absolute -bottom-20 -right-20 w-60 h-60 bg-gradient-to-br from-emerald-100/20 to-teal-200/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-10 -left-32 w-72 h-72 bg-gradient-to-br from-rose-100/20 to-pink-200/10 rounded-full blur-3xl pointer-events-none"></div>
    </footer>
  )
}
