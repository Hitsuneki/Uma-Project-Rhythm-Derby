import type { Metadata } from 'next';
import Link from 'next/link';
import { Home, PlusSquare, History, Users } from 'lucide-react';
import { AppProvider } from '@/context/AppContext';
import { SidebarProvider, Sidebar, SidebarInset, SidebarHeader, SidebarContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar';
import MobileHeader from '@/components/MobileHeader';
import { Toaster } from "@/components/ui/toaster"
import './globals.css';

export const metadata: Metadata = {
  title: 'Mini Uma Stable',
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
          <SidebarProvider>
            <div className="flex min-h-screen w-full flex-col bg-background">
              <Sidebar>
                <SidebarHeader>
                  <Link href="/" className="flex items-center gap-2">
                    <span className="text-2xl font-headline font-bold text-primary">Mini Uma Stable</span>
                  </Link>
                </SidebarHeader>
                <SidebarContent>
                  <SidebarMenu>
                    <SidebarMenuItem>
                      <Link href="/">
                        <SidebarMenuButton tooltip="Character Selection">
                          <Users />
                          <span>Characters</span>
                        </SidebarMenuButton>
                      </Link>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <Link href="/create">
                        <SidebarMenuButton tooltip="Create New Uma">
                          <PlusSquare />
                          <span>Create Uma</span>
                        </SidebarMenuButton>
                      </Link>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <Link href="/history">
                        <SidebarMenuButton tooltip="Race History">
                          <History />
                          <span>Race History</span>
                        </SidebarMenuButton>
                      </Link>
                    </SidebarMenuItem>
                  </SidebarMenu>
                </SidebarContent>
              </Sidebar>
              <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-14">
                <MobileHeader />
                <SidebarInset>
                  {children}
                </SidebarInset>
              </div>
            </div>
          </SidebarProvider>
          <Toaster />
        </AppProvider>
      </body>
    </html>
  );
}
