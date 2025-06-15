// src/app/admin/settings/page.tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Settings, Construction } from "lucide-react";

export default function AdminSettingsPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Admin Settings</h1>
        <p className="text-muted-foreground">Configure application-wide settings for BoutiqueBox.</p>
      </header>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Construction className="h-6 w-6 text-primary" />
            More Settings Coming Soon!
          </CardTitle>
          <CardDescription>
            This section is currently under development. Advanced administrative settings will be available here in a future update.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            For now, please manage users, products, categories, and orders through their respective sections in the admin panel.
            Any critical application configurations can be managed directly via your Supabase project settings.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
