
// src/app/categories/components/Footer.tsx
"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Instagram, Facebook, Twitter, Linkedin, Youtube, Send, Sparkles } from 'lucide-react';

const socialLinks = [
  { icon: Instagram, href: "#", label: "Instagram", color: "hover:bg-pink-50 hover:text-pink-600 dark:hover:bg-pink-700/20 dark:hover:text-pink-400" },
  { icon: Facebook, href: "#", label: "Facebook", color: "hover:bg-blue-50 hover:text-blue-700 dark:hover:bg-blue-700/20 dark:hover:text-blue-400" },
  { icon: Twitter, href: "#", label: "Twitter", color: "hover:bg-sky-50 hover:text-sky-600 dark:hover:bg-sky-700/20 dark:hover:text-sky-400" },
  { icon: Linkedin, href: "#", label: "LinkedIn", color: "hover:bg-blue-100 hover:text-blue-800 dark:hover:bg-blue-800/20 dark:hover:text-blue-300" },
  { icon: Youtube, href: "#", label: "YouTube", color: "hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-700/20 dark:hover:text-red-400" },
];

export function Footer() {
  return (
    <footer className="bg-gradient-to-b from-stone-100 to-amber-50 dark:from-stone-900 dark:to-stone-800 text-stone-700 dark:text-stone-300 pt-16 pb-8">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Newsletter Section */}
        <div className="mb-16 text-center max-w-2xl mx-auto relative">
          <Sparkles className="absolute -top-8 left-1/2 -translate-x-1/2 w-16 h-16 text-amber-400 opacity-30 animate-pulse" />
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gradient bg-gradient-to-r from-stone-800 via-amber-700 to-rose-700 dark:from-stone-200 dark:via-amber-300 dark:to-rose-300">
            Stay Updated
          </h2>
          <p className="text-stone-600 dark:text-stone-400 mb-8">
            Subscribe to our newsletter for the latest collections, exclusive offers, and style inspiration.
          </p>
          <form className="flex flex-col sm:flex-row gap-3 max-w-lg mx-auto">
            <Input
              type="email"
              placeholder="Enter your email address"
              className="flex-grow h-12 rounded-full bg-white/80 dark:bg-stone-700/50 border-stone-300 dark:border-stone-600 focus:ring-2 focus:ring-amber-500 placeholder-stone-500 dark:placeholder-stone-400"
              required
            />
            <Button
              type="submit"
              size="lg"
              className="h-12 rounded-full bg-gradient-to-r from-amber-600 to-rose-600 hover:from-amber-700 hover:to-rose-700 text-white font-semibold transition-all duration-300 transform hover:scale-105 shadow-md"
            >
              <Send className="mr-2 h-5 w-5" /> Subscribe
            </Button>
          </form>
        </div>

        {/* Four-Column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 md:gap-12 mb-12">
          <div>
            <h5 className="font-bold text-lg mb-4 text-stone-800 dark:text-stone-100">Barak Online Store</h5>
            <p className="text-sm leading-relaxed">
              Curated luxury and convenience, delivered to your doorstep. Experience premium products and personalized service.
            </p>
          </div>
          <div>
            <h5 className="font-bold text-lg mb-4 text-stone-800 dark:text-stone-100">Shop</h5>
            <ul className="space-y-2 text-sm">
              <li><Link href="/categories" className="hover:text-amber-600 dark:hover:text-amber-400">All Categories</Link></li>
              <li><Link href="/grocery" className="hover:text-amber-600 dark:hover:text-amber-400">Grocery</Link></li>
              <li><Link href="/cosmetics" className="hover:text-amber-600 dark:hover:text-amber-400">Cosmetics</Link></li>
              <li><Link href="/fastfood" className="hover:text-amber-600 dark:hover:text-amber-400">Fast Food</Link></li>
            </ul>
          </div>
          <div>
            <h5 className="font-bold text-lg mb-4 text-stone-800 dark:text-stone-100">Support</h5>
            <ul className="space-y-2 text-sm">
              <li><Link href="/help" className="hover:text-amber-600 dark:hover:text-amber-400">Help Center</Link></li>
              <li><Link href="/orders" className="hover:text-amber-600 dark:hover:text-amber-400">Track Order</Link></li>
              <li><Link href="#" className="hover:text-amber-600 dark:hover:text-amber-400">Returns & Exchanges</Link></li>
              <li><Link href="#" className="hover:text-amber-600 dark:hover:text-amber-400">Contact Us</Link></li>
            </ul>
          </div>
          <div>
            <h5 className="font-bold text-lg mb-4 text-stone-800 dark:text-stone-100">Company</h5>
            <ul className="space-y-2 text-sm">
              <li><Link href="#" className="hover:text-amber-600 dark:hover:text-amber-400">About Us</Link></li>
              <li><Link href="#" className="hover:text-amber-600 dark:hover:text-amber-400">Careers</Link></li>
              <li><Link href="#" className="hover:text-amber-600 dark:hover:text-amber-400">Privacy Policy</Link></li>
              <li><Link href="#" className="hover:text-amber-600 dark:hover:text-amber-400">Terms of Service</Link></li>
            </ul>
          </div>
        </div>

        {/* Social Media & Copyright */}
        <div className="border-t border-stone-300/70 dark:border-stone-700/70 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-stone-600 dark:text-stone-400 mb-4 md:mb-0">
            &copy; {new Date().getFullYear()} Barak Online Store. All rights reserved.
          </p>
          <div className="flex space-x-3">
            {socialLinks.map((social, index) => (
              <Link key={index} href={social.href} aria-label={social.label} target="_blank" rel="noopener noreferrer">
                <span className={`p-2 rounded-full transition-colors duration-300 text-stone-600 dark:text-stone-400 ${social.color}`}>
                  <social.icon className="w-5 h-5" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
