// src/app/account/page.tsx
"use client";

import React, { useEffect, useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Edit3, MapPin, ShieldCheck, CreditCard, LogOut, ShoppingBasket, Bell, Heart, MessageSquareQuote, Loader2, UploadCloud, Save, KeyRound } from "lucide-react"; // Added Save, KeyRound
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

  const [editableName, setEditableName] = useState('');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  useEffect(() => {
    if (!isLoadingAuth && !authUser) {
      router.push('/signin');
    }
  }, [authUser, isLoadingAuth, router]);

  useEffect(() => {
    if (userProfile) {
      setEditableName(userProfile.name || '');
      setLocalAvatarPreviewUrl(userProfile.avatar_url || null);
    }
  }, [userProfile]);


  const handleAvatarFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0) {
      return;
    }
    const file = event.target.files[0];
    const reader = new FileReader();
    reader.onloadend = () => {
      setLocalAvatarPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleProfileUpdate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!authUser || !userProfile) {
      toast({ title: "Authentication Error", description: "You must be logged in.", variant: "destructive" });
      return;
    }

    setIsUpdatingProfile(true);
    const loadingToastId = toast({ title: "Updating profile...", description: "Please wait.", duration: Infinity }).id;

    const formData = new FormData();
    formData.append('name', editableName);

    const avatarFile = fileInputRef.current?.files?.[0];
    if (avatarFile) {
        if (avatarFile.size > 2 * 1024 * 1024) { 
            toast({ title: "Avatar Too Large", description: "Please select an image smaller than 2MB.", variant: "destructive" });
            if (fileInputRef.current) fileInputRef.current.value = "";
            setLocalAvatarPreviewUrl(userProfile.avatar_url || null); // Revert preview if too large
            setIsUpdatingProfile(false);
            if(loadingToastId) toast.dismiss(loadingToastId);
            return;
        }
        formData.append('avatar', avatarFile);
    }

    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Server error during profile update."}));
        throw new Error(errorData.error || 'Profile update failed.');
      }

      const result = await response.json();

      if (result.success) {
        const updatedFields: Partial<typeof userProfile> = { name: result.name || editableName };
        if (result.avatarUrl) {
            updatedFields.avatar_url = result.avatarUrl;
            setLocalAvatarPreviewUrl(result.avatarUrl); 
        }
        
        if (setUserProfile && userProfile) {
            setUserProfile(prev => prev ? { ...prev, ...updatedFields } : null);
        }
        toast({ title: 'Profile Updated!', description: 'Your profile has been successfully updated.' });
      } else {
        throw new Error(result.error || 'Failed to update profile due to an API issue.');
      }

    } catch (error) {
      console.error('Profile Update Error:', error);
      toast({ title: 'Profile Update Failed', description: (error as Error).message, variant: 'destructive' });
      // Revert local name and avatar preview if API call fails
      setEditableName(userProfile.name || '');
      setLocalAvatarPreviewUrl(userProfile.avatar_url || null);
    } finally {
      if(loadingToastId) toast.dismiss(loadingToastId);
      setIsUpdatingProfile(false);
      if (fileInputRef.current) { 
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
    avatarUrl: localAvatarPreviewUrl || userProfile.avatar_url || `https://placehold.co/100x100.png?text=${(userProfile.name || userProfile.email || 'U').substring(0,1).toUpperCase()}`,
    initials: userProfile.name ? userProfile.name.substring(0,2).toUpperCase() : (userProfile.email?.substring(0,2).toUpperCase() || 'U'),
  };

  const handleLogout = async () => {
    await signOut();
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
                  <AvatarImage src={userDisplay.avatarUrl} alt={userDisplay.name} data-ai-hint="profile person" />
                  <AvatarFallback>{userDisplay.initials}</AvatarFallback>
                </Avatar>
                <Button
                  variant="outline"
                  size="icon"
                  className="absolute bottom-0 right-0 rounded-full h-8 w-8 bg-background group-hover:opacity-100 opacity-70 transition-opacity"
                  onClick={() => fileInputRef.current?.click()}
                  title="Change Profile Picture"
                  disabled={isUpdatingProfile} 
                >
                  {isUploadingAvatar ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
                </Button>
                <Input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/png, image/jpeg, image/gif" 
                    onChange={handleAvatarFileChange}
                    disabled={isUpdatingProfile}
                />
              </div>
              <CardTitle className="text-2xl">{userProfile.name || "Valued Customer"}</CardTitle>
              <CardDescription>{userProfile.email}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
               <p className="text-xs text-muted-foreground text-center pt-1">
                Avatar changes apply upon saving personal information.
              </p>
            </CardContent>
          </Card>
           <Button variant="destructive" className="w-full" onClick={handleLogout} disabled={isLoadingAuth || isUpdatingProfile}>
             {(isLoadingAuth || isUpdatingProfile) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <LogOut className="mr-2 h-4 w-4" /> Log Out
          </Button>
        </div>

        <form onSubmit={handleProfileUpdate} className="md:col-span-2 space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Manage your personal details.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">Full Name</Label>
                <Input 
                    id="name" 
                    value={editableName} 
                    onChange={(e) => setEditableName(e.target.value)} 
                    disabled={isUpdatingProfile} 
                />
              </div>
              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input id="email" type="email" defaultValue={userDisplay.email} disabled />
              </div>
              <div>
                <Label htmlFor="phone">Phone Number (Optional)</Label>
                <Input id="phone" type="tel" placeholder="+1 (555) 000-0000" disabled />
                 <p className="text-xs text-muted-foreground mt-1">Phone number update coming soon.</p>
              </div>
               <Button type="submit" disabled={isUpdatingProfile || (editableName === (userProfile.name || '') && !fileInputRef.current?.files?.[0])}>
                 {isUpdatingProfile && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                 <Save className="mr-2 h-4 w-4" /> Save Personal Info
                </Button>
            </CardContent>
          </Card>
        </form>

        <div className="md:col-span-2 space-y-8 mt-[-2rem] md:mt-0">
          <Card>
            <CardHeader>
              <CardTitle>Account Options</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              {[
                { label: "Order History", icon: ShoppingBasket, href: "/account/orders" },
                { label: "Change Password", icon: KeyRound, href: "/settings" }, // Direct to settings for password change
                { label: "Saved Addresses", icon: MapPin, href: "#", disabled: true },
                { label: "Payment Methods", icon: CreditCard, href: "#", disabled: true },
                { label: "Notification Preferences", icon: Bell, href: "/settings" },
                { label: "My Wishlist", icon: Heart, href: "#", action: () => console.log("Open Wishlist Sidebar via context (Not Implemented as page)"), disabled: true },
                { label: "Security & Privacy", icon: ShieldCheck, href: "/settings" }, // General security to settings
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
