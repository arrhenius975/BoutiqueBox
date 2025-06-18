
// src/app/admin/settings/page.tsx
"use client";

import { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Loader2, Save, Info } from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import type { AnnouncementSetting } from '@/types';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";


const DEFAULT_ANNOUNCEMENT_SETTING: AnnouncementSetting = {
  message: '',
  enabled: false,
};

export default function AdminSettingsPage() {
  const { toast } = useToast();
  const [announcement, setAnnouncement] = useState<AnnouncementSetting>(DEFAULT_ANNOUNCEMENT_SETTING);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const fetchSettings = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/settings');
      if (!response.ok) {
        if (response.status === 404) { // Settings not found, use defaults
          setAnnouncement(DEFAULT_ANNOUNCEMENT_SETTING);
          toast({ title: "Settings Initialized", description: "No existing settings found. Using default values." });
          return;
        }
        const errorData = await response.json().catch(() => ({ error: 'Failed to fetch settings' }));
        throw new Error(errorData.error);
      }
      const data = await response.json();
      if (data.announcement_banner) {
        setAnnouncement(data.announcement_banner);
      } else {
        setAnnouncement(DEFAULT_ANNOUNCEMENT_SETTING);
      }
    } catch (error) {
      console.error("Fetch settings error:", error);
      toast({ title: "Error Fetching Settings", description: (error as Error).message, variant: "destructive" });
      setAnnouncement(DEFAULT_ANNOUNCEMENT_SETTING); // Fallback to default
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleSaveSettings = async () => {
    setIsSaving(true);
    const loadingToastId = toast({ title: "Saving settings...", description: "Please wait.", duration: Infinity }).id;
    try {
      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ announcement_banner: announcement }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to save settings' }));
        throw new Error(errorData.error);
      }
      toast({ title: "Settings Saved", description: "Your changes have been saved successfully." });
    } catch (error) {
      console.error("Save settings error:", error);
      toast({ title: "Error Saving Settings", description: (error as Error).message, variant: "destructive" });
    } finally {
      if(loadingToastId) toast.dismiss(loadingToastId);
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-10">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-3 text-muted-foreground">Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Application Settings</h1>
        <p className="text-muted-foreground">Manage global settings for Barak Online Store.</p>
      </header>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>Database Setup Required</AlertTitle>
        <AlertDescription>
          For these settings to persist, ensure you have an `app_settings` table in your Supabase database with columns: `key TEXT PRIMARY KEY`, `value JSONB`, and `updated_at TIMESTAMPTZ DEFAULT NOW()`.
          A row with `key = 'announcement_banner'` will store the announcement settings.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Site-Wide Announcement Banner</CardTitle>
          <CardDescription>
            Configure a banner message that can be displayed at the top of all public-facing pages.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="announcement-message">Announcement Message</Label>
            <Textarea
              id="announcement-message"
              placeholder="E.g., Free shipping on orders over $50 this weekend!"
              value={announcement.message}
              onChange={(e) => setAnnouncement(prev => ({ ...prev, message: e.target.value }))}
              disabled={isSaving}
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              Leave blank to display no message, even if enabled.
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <Switch
              id="enable-announcement"
              checked={announcement.enabled}
              onCheckedChange={(checked) => setAnnouncement(prev => ({ ...prev, enabled: checked }))}
              disabled={isSaving}
            />
            <Label htmlFor="enable-announcement" className="text-sm font-normal">
              Enable Announcement Banner
            </Label>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleSaveSettings} disabled={isSaving || isLoading}>
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save Announcement Settings
          </Button>
        </CardFooter>
      </Card>

      {/* Placeholder for more settings */}
      <Card className="mt-8 opacity-50">
        <CardHeader>
          <CardTitle>More Settings Coming Soon</CardTitle>
          <CardDescription>
            Additional application-wide configurations will be available here in future updates.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Examples could include default shipping rates, tax configurations, or third-party API keys.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
