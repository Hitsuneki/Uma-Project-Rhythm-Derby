import type { Metadata } from 'next';
import Link from 'next/link';
import { AppProvider } from '@/context/AppContext';
import { Toaster } from "@/components/ui/toaster"
import Header from '@/components/Header';
import './globals.css';

export const metadata: Metadata = {
  title: 'Uma Project: Rhythm Derby',
  description: 'Train your own Uma and race to victory!',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Belleza&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        <AppProvider>
          <div className="flex min-h-screen w-full flex-col bg-background">
            <header className="sticky top-0 z-30 w-full">
              <div className="container flex h-16 items-center justify-between">
                <Link href="/" className="flex items-center gap-2">
                    <span className="text-xl font-headline font-bold text-primary sm:text-2xl">Uma Project: Rhythm Derby</span>
                </Link>
              </div>
              <Header />
            </header>
            <main className="flex flex-1 flex-col items-center p-4 sm:p-6">
              <div className="w-full max-w-7xl">
                {children}
              </div>
            </main>
          </div>
          <Toaster />
        </AppProvider>
      </body>
    </html>
  );
}
