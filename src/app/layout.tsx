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
            <div className="flex min-h-screen w-full bg-background">
              <Sidebar>
                <SidebarHeader>
                  <Link href="/" className="flex items-center gap-2">
                    <span className="text-2xl font-headline font-bold text-primary">Mini Uma Stable</span>
                  </Link>
                </SidebarHeader>
                <SidebarContent>
                  <SidebarMenu>
                    <SidebarMenuItem>
                      <SidebarMenuButton tooltip="Character Selection" asChild>
                        <Link href="/">
                          <Users />
                          <span>Characters</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton tooltip="Create New Uma" asChild>
                        <Link href="/create">
                          <PlusSquare />
                          <span>Create Uma</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton tooltip="Race History" asChild>
                        <Link href="/history">
                          <History />
                          <span>Race History</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  </SidebarMenu>
                </SidebarContent>
              </Sidebar>
              <div className="flex flex-1 flex-col">
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
