
import type {Metadata} from 'next';
import './globals.css';
import { ClientProviders } from '@/contexts/ClientProviders'; // Import the new wrapper
// AppProvider and Toaster are now handled by ClientProviders

export const metadata: Metadata = {
  title: 'BoutiqueBox - Your Multi-Store App',
  description: 'Explore groceries, cosmetics, and fast food all in one place!',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        <ClientProviders> {/* Use the client component wrapper */}
          {children}
        </ClientProviders>
      </body>
    </html>
  );
}
