
// src/app/(app-user)/profile/page.tsx
"use client";

import React, { useEffect, useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Edit3, MapPin, ShieldCheck, CreditCard, ShoppingBasket, Bell, Heart, MessageSquareQuote, Loader2, UploadCloud, Save, KeyRound } from "lucide-react";
// LogOut icon is handled by UserSidebar
import Link from "next/link"; // Keep Link for internal panel navigation if needed
import { useAppContext } from '@/contexts/AppContext';
import { useRouter } from 'next/navigation'; // Keep for any programmatic navigation
import { useToast } from '@/hooks/use-toast';

export default function ProfilePage() {
  const { authUser, userProfile, isLoadingAuth, setUserProfile, toggleWishlist } = useAppContext();
  const router = useRouter(); // Can still be used if needed
  const { toast } = useToast();

  const [localAvatarPreviewUrl, setLocalAvatarPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [editableName, setEditableName] = useState('');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  // Auth checks are primarily handled by the layout, but an extra check here is fine.
  useEffect(() => {
    if (!isLoadingAuth && !authUser) {
      router.push('/signin?redirect=/profile'); // Redirect if somehow accessed without auth
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
            setLocalAvatarPreviewUrl(userProfile.avatar_url || null);
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

  // Loaders are handled by the layout
  if (!authUser || !userProfile) {
      return null; // Layout handles loading/redirect
  }

  const userDisplay = {
    name: userProfile.name || "Valued Customer",
    email: userProfile.email,
    avatarUrl: localAvatarPreviewUrl || userProfile.avatar_url || `https://placehold.co/100x100.png?text=${(userProfile.name || userProfile.email || 'U').substring(0,1).toUpperCase()}`,
    initials: userProfile.name ? userProfile.name.substring(0,2).toUpperCase() : (userProfile.email?.substring(0,2).toUpperCase() || 'U'),
  };

  return (
    <div className="space-y-8">
      <header className="mb-8">
        <h1 className="font-headline text-3xl md:text-4xl font-bold text-primary">My Profile</h1>
        <p className="text-muted-foreground">Manage your personal information and preferences.</p>
      </header>

      {/* Profile Editing Card - takes up main space */}
      <Card className="w-full max-w-2xl mx-auto">
        <form onSubmit={handleProfileUpdate}>
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
                    type="button" // Prevent form submission
                    >
                    {isUpdatingProfile && fileInputRef.current?.files?.[0] ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
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
                 <p className="text-xs text-muted-foreground pt-1">
                    Avatar changes apply upon saving.
                </p>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
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
            <Button type="submit" className="w-full sm:w-auto" disabled={isUpdatingProfile || (editableName === (userProfile.name || '') && !fileInputRef.current?.files?.[0])}>
                {isUpdatingProfile && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Save className="mr-2 h-4 w-4" /> Save Changes
            </Button>
            </CardContent>
        </form>
      </Card>

      {/* Placeholder for other profile-related info or quick links if needed */}
       <Card>
        <CardHeader>
            <CardTitle>Quick Access</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {userProfile.role !== 'admin' && (
              <Button variant="outline" asChild className="justify-start">
                  <Link href="/orders"><ShoppingBasket className="mr-2 h-4 w-4"/> View Order History</Link>
              </Button>
            )}
             <Button variant="outline" onClick={toggleWishlist} className="justify-start">
                <Heart className="mr-2 h-4 w-4"/> Manage Wishlist
            </Button>
            <Button variant="outline" asChild className="justify-start">
                <Link href="/user-settings"><KeyRound className="mr-2 h-4 w-4"/> Change Password</Link>
            </Button>
            <Button variant="outline" asChild className="justify-start">
                <Link href="/help"><MessageSquareQuote className="mr-2 h-4 w-4"/> Help & Support</Link>
            </Button>
        </CardContent>
       </Card>
    </div>
  );
}
