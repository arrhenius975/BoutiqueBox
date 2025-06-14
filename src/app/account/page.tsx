
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
import { useToast } from '@/hooks/use-toast';

export default function AccountPage() {
  const { authUser, userProfile, isLoadingAuth, signOut, setUserProfile } = useAppContext();
  const router = useRouter();
  const { toast } = useToast();
  const [localAvatarPreviewUrl, setLocalAvatarPreviewUrl] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isLoadingAuth && !authUser) {
      router.push('/signin'); // Corrected path from /auth/signin
    }
  }, [authUser, isLoadingAuth, router]);

  useEffect(() => {
    if (userProfile?.avatar_url) {
      setLocalAvatarPreviewUrl(userProfile.avatar_url);
    } else if (userProfile) {
        setLocalAvatarPreviewUrl(null); // Explicitly set to null if no avatar_url in profile
    }
  }, [userProfile]);


  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0) {
      return;
    }
    if (!authUser) {
      toast({ title: "Authentication Error", description: "You must be logged in to upload an avatar.", variant: "destructive" });
      return;
    }

    const file = event.target.files[0];
    if (file.size > 2 * 1024 * 1024) { // 2MB limit for avatars
       toast({ title: "Avatar Too Large", description: "Please select an image smaller than 2MB.", variant: "destructive" });
       if (fileInputRef.current) fileInputRef.current.value = ""; // Clear input
       return;
    }
    
    const formData = new FormData();
    formData.append('avatar', file);

    setIsUploadingAvatar(true);
    const loadingToastId = toast({ title: "Uploading avatar...", description: "Please wait.", duration: Infinity }).id;

    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Server error during avatar upload."}));
        throw new Error(errorData.error || 'Avatar upload failed. Ensure /api/profile (PUT) is implemented correctly.');
      }

      const result = await response.json();

      if (result.success && result.avatarUrl) {
        setLocalAvatarPreviewUrl(result.avatarUrl); // Update local preview immediately
        if (setUserProfile && userProfile) { // Update context state
            setUserProfile({...userProfile, avatar_url: result.avatarUrl });
        }
        toast({ title: 'Avatar Uploaded Successfully!', description: 'Your profile picture has been updated.' });
      } else {
        throw new Error(result.error || 'Failed to get avatar URL from API response.');
      }

    } catch (error) {
      console.error('Avatar Upload Error:', error);
      toast({ title: 'Avatar Upload Failed', description: (error as Error).message, variant: 'destructive' });
    } finally {
      if(loadingToastId) toast.dismiss(loadingToastId);
      setIsUploadingAvatar(false);
      if (fileInputRef.current) { // Clear file input regardless of success/failure
        fileInputRef.current.value = "";
      }
    }
  };


  if (isLoadingAuth || (!authUser && !userProfile && typeof window !== 'undefined' && !isLoadingAuth)) {
    return (
      <div className="flex min-h-[calc(100vh-200px)] items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }
  
  if (authUser && !userProfile && !isLoadingAuth) {
     return (
      <div className="flex min-h-[calc(100vh-200px)] items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-2">Loading profile...</p>
      </div>
    );
  }

  if (!authUser || !userProfile) {
      return (
           <div className="flex min-h-[calc(100vh-200px)] items-center justify-center">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="ml-2">Redirecting...</p>
            </div>
      );
  }

  const userDisplay = {
    name: userProfile.name || "Valued Customer",
    email: userProfile.email,
    // Use localAvatarPreviewUrl first for immediate feedback, then context's userProfile.avatar_url, then placeholder
    avatarUrl: localAvatarPreviewUrl || userProfile.avatar_url || `https://placehold.co/100x100.png?text=${(userProfile.name || userProfile.email || 'U').substring(0,1).toUpperCase()}`,
    initials: userProfile.name ? userProfile.name.substring(0,2).toUpperCase() : (userProfile.email?.substring(0,2).toUpperCase() || 'U'),
  };

  const handleLogout = async () => {
    await signOut();
    // router.push('/') is handled by AppContext signOut now.
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <header className="mb-12">
        <h1 className="font-headline text-4xl font-bold text-primary">My Account</h1>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Column: Profile Card and Logout */}
        <div className="md:col-span-1 space-y-6">
          <Card>
            <CardHeader className="items-center text-center">
              <div className="relative group w-24 h-24 mx-auto mb-4">
                <Avatar className="w-24 h-24 ring-2 ring-primary ring-offset-2">
                  <AvatarImage src={userDisplay.avatarUrl} alt={userDisplay.name} data-ai-hint="profile person" />
                  <AvatarFallback>{userDisplay.initials}</AvatarFallback>
                </Avatar>
                <Button
                  variant="outline"
                  size="icon"
                  className="absolute bottom-0 right-0 rounded-full h-8 w-8 bg-background group-hover:opacity-100 opacity-70 transition-opacity"
                  onClick={() => fileInputRef.current?.click()}
                  title="Change Profile Picture"
                  disabled={isUploadingAvatar}
                >
                  {isUploadingAvatar ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
                </Button>
                <Input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/png, image/jpeg, image/gif" 
                    onChange={handleAvatarUpload}
                    disabled={isUploadingAvatar}
                />
              </div>
              <CardTitle className="text-2xl">{userDisplay.name}</CardTitle>
              <CardDescription>{userDisplay.email}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full" disabled>
                <Edit3 className="mr-2 h-4 w-4" /> Edit Profile Details (Soon)
              </Button>
               <p className="text-xs text-muted-foreground text-center pt-1">
                Avatar upload requires backend API at /api/profile (PUT) to be implemented for persistence.
              </p>
            </CardContent>
          </Card>
           <Button variant="destructive" className="w-full" onClick={handleLogout} disabled={isLoadingAuth || isUploadingAvatar}>
             {(isLoadingAuth || isUploadingAvatar) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <LogOut className="mr-2 h-4 w-4" /> Log Out
          </Button>
        </div>

        {/* Right Column: Personal Info and Account Options */}
        <div className="md:col-span-2 space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Manage your personal details. (Editing disabled for now)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" defaultValue={userDisplay.name} disabled />
              </div>
              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input id="email" type="email" defaultValue={userDisplay.email} disabled />
              </div>
              <div>
                <Label htmlFor="phone">Phone Number (Optional)</Label>
                <Input id="phone" type="tel" placeholder="+1 (555) 000-0000" disabled />
              </div>
               <Button disabled>Save Changes (Soon)</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Account Options</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              {[
                { label: "Order History", icon: ShoppingBasket, href: "/account/orders" },
                { label: "Saved Addresses", icon: MapPin, href: "#", disabled: true },
                { label: "Payment Methods", icon: CreditCard, href: "#", disabled: true },
                { label: "Notification Preferences", icon: Bell, href: "/settings" },
                { label: "My Wishlist", icon: Heart, href: "#", action: () => console.log("Open Wishlist Sidebar via context (Not Implemented as page)"), disabled: true },
                { label: "Security & Password", icon: ShieldCheck, href: "#", disabled: true },
                { label: "Help & Support", icon: MessageSquareQuote, href: "/help" },
              ].map(item => (
                <React.Fragment key={item.label}>
                  <Link
                    href={item.disabled ? "#" : item.href}
                    className={`flex items-center justify-between p-3 rounded-md transition-colors ${item.disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-secondary'}`}
                    onClick={(e) => { 
                        if (item.disabled) e.preventDefault();
                        else if (item.action) item.action();
                    }}
                    aria-disabled={item.disabled}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className="h-5 w-5 text-primary" />
                      <span>{item.label} {item.disabled ? "(Soon)" : ""}</span>
                    </div>
                    <Edit3 className="h-4 w-4 text-muted-foreground" /> {/* Replaced ChevronRight with Edit3 for a more "manage" feel */}
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
    

    