"use client"

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useAppContext } from '@/context/AppContext'
import type { UmaCharacter, RaceResult, Trait } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { v4 as uuidv4 } from "uuid"

type RaceState = 'setup' | 'racing' | 'finished'
type RaceDistance = 'short' | 'mid' | 'long'

export default function RacePage() {
    const router = useRouter()
    const { trainedCharacter, addRaceToHistory, setTrainedCharacter, characters } = useAppContext()

    const [raceState, setRaceState] = useState<RaceState>('setup')
    const [distance, setDistance] = useState<RaceDistance>('mid')
    
    const [finalResult, setFinalResult] = useState<RaceResult | null>(null)

    useEffect(() => {
        if (!trainedCharacter && characters.length > 0) {
            const firstChar = characters.find(c => c.level > 0) || characters[0];
             setTrainedCharacter({
                character: firstChar,
                trainedStats: firstChar.baseStats
            });
        }
    }, [trainedCharacter, characters, setTrainedCharacter])


    const startRace = useCallback(() => {
        if (!trainedCharacter) return;
        
        const weights = {
            short: { start: 0.5, mid: 0.3, final: 0.2 },
            mid: { start: 0.3, mid: 0.4, final: 0.3 },
            long: { start: 0.2, mid: 0.4, final: 0.4 },
        }

        // Dummy qualities for now
        const phaseQualities = {
            start: Math.random() * 50 + 50,
            mid: Math.random() * 50 + 50,
            final: Math.random() * 50 + 50,
        };

        const distWeights = weights[distance]

        const overallQuality = 
            (phaseQualities.start ?? 0) * distWeights.start +
            (phaseQualities.mid ?? 0) * distWeights.mid +
            (phaseQualities.final ?? 0) * distWeights.final;

        const { speed, stamina, technique } = trainedCharacter.trainedStats;
        const statWeights = {
            short: { speed: 0.5, stamina: 0.2, technique: 0.3 },
            mid: { speed: 0.35, stamina: 0.35, technique: 0.3 },
            long: { speed: 0.25, stamina: 0.45, technique: 0.3 },
        }
        const statW = statWeights[distance]

        let raceScore = (speed * statW.speed) + (stamina * statW.stamina) + (technique * statW.technique) + (overallQuality * 0.2);

        // Trait bonus
        if(trainedCharacter.character.trait.name === 'Strong Finisher' && (phaseQualities.mid ?? 0) > 70) {
            raceScore += 15;
        }

        const getPlacement = (score: number) => {
            if (score > 150) return 1
            if (score > 120) return 2
            if (score > 90) return 3
            return 4
        }
        const placement = getPlacement(raceScore)

        const result: RaceResult = {
            id: uuidv4(),
            umaId: trainedCharacter.character.id,
            distance,
            phase1_quality: Math.round(phaseQualities.start ?? 0),
            phase2_quality: Math.round(phaseQualities.mid ?? 0),
            phase3_quality: Math.round(phaseQualities.final ?? 0),
            overall_quality: Math.round(overallQuality),
            raceScore: Math.round(raceScore),
            placement,
            date: new Date().toISOString()
        }
        
        setFinalResult(result)
        addRaceToHistory(result)
        setRaceState('finished');
    }, [trainedCharacter, distance, addRaceToHistory]);

    if (!trainedCharacter) {
        return (
             <div className="flex items-center justify-center">
                <Card>
                    <CardHeader>
                        <CardTitle>Select a Character</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p>You need to select a character before you can race.</p>
                        <Button onClick={() => router.push('/')} className="mt-4">Go to Character Selection</Button>
                    </CardContent>
                </Card>
            </div>
        )
    }

    const character = trainedCharacter.character;

    const renderSetup = () => (
        <Card className="w-full max-w-lg mx-auto">
            <CardHeader>
                <CardTitle className="text-3xl font-headline">Prepare for the Race</CardTitle>
                <CardDescription>Select the race distance for {character.name}.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div>
                    <Label className="text-lg font-semibold mb-4 block">Race Distance</Label>
                    <RadioGroup defaultValue="mid" onValueChange={(val: RaceDistance) => setDistance(val)}>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="short" id="short" />
                            <Label htmlFor="short" className="text-base">Short (Focus: Speed)</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="mid" id="mid" />
                            <Label htmlFor="mid" className="text-base">Mid-Distance (Focus: Balanced)</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="long" id="long" />
                            <Label htmlFor="long" className="text-base">Long-Distance (Focus: Stamina)</Label>
                        </div>
                    </RadioGroup>
                </div>
                <Button onClick={startRace} className="w-full">Start Race</Button>
            </CardContent>
        </Card>
    );
    
    const renderRacing = () => (
        <div className="text-center">
            <h2 className="text-4xl font-headline animate-pulse">Racing...</h2>
            <p className="text-muted-foreground mt-2">The race is underway!</p>
        </div>
    );

    const placementText = (p: number) => {
        switch(p) {
            case 1: return "1st"
            case 2: return "2nd"
            case 3: return "3rd"
            default: return `${p}th`
        }
    }

    const renderFinished = () => (
        <Card className="w-full max-w-lg mx-auto">
            <CardHeader className="text-center">
                <CardTitle className="text-3xl font-headline mt-4">Race Complete!</CardTitle>
                <CardDescription>A summary of {character.name}'s performance.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-center">
                 <div className="text-6xl font-bold">
                    {finalResult?.placement}
                    <span className="text-2xl text-muted-foreground">/ 4</span>
                </div>
                 <p className="text-xl">
                    Finished in {placementText(finalResult?.placement ?? 4)} place!
                </p>
                <div className="text-lg">
                    Final Race Score: <span className="font-bold text-primary">{finalResult?.raceScore}</span>
                </div>

                <div className="flex justify-center gap-4 pt-4">
                    <Button variant="outline" onClick={() => router.push(`/training/${character.id}`)}>Train Again</Button>
                    <Button onClick={() => router.push('/')}>Select New Character</Button>
                </div>
            </CardContent>
        </Card>
    );


    return (
        <>
            {raceState === 'setup' && renderSetup()}
            {raceState === 'racing' && renderRacing()}
            {raceState === 'finished' && finalResult && renderFinished()}
        </>
    );
}
