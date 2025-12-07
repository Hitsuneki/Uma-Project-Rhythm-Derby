"use client"

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Users, PlusSquare, Dumbbell, Flag, History } from 'lucide-react';

const navLinks = [
    { href: '/', label: 'Characters', icon: Users },
    { href: '/create', label: 'Create Uma', icon: PlusSquare },
    { href: '/training', label: 'Training', icon: Dumbbell },
    { href: '/race', label: 'Race', icon: Flag },
    { href: '/history', label: 'Race History', icon: History },
];

export default function Header() {
    const pathname = usePathname();

    const isTrainingPage = pathname.startsWith('/training/');

    return (
        <header className="sticky top-0 z-30 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-16 items-center justify-between">
                <Link href="/" className="flex items-center gap-2">
                    <span className="text-xl font-headline font-bold text-primary sm:text-2xl">Uma Project: Rhythm Derby</span>
                </Link>

                <nav className="hidden items-center gap-4 sm:flex">
                    {navLinks.map(({ href, label, icon: Icon }) => {
                        const isActive = href === '/' ? pathname === href : pathname.startsWith(href);
                        const isCurrentTraining = href === '/training' && isTrainingPage;

                        return (
                            <Button
                                key={href}
                                variant="ghost"
                                asChild
                                className={cn(
                                    'text-muted-foreground transition-colors hover:text-foreground',
                                    (isActive || isCurrentTraining) && 'text-foreground'
                                )}
                            >
                                <Link href={href} className="flex items-center gap-2">
                                    <Icon className="h-4 w-4" />
                                    {label}
                                </Link>
                            </Button>
                        );
                    })}
                </nav>
                {/* Mobile Nav Trigger can be added here */}
            </div>
        </header>
    );
}
