"use client";

import { useRouter } from 'next/navigation';
import { presetCharacters } from '@/lib/characters';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { useAppContext } from '@/context/AppContext';
import type { UmaCharacter } from '@/lib/types';
import { Badge } from '@/components/ui/badge';

export default function Home() {
  const router = useRouter();
  const { setSelectedCharacter } = useAppContext();

  const handleTrain = (character: UmaCharacter) => {
    setSelectedCharacter(character);
    router.push(`/training/${character.id}`);
  };

  return (
    <main className="flex-1 p-4 sm:p-6">
      <div className="flex items-center mb-6">
        <h1 className="text-4xl font-headline font-bold tracking-tight">Select a Character</h1>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {presetCharacters.map((character) => (
          <Card key={character.id} className="flex flex-col overflow-hidden shadow-lg hover:shadow-primary/20 transition-shadow duration-300">
            <CardHeader className="p-0">
              <div className="relative w-full h-60 bg-muted flex items-center justify-center">
                <span className="font-headline text-2xl text-muted-foreground">{character.name}</span>
              </div>
            </CardHeader>
            <CardContent className="flex-grow p-4">
              <CardTitle className="font-headline text-2xl mb-2">{character.name}</CardTitle>
              <Badge variant="secondary" className="mb-4">{character.style} Runner</Badge>
              <CardDescription>{character.description}</CardDescription>
            </CardContent>
            <CardFooter className="p-4 bg-muted/50">
              <Button onClick={() => handleTrain(character)} className="w-full">
                Train {character.name}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </main>
  );
}
