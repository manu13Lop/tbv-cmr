import type { Metadata, Viewport } from 'next';
import { Suspense } from 'react';
import './globals.css';
import { ThemeProvider } from '@/components/providers/theme-provider';
import { Sidebar } from '@/components/sidebar';
import { Breadcrumb } from '@/components/breadcrumb';
import { Toaster } from 'sonner';
import { ToastHandler } from '@/components/toast-handler';
import { SidebarSkeleton } from '@/components/skeletons';

export const metadata: Metadata = {
  title: 'TBV - Triana Balonmano Vivero',
  description: 'Plataforma de gestión del club',
  icons: {
    icon: '/logo.jpg',
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'TBV',
  },
};

export const viewport: Viewport = {
  themeColor: '#9b1b30',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </head>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <a
            href="#main-content"
            className="focus:bg-primary focus:text-primary-foreground sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:px-4 focus:py-2"
          >
            Saltar al contenido principal
          </a>
          <div className="flex">
            <Suspense fallback={<SidebarSkeleton />}>
              <Sidebar />
            </Suspense>
            <main id="main-content" className="flex-1">
              <Suspense fallback={<div className="h-8" />}>
                <Breadcrumb />
              </Suspense>
              {children}
            </main>
          </div>
          <Toaster richColors position="top-right" />
          <Suspense fallback={<div className="h-10" />}>
            <ToastHandler />
          </Suspense>
        </ThemeProvider>
      </body>
    </html>
  );
}
