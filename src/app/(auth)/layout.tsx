
// src/app/(auth)/layout.tsx
import { ThemeManager } from '@/components/ThemeManager';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <ThemeManager themeClass="" /> {/* Use default theme for auth pages */}
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        {children}
      </div>
    </>
  );
}

    