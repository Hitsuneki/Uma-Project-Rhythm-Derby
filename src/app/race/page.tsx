"use client"

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useAppContext } from '@/context/AppContext'
import type { UmaCharacter, RaceResult } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { v4 as uuidv4 } from "uuid"
import { cn } from '@/lib/utils'

type RaceState = 'setup' | 'racing' | 'finished'
type RaceDistance = 'short' | 'mid' | 'long'

// --- New Lane Pulse Racing constants ---
const RACE_LENGTH = 1000; // arbitrary units for track length
const MAX_RACE_TIME = 30 * 1000; // 30 seconds
const BEAT_INTERVAL = 500; // ms per beat
const TIMING_WINDOW = 80; // ms on either side of beat
const MAX_CHARGE = 3;
const BURST_DURATION = 1000; // ms
const LANE_COUNT = 3;

export default function RacePage() {
    const router = useRouter()
    const { trainedCharacter, addRaceToHistory, setTrainedCharacter, characters } = useAppContext()

    const [raceState, setRaceState] = useState<RaceState>('setup')
    const [distance, setDistance] = useState<RaceDistance>('mid')
    const [finalResult, setFinalResult] = useState<RaceResult | null>(null)

    // --- Game State Refs ---
    const gameLoopRef = useRef<number>(0);
    const lastTickRef = useRef<number>(0);
    const elapsedTimeRef = useRef<number>(0);

    // --- Player State ---
    const [charge, setCharge] = useState(0);
    const [isBursting, setIsBursting] = useState(false);
    const burstTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const [currentLane, setCurrentLane] = useState(1);
    const [position, setPosition] = useState(0);

    // --- Beat and Timing State ---
    const [beatTime, setBeatTime] = useState(0);
    const beatTimerRef = useRef<NodeJS.Timeout | null>(null);
    const [showHitMarker, setShowHitMarker] = useState(false);

    useEffect(() => {
        if (!trainedCharacter && characters.length > 0) {
            const firstChar = characters.find(c => c.level > 0) || characters[0];
            setTrainedCharacter({
                character: firstChar,
                trainedStats: firstChar.baseStats
            });
        }
        return () => { // Cleanup timers on component unmount
            if (beatTimerRef.current) clearInterval(beatTimerRef.current);
            if (burstTimeoutRef.current) clearTimeout(burstTimeoutRef.current);
            if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
        }
    }, [trainedCharacter, characters, setTrainedCharacter]);


    const resetRaceState = () => {
        setPosition(0);
        setCurrentLane(1);
        setCharge(0);
        setIsBursting(false);
        setBeatTime(0);
        elapsedTimeRef.current = 0;
        if (beatTimerRef.current) clearInterval(beatTimerRef.current);
        if (burstTimeoutRef.current) clearTimeout(burstTimeoutRef.current);
        if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
    }

    const startRace = () => {
        resetRaceState();
        setRaceState('racing');

        // Start the beat timer
        beatTimerRef.current = setInterval(() => {
            setBeatTime(Date.now());
        }, BEAT_INTERVAL);
        
        // Start the game loop
        lastTickRef.current = performance.now();
        gameLoopRef.current = requestAnimationFrame(gameLoop);
    };

    const gameLoop = useCallback((timestamp: number) => {
        if (raceState !== 'racing' || !trainedCharacter) return;
        
        const delta = timestamp - lastTickRef.current;
        lastTickRef.current = timestamp;
        elapsedTimeRef.current += delta;

        let currentSpeed = trainedCharacter.character.baseStats.speed / 10; // Base speed
        if (isBursting) {
            currentSpeed *= 2; // Burst bonus
        }
        
        // Use a function for state update to ensure we have the latest position
        let raceFinished = false;
        setPosition(prevPosition => {
            const newPosition = prevPosition + currentSpeed * (delta / 1000);
            if (newPosition >= RACE_LENGTH || elapsedTimeRef.current >= MAX_RACE_TIME) {
                raceFinished = true;
                return RACE_LENGTH;
            }
            return newPosition;
        });

        if (raceFinished) {
            finishRace();
        } else {
            gameLoopRef.current = requestAnimationFrame(gameLoop);
        }
    }, [trainedCharacter, isBursting, raceState]);


    const finishRace = () => {
        if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
        if (beatTimerRef.current) clearInterval(beatTimerRef.current);
        setRaceState('finished');
        
        // Dummy results for now
        const result: RaceResult = {
            id: uuidv4(),
            umaId: trainedCharacter!.character.id,
            distance,
            phase1_quality: 90, phase2_quality: 85, phase3_quality: 95,
            overall_quality: 90,
            raceScore: 120,
            placement: 1,
            date: new Date().toISOString()
        }
        
        setFinalResult(result)
        addRaceToHistory(result)
    }

    const handlePlayerClick = () => {
        if (raceState !== 'racing' || !trainedCharacter) return;

        const timeSinceBeat = Date.now() - beatTime;
        const effectiveWindow = TIMING_WINDOW + (trainedCharacter.character.baseStats.technique / 2);

        if (timeSinceBeat <= effectiveWindow || (BEAT_INTERVAL - timeSinceBeat) <= effectiveWindow) {
            // ON BEAT
            setShowHitMarker(true);
            setTimeout(() => setShowHitMarker(false), 150);

            if (charge < MAX_CHARGE) {
                setCharge(c => c + 1);
            } else {
                // Trigger burst if already max charge
                setIsBursting(true);
                setCharge(0);
                if (burstTimeoutRef.current) clearTimeout(burstTimeoutRef.current);
                burstTimeoutRef.current = setTimeout(() => setIsBursting(false), BURST_DURATION);
            }
        } else {
            // OFF BEAT -> Lane flip
            setCurrentLane(prev => (prev + 1) % LANE_COUNT);
        }
    };
    
    // Auto-trigger burst when charge reaches max
    useEffect(() => {
        if (charge === MAX_CHARGE) {
             setIsBursting(true);
             setCharge(0);
             if (burstTimeoutRef.current) clearTimeout(burstTimeoutRef.current);
             burstTimeoutRef.current = setTimeout(() => setIsBursting(false), BURST_DURATION);
        }
    }, [charge]);


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

    const renderRacing = () => {
        const timeSinceBeat = Date.now() - beatTime;
        const beatProgress = Math.min(100, (timeSinceBeat / BEAT_INTERVAL) * 100);
        const windowSize = (TIMING_WINDOW * 2 / BEAT_INTERVAL) * 100;

        return (
            <div className="w-full flex flex-col items-center gap-4" onClick={handlePlayerClick}>
                <Card className="w-full">
                    <CardHeader>
                        <CardTitle className='font-headline text-2xl'>Lane Pulse Racing</CardTitle>
                        <CardDescription>Click on the beat to charge, click off-beat to switch lanes.</CardDescription>
                    </CardHeader>
                     <CardContent className="space-y-4">
                        {/* Beat Bar */}
                        <div className="relative w-full h-8 bg-muted rounded-full overflow-hidden">
                           <div className="absolute top-0 h-full bg-primary/30" style={{ left: `calc(100% - ${windowSize / 2}%)`, width: `${windowSize}%`, transform: 'translateX(-100%)' }} />
                           <div className="absolute top-0 h-full bg-primary/30" style={{ left: '0%', width: `${windowSize / 2}%` }} />
                           <div className="absolute h-full w-1 bg-primary" style={{ left: `${beatProgress}%` }} />
                           {showHitMarker && <div className="absolute top-0 h-full w-2 bg-accent" style={{ left: `${beatProgress}%`}} />}
                        </div>

                        {/* Charge Meter */}
                        <div className="flex items-center gap-2">
                            <Label>Charge:</Label>
                            <div className="flex gap-2">
                                {Array.from({ length: MAX_CHARGE }).map((_, i) => (
                                    <div key={i} className={cn("w-6 h-6 rounded-full border-2 border-primary", i < charge ? 'bg-primary' : 'bg-transparent')} />
                                ))}
                            </div>
                            {isBursting && <span className='ml-4 text-primary font-bold animate-pulse'>BURST!</span>}
                        </div>
                     </CardContent>
                </Card>

                {/* Race Track */}
                <div className="relative w-full h-48 bg-muted/50 p-2 rounded-lg space-y-2">
                    {Array.from({ length: LANE_COUNT }).map((_, i) => (
                         <div key={i} className="relative w-full h-1/3 bg-foreground/10 rounded">
                           {/* Player Runner */}
                           {currentLane === i && (
                                <div 
                                    className="absolute top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold transition-all duration-100"
                                    style={{ left: `calc(${(position / RACE_LENGTH) * 100}% - 16px)`}}
                                >
                                    U
                                </div>
                           )}
                         </div>
                    ))}
                </div>
            </div>
        )
    };


    return (
        <div className="w-full">
            {raceState === 'setup' && renderSetup()}
            {raceState === 'racing' && renderRacing()}
            {raceState === 'finished' && finalResult && renderFinished()}
        </div>
    );
}
