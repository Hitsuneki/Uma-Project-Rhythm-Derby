"use client"

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Users, PlusSquare, Dumbbell, Flag, History } from 'lucide-react';
import { useAppContext } from '@/context/AppContext';

export default function Header() {
    const pathname = usePathname();
    const { selectedCharacter, characters } = useAppContext();

    // Determine the correct training link
    const trainingCharacterId = selectedCharacter?.id || (characters.length > 0 ? characters[0].id : null);
    const trainingLink = trainingCharacterId ? `/training/${trainingCharacterId}` : '/';


    const navLinks = [
        { href: '/', label: 'Characters', icon: Users },
        { href: '/create', label: 'Create Uma', icon: PlusSquare },
        { href: trainingLink, label: 'Training', icon: Dumbbell },
        { href: '/race', label: 'Race', icon: Flag },
        { href: '/history', label: 'Race History', icon: History },
    ];

    const isTrainingPage = pathname.startsWith('/training/');

    return (
        <nav className="flex w-full items-center justify-center border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-14 items-center justify-center gap-4">
                {navLinks.map(({ href, label, icon: Icon }) => {
                    // Special handling for training link active state
                    const isActive = (href === '/training' && isTrainingPage) || (pathname === href && href !== '/');
                    if (href === '/' && pathname !== '/') {
                        // Don't mark home active if we are on other pages
                    }

                    let finalIsActive = (href === '/' && pathname === '/') || (href !== '/' && pathname.startsWith(href));
                    if(label === 'Training') {
                        finalIsActive = isTrainingPage;
                    }


                    return (
                        <Button
                            key={label}
                            variant="ghost"
                            asChild
                            className={cn(
                                'text-muted-foreground transition-colors hover:text-foreground',
                                finalIsActive && 'text-foreground'
                            )}
                        >
                            <Link href={href} className="flex items-center gap-2">
                                <Icon className="h-4 w-4" />
                                {label}
                            </Link>
                        </Button>
                    );
                })}
            </div>
        </nav>
    );
}
