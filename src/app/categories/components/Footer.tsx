
"use client"

import Link from "next/link"
import {
  Instagram,
  Facebook,
  Twitter,
  Youtube,
  Mail,
  Phone,
  MapPin,
  Leaf,
  Heart,
  ShoppingBag,
  Sparkles,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function Footer() {
  return (
    <footer className="relative bg-gradient-to-br from-stone-100 via-amber-50 to-rose-100 border-t border-stone-200/50">
      {/* Organic Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-1/4 w-64 h-64 bg-gradient-to-br from-emerald-200/20 to-teal-300/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 right-1/4 w-80 h-80 bg-gradient-to-br from-rose-200/20 to-pink-300/10 rounded-full blur-3xl"></div>

        {/* Organic Shapes */}
        <svg className="absolute top-20 right-10 w-24 h-24 text-stone-200/30 animate-pulse" viewBox="0 0 100 100">
          <path d="M25,50 Q35,25 55,35 Q75,45 70,65 Q55,75 40,65 Q25,55 25,50 Z" fill="currentColor" />
        </svg>
        <svg
          className="absolute bottom-32 left-10 w-20 h-20 text-amber-200/30 animate-pulse delay-1000"
          viewBox="0 0 100 100"
        >
          <path d="M30,50 Q40,30 60,40 Q80,50 75,70 Q60,80 45,70 Q30,60 30,50 Z" fill="currentColor" />
        </svg>
      </div>

      <div className="relative container mx-auto px-6 py-16">
        {/* Newsletter Section */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Sparkles className="w-6 h-6 text-amber-600 animate-pulse" />
            <h3 className="text-3xl font-bold bg-gradient-to-r from-stone-800 via-amber-700 to-rose-700 bg-clip-text text-transparent">
              Stay in the Loop
            </h3>
            <Sparkles className="w-6 h-6 text-rose-600 animate-pulse delay-300" />
          </div>
          <p className="text-stone-600 mb-8 max-w-2xl mx-auto leading-relaxed">
            Be the first to discover new collections, exclusive artisan stories, and sustainable living tips.
          </p>

          <div className="max-w-md mx-auto">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-amber-400/20 to-rose-400/20 rounded-full blur-xl opacity-0 group-focus-within:opacity-100 transition-all duration-500"></div>
              <div className="relative flex bg-white/80 backdrop-blur-xl border border-stone-200/50 rounded-full shadow-lg hover:shadow-xl transition-all duration-300">
                <Input
                  type="email"
                  placeholder="Enter your email address"
                  className="flex-1 bg-transparent border-0 px-6 py-3 text-stone-700 placeholder-stone-400 focus:ring-0 focus:outline-none rounded-full"
                />
                <Button className="bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 text-white px-6 py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300">
                  <Mail className="w-4 h-4 mr-2" />
                  Subscribe
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          {/* Brand Section */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg rotate-12">
                <ShoppingBag className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-stone-800 via-amber-700 to-rose-700 bg-clip-text text-transparent">
                BoutiqueBox
              </span>
            </div>
            <p className="text-stone-600 mb-6 leading-relaxed">
              Curating premium products from global artisans, committed to sustainability and ethical craftsmanship.
            </p>
            <div className="flex items-center gap-2 text-emerald-600 mb-4">
              <Leaf className="w-4 h-4" />
              <span className="text-sm font-medium">Carbon Neutral Shipping</span>
            </div>
            <div className="flex items-center gap-2 text-rose-600">
              <Heart className="w-4 h-4" />
              <span className="text-sm font-medium">Supporting Local Artisans</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold text-stone-800 mb-6">Collections</h4>
            <ul className="space-y-3">
              {[
                "Luxury Fashion",
                "Artisan Jewelry",
                "Home Décor",
                "Wellness & Beauty",
                "Artisan Crafts",
                "Gourmet Collection",
              ].map((item) => (
                <li key={item}>
                  <Link
                    href={`/categories/${item.toLowerCase().replace(/\s+/g, "-").replace("&", "")}`}
                    className="text-stone-600 hover:text-amber-600 transition-colors duration-300 flex items-center gap-2 group"
                  >
                    <span className="w-1 h-1 bg-stone-400 rounded-full group-hover:bg-amber-500 transition-colors duration-300"></span>
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-lg font-semibold text-stone-800 mb-6">Company</h4>
            <ul className="space-y-3">
              {["About Us", "Our Artisans", "Sustainability", "Press & Media", "Careers", "Wholesale"].map((item) => (
                <li key={item}>
                  <Link
                    href={`/${item.toLowerCase().replace(/\s+/g, "-").replace("&", "")}`}
                    className="text-stone-600 hover:text-amber-600 transition-colors duration-300 flex items-center gap-2 group"
                  >
                    <span className="w-1 h-1 bg-stone-400 rounded-full group-hover:bg-amber-500 transition-colors duration-300"></span>
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact & Social */}
          <div>
            <h4 className="text-lg font-semibold text-stone-800 mb-6">Connect</h4>

            {/* Contact Info */}
            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-3 text-stone-600">
                <Phone className="w-4 h-4 text-emerald-600" />
                <span className="text-sm">+1 (555) 123-4567</span>
              </div>
              <div className="flex items-center gap-3 text-stone-600">
                <Mail className="w-4 h-4 text-amber-600" />
                <span className="text-sm">hello@boutiquebox.com</span>
              </div>
              <div className="flex items-center gap-3 text-stone-600">
                <MapPin className="w-4 h-4 text-rose-600" />
                <span className="text-sm">San Francisco, CA</span>
              </div>
            </div>

            {/* Social Links */}
            <div className="flex gap-3">
              {[
                { icon: Instagram, color: "hover:bg-pink-50 hover:text-pink-600", href: "#" },
                { icon: Facebook, color: "hover:bg-blue-50 hover:text-blue-600", href: "#" },
                { icon: Twitter, color: "hover:bg-sky-50 hover:text-sky-600", href: "#" },
                { icon: Youtube, color: "hover:bg-red-50 hover:text-red-600", href: "#" },
              ].map(({ icon: Icon, color, href }, index) => (
                <Link
                  key={index}
                  href={href}
                  className={`w-10 h-10 bg-white/60 backdrop-blur-sm border border-stone-200/50 rounded-xl flex items-center justify-center text-stone-600 ${color} transition-all duration-300 shadow-sm hover:shadow-md hover:scale-110`}
                >
                  <Icon className="w-4 h-4" />
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-stone-200/50 pt-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-6 text-sm text-stone-500">
              <span>© ${new Date().getFullYear()} BoutiqueBox. All rights reserved.</span>
              <Link href="/privacy" className="hover:text-amber-600 transition-colors duration-300">
                Privacy Policy
              </Link>
              <Link href="/terms" className="hover:text-amber-600 transition-colors duration-300">
                Terms of Service
              </Link>
            </div>

            <div className="flex items-center gap-2 text-sm text-stone-500">
              <span>Made with</span>
              <Heart className="w-4 h-4 text-rose-500 animate-pulse" />
              <span>for conscious consumers</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

    