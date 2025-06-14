
// src/app/account/page.tsx
"use client";

import React, { useEffect, useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Edit3, MapPin, ShieldCheck, CreditCard, LogOut, ShoppingBasket, Bell, Heart, MessageSquareQuote, Loader2, UploadCloud } from "lucide-react";
import Link from "next/link";
import { useAppContext } from '@/contexts/AppContext';
import { useRouter } from 'next/navigation';
import { supabase } from '@/data/supabase';
import { useToast } from '@/hooks/use-toast';

export default function AccountPage() {
  const { authUser, userProfile, isLoadingAuth, signOut, setUserProfile } = useAppContext(); // Added setUserProfile for local updates
  const router = useRouter();
  const { toast } = useToast();
  const [localAvatarPreviewUrl, setLocalAvatarPreviewUrl] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isLoadingAuth && !authUser) {
      router.push('/auth/signin');
    }
  }, [authUser, isLoadingAuth, router]);

  // Set initial avatar preview from profile if available
  useEffect(() => {
    if (userProfile?.avatar_url) {
      setLocalAvatarPreviewUrl(userProfile.avatar_url);
    }
  }, [userProfile?.avatar_url]);


  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0) {
      return;
    }
    if (!authUser) {
      toast({ title: "Authentication Error", description: "You must be logged in to upload an avatar.", variant: "destructive" });
      return;
    }

    const file = event.target.files[0];
    const fileName = `avatar.${file.name.split('.').pop()}`; // e.g., avatar.jpg
    const filePath = `${authUser.id}/${fileName}`; // Path: user_auth_id/avatar.jpg

    setIsUploadingAvatar(true);
    const loadingToast = toast({ title: "Uploading avatar...", description: "Please wait.", duration: Infinity });

    const { error: uploadError } = await supabase.storage
      .from('profile-pictures') // Bucket name from your plan
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true, // Overwrite existing avatar
      });

    loadingToast.dismiss();
    setIsUploadingAvatar(false);

    if (uploadError) {
      console.error('Avatar Upload Error:', uploadError);
      toast({ title: 'Avatar Upload Failed', description: uploadError.message, variant: 'destructive' });
    } else {
      const { data: urlData } = supabase.storage
        .from('profile-pictures')
        .getPublicUrl(filePath);
      
      if (urlData.publicUrl) {
        setLocalAvatarPreviewUrl(urlData.publicUrl);
        // In a real app, update userProfile in DB:
        // await supabase.from('users').update({ avatar_url: urlData.publicUrl }).eq('auth_id', authUser.id);
        // And then re-fetch or update AppContext's userProfile
        if (setUserProfile && userProfile) { // Check if setUserProfile exists
            setUserProfile({...userProfile, avatar_url: urlData.publicUrl });
        }
        toast({ title: 'Avatar Uploaded Successfully!' });
      } else {
        toast({ title: 'Failed to get public URL', description: 'Avatar uploaded but URL retrieval failed.', variant: 'destructive' });
      }
    }
  };


  if (isLoadingAuth || (!authUser && !userProfile)) { // Check both authUser and userProfile before rendering
    return (
      <div className="flex min-h-[calc(100vh-200px)] items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }
  
  // If authUser exists but userProfile is still loading (edge case, should be quick)
  if (authUser && !userProfile) {
     return (
      <div className="flex min-h-[calc(100vh-200px)] items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-2">Loading profile...</p>
      </div>
    );
  }

  // This should not be reached if useEffect redirect works, but as a safeguard:
  if (!authUser || !userProfile) {
      router.push('/auth/signin');
      return (
           <div className="flex min-h-[calc(100vh-200px)] items-center justify-center">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="ml-2">Redirecting...</p>
            </div>
      );
  }


  const user = {
    name: userProfile.name || "User",
    email: userProfile.email,
    // Use localAvatarPreviewUrl if available, then userProfile.avatar_url (from DB, if implemented), then placeholder
    avatarUrl: localAvatarPreviewUrl || userProfile.avatar_url || "https://placehold.co/100x100.png?text=User",
    initials: userProfile.name ? userProfile.name.substring(0,2).toUpperCase() : (userProfile.email?.substring(0,2).toUpperCase() || 'U'),
  };

  const handleLogout = async () => {
    await signOut();
    // AppContext will handle redirect after signout, usually to '/'
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
              <div className="relative group w-24 h-24 mx-auto mb-4">
                <Avatar className="w-24 h-24 ring-2 ring-primary ring-offset-2">
                  <AvatarImage src={user.avatarUrl} alt={user.name} data-ai-hint="profile person" />
                  <AvatarFallback>{user.initials}</AvatarFallback>
                </Avatar>
                <Button
                  variant="outline"
                  size="icon"
                  className="absolute bottom-0 right-0 rounded-full h-8 w-8 bg-background group-hover:opacity-100 opacity-70 transition-opacity"
                  onClick={() => fileInputRef.current?.click()}
                  title="Change Profile Picture"
                  disabled={isUploadingAvatar}
                >
                  {isUploadingAvatar ? <Loader2 className="h-4 w-4 animate-spin" /> : <Edit3 className="h-4 w-4" />}
                </Button>
                <Input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*" 
                    onChange={handleAvatarUpload}
                    disabled={isUploadingAvatar}
                />
              </div>
              <CardTitle className="text-2xl">{user.name}</CardTitle>
              <CardDescription>{user.email}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full">
                <Edit3 className="mr-2 h-4 w-4" /> Edit Profile Details
              </Button>
               <p className="text-xs text-muted-foreground text-center pt-1">
                Avatar upload uses Supabase Storage. Ensure bucket 'profile-pictures' and policies are set up. Avatar persistence requires DB schema update.
              </p>
            </CardContent>
          </Card>
           <Button variant="destructive" className="w-full" onClick={handleLogout} disabled={isLoadingAuth || isUploadingAvatar}>
             {(isLoadingAuth || isUploadingAvatar) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
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
                { label: "My Wishlist", icon: Heart, href: "#", action: () => console.log("Open Wishlist Sidebar via context") }, // Replace with actual toggleWishlist or similar
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
