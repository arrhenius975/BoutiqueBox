
// src/app/not-authorized/layout.tsx
import { ThemeManager } from '@/components/ThemeManager';

export default function NotAuthorizedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <ThemeManager themeClass="" /> {/* Use default theme */}
      {children}
    </>
  );
}
