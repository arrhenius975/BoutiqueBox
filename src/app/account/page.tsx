
// src/app/account/page.tsx
"use client";

import React, { useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Edit3, MapPin, ShieldCheck, CreditCard, LogOut, ShoppingBasket, Bell, Heart, MessageSquareQuote, Loader2 } from "lucide-react";
import Link from "next/link";
import { useAppContext } from '@/contexts/AppContext';
import { useRouter } from 'next/navigation';

export default function AccountPage() {
  const { authUser, userProfile, isLoadingAuth, signOut } = useAppContext();
  const router = useRouter();

  useEffect(() => {
    if (!isLoadingAuth && !authUser) {
      router.push('/auth/signin');
    }
  }, [authUser, isLoadingAuth, router]);

  if (isLoadingAuth || !userProfile) {
    return (
      <div className="flex min-h-[calc(100vh-200px)] items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  const user = {
    name: userProfile.name || "User",
    email: userProfile.email,
    avatarUrl: "https://placehold.co/100x100.png", // Placeholder, replace with actual if available
    initials: userProfile.name ? userProfile.name.substring(0,2).toUpperCase() : (userProfile.email.substring(0,2).toUpperCase()),
  };

  const handleLogout = async () => {
    await signOut();
    // AppContext will handle redirect after signout
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <header className="mb-12">
        <h1 className="font-headline text-4xl font-bold text-primary">My Account</h1>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1 space-y-6">
          <Card>
            <CardHeader className="items-center text-center">
              <Avatar className="w-24 h-24 mb-4 ring-2 ring-primary ring-offset-2">
                <AvatarImage src={user.avatarUrl} alt={user.name} data-ai-hint="profile person" />
                <AvatarFallback>{user.initials}</AvatarFallback>
              </Avatar>
              <CardTitle className="text-2xl">{user.name}</CardTitle>
              <CardDescription>{user.email}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">
                <Edit3 className="mr-2 h-4 w-4" /> Edit Profile
              </Button>
            </CardContent>
          </Card>
           <Button variant="destructive" className="w-full" onClick={handleLogout} disabled={isLoadingAuth}>
             {isLoadingAuth && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <LogOut className="mr-2 h-4 w-4" /> Log Out
          </Button>
        </div>

        <div className="md:col-span-2 space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Manage your personal details.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" defaultValue={user.name} />
              </div>
              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input id="email" type="email" defaultValue={user.email} disabled />
              </div>
              <div>
                <Label htmlFor="phone">Phone Number (Optional)</Label>
                <Input id="phone" type="tel" placeholder="+1 (555) 000-0000" />
              </div>
               <Button>Save Changes</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Account Options</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              {[
                { label: "Order History", icon: ShoppingBasket, href: "/account/orders" },
                { label: "Saved Addresses", icon: MapPin, href: "#" },
                { label: "Payment Methods", icon: CreditCard, href: "#" },
                { label: "Notification Preferences", icon: Bell, href: "/settings" },
                { label: "My Wishlist", icon: Heart, href: "#", action: () => console.log("Open Wishlist Sidebar via context") },
                { label: "Security & Password", icon: ShieldCheck, href: "#" },
                { label: "Help & Support", icon: MessageSquareQuote, href: "/help" },
              ].map(item => (
                <React.Fragment key={item.label}>
                  <Link
                    href={item.href}
                    className="flex items-center justify-between p-3 rounded-md hover:bg-secondary transition-colors"
                    onClick={item.action}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className="h-5 w-5 text-primary" />
                      <span>{item.label}</span>
                    </div>
                    <Edit3 className="h-4 w-4 text-muted-foreground" />
                  </Link>
                  <Separator />
                </React.Fragment>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

    