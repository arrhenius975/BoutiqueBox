// src/app/settings/page.tsx
"use client";

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bell, Palette, ShieldAlert, Trash2, Languages, Sun, Moon, Laptop, KeyRound, Save, Loader2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useAppContext } from '@/contexts/AppContext';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export default function SettingsPage() {
  const { theme, setTheme, signOut, authUser } = useAppContext();
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);

  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const [notifications, setNotifications] = React.useState({
    email: true,
    push: false,
    sms: false,
  });
  const [language, setLanguage] = React.useState("en");

  const handleNotificationChange = (type: keyof typeof notifications, value: boolean) => {
    setNotifications(prev => ({ ...prev, [type]: value }));
    toast({ title: "Notification settings are local for now."});
  };

  const handleDeleteAccount = async () => {
    if (!authUser) {
        toast({ title: "Error", description: "You must be logged in to delete your account.", variant: "destructive"});
        return;
    }
    setIsDeleting(true);
    const loadingToastId = toast({ title: "Deleting account data...", description: "Please wait.", duration: Infinity }).id;

    try {
        const response = await fetch('/api/account/delete', {
            method: 'DELETE',
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: "Server error during account deletion." }));
            throw new Error(errorData.error || "Failed to delete account data.");
        }

        toast({ title: "Account Data Removed", description: "Your personal data has been removed. You are now being logged out." });
        await signOut(); 
    } catch (error) {
        console.error("Account deletion error:", error);
        toast({ title: "Deletion Failed", description: (error as Error).message, variant: "destructive" });
    } finally {
        if(loadingToastId) toast.dismiss(loadingToastId);
        setIsDeleting(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authUser) {
      toast({ title: "Authentication Error", description: "Please log in to change your password.", variant: "destructive" });
      return;
    }
    if (newPassword !== confirmNewPassword) {
      toast({ title: "Passwords Do Not Match", description: "Please ensure your new password and confirmation match.", variant: "destructive" });
      return;
    }
    if (newPassword.length < 6) {
      toast({ title: "Password Too Short", description: "New password must be at least 6 characters long.", variant: "destructive" });
      return;
    }

    setIsChangingPassword(true);
    const loadingToastId = toast({ title: "Changing password...", description: "Please wait.", duration: Infinity }).id;

    try {
      const response = await fetch('/api/account/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to change password.");
      }

      toast({ title: "Password Changed!", description: "Your password has been successfully updated." });
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (error) {
      console.error("Change password error:", error);
      toast({ title: "Password Change Failed", description: (error as Error).message, variant: "destructive" });
    } finally {
      if(loadingToastId) toast.dismiss(loadingToastId);
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <header className="mb-12">
        <h1 className="font-headline text-4xl font-bold text-primary">Settings</h1>
      </header>

      <div className="max-w-3xl mx-auto space-y-10">
        {/* Appearance Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Palette className="h-5 w-5" /> Appearance</CardTitle>
            <CardDescription>Customize the look and feel of the application.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <Label htmlFor="theme-select" className="flex items-center gap-2">
                {theme === 'light' ? <Sun className="h-5 w-5" /> : theme === 'dark' ? <Moon className="h-5 w-5" /> : <Laptop className="h-5 w-5" />}
                Theme
              </Label>
              <Select 
                value={theme} 
                onValueChange={(newThemeValue) => setTheme(newThemeValue as 'light' | 'dark' | 'system')}
              >
                <SelectTrigger id="theme-select" className="w-[180px]">
                  <SelectValue placeholder="Select theme" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="dark">Dark</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                </SelectContent>
              </Select>
            </div>
             <Separator />
            <div className="flex items-center justify-between">
              <Label htmlFor="language-select" className="flex items-center gap-2"><Languages className="h-5 w-5" /> Language</Label>
              <Select value={language} onValueChange={setLanguage} disabled>
                <SelectTrigger id="language-select" className="w-[180px]">
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="es" disabled>Español (Soon)</SelectItem>
                  <SelectItem value="fr" disabled>Français (Soon)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Bell className="h-5 w-5" /> Notifications</CardTitle>
            <CardDescription>Manage how you receive notifications. (Currently local only)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="email-notifications">Email Notifications</Label>
              <Switch
                id="email-notifications"
                checked={notifications.email}
                onCheckedChange={(value) => handleNotificationChange('email', value)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="push-notifications">Push Notifications</Label>
              <Switch
                id="push-notifications"
                checked={notifications.push}
                onCheckedChange={(value) => handleNotificationChange('push', value)}
                disabled 
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="sms-notifications">SMS Notifications</Label>
              <Switch
                id="sms-notifications"
                checked={notifications.sms}
                onCheckedChange={(value) => handleNotificationChange('sms', value)}
                disabled 
              />
            </div>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><ShieldAlert className="h-5 w-5" /> Security</CardTitle>
            <CardDescription>Manage your account security settings.</CardDescription>
          </CardHeader>
          <form onSubmit={handleChangePassword}>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="new-password">New Password</Label>
                <Input 
                  id="new-password" 
                  type="password" 
                  placeholder="•••••••• (min. 6 characters)"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={isChangingPassword || !authUser}
                  minLength={6}
                  required
                />
              </div>
              <div>
                <Label htmlFor="confirm-new-password">Confirm New Password</Label>
                <Input 
                  id="confirm-new-password" 
                  type="password" 
                  placeholder="••••••••"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  disabled={isChangingPassword || !authUser}
                  minLength={6}
                  required
                />
              </div>
               <Button type="submit" disabled={isChangingPassword || !authUser || !newPassword || !confirmNewPassword}>
                {isChangingPassword && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <KeyRound className="mr-2 h-4 w-4" /> Change Password
              </Button>
              <Separator className="my-4" />
              <Button variant="outline" className="w-full justify-start gap-2" disabled>
                Two-Factor Authentication (Soon)
              </Button>
              <Button variant="outline" className="w-full justify-start gap-2" disabled>
                Manage Data Sharing (Soon)
            </Button>
            </CardContent>
          </form>
        </Card>
        
        {/* Account Deletion */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Trash2 className="h-5 w-5 text-destructive" /> Account Data Deletion</CardTitle>
            <CardDescription>Permanently remove your personal data from our records. Your authentication account will remain for system integrity but will be disassociated from your data.</CardDescription>
          </CardHeader>
          <CardContent>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="w-full" disabled={isDeleting || !authUser}>
                  {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Delete My Account Data
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action will permanently delete your personal data (name, avatar, etc.) from our `users` table and remove your avatar image from storage. 
                    Your order history and reviews might be anonymized or disassociated. 
                    Your core authentication entry will remain but will no longer be linked to any personal data within this application.
                    This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeleteAccount} disabled={isDeleting} className="bg-destructive hover:bg-destructive/90">
                    {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Yes, delete my data
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <p className="text-xs text-muted-foreground mt-2">
              This action is irreversible. Please be sure before proceeding. 
              To fully delete your authentication account, please contact support after this step.
            </p>
          </CardContent>
        </Card>

        <div className="text-center mt-8">
          <Button disabled title="Functionality for saving general app settings (like notifications or language) will be added later.">
            Save All Settings (Soon)
          </Button>
        </div>
      </div>
    </div>
  );
}
