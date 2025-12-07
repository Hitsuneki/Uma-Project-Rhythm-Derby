"use client"

import React, { useState, useEffect, useCallback, useRef } from 'react'
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

const RACE_LENGTH = 1000;
const MAX_RACE_TIME = 30 * 1000; // 30 seconds
const BASE_BEAT_INTERVAL = 1200; // ms for one full sweep of the beat bar
const BEAT_WINDOW_SIZE = 0.15; // 15% of the bar is the "on-beat" window
const MAX_CHARGE = 3;
const BURST_DURATION = 1000; // ms
const LANE_COUNT = 3;
const OPPONENT_COUNT = 3;

interface Opponent {
    id: number;
    position: number;
    lane: number;
    speed: number;
}

export default function RacePage() {
    const router = useRouter()
    const { trainedCharacter, addRaceToHistory, setTrainedCharacter, characters } = useAppContext()

    const [raceState, setRaceState] = useState<RaceState>('setup')
    const [distance, setDistance] = useState<RaceDistance>('mid')
    const [finalResult, setFinalResult] = useState<RaceResult | null>(null)

    const gameLoopRef = useRef<number>(0);
    const lastTickRef = useRef<number>(0);
    const elapsedTimeRef = useRef<number>(0);
    const beatCycleStartRef = useRef<number>(0);

    const [charge, setCharge] = useState(0);
    const [isBursting, setIsBursting] = useState(false);
    const burstTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const [currentLane, setCurrentLane] = useState(1);
    const [position, setPosition] = useState(0);
    const [opponents, setOpponents] = useState<Opponent[]>([]);

    const [beatWindow, setBeatWindow] = useState({ start: 0, end: BEAT_WINDOW_SIZE });
    const [beatProgress, setBeatProgress] = useState(0);
    const [showHitMarker, setShowHitMarker] = useState(false);


    const allRunners = [...opponents, {id: 99, position: position, lane: currentLane, speed: 0}].sort((a,b) => b.position - a.position);
    const playerRank = allRunners.findIndex(r => r.id === 99) + 1;

    const randomizeBeatWindow = useCallback(() => {
        const newStart = Math.random() * (1 - BEAT_WINDOW_SIZE);
        setBeatWindow({ start: newStart, end: newStart + BEAT_WINDOW_SIZE });
    }, []);

    useEffect(() => {
        if (!trainedCharacter && characters.length > 0) {
            const firstChar = characters.find(c => c.level > 0) || characters[0];
            setTrainedCharacter({
                character: firstChar,
                trainedStats: firstChar.baseStats
            });
        }

        randomizeBeatWindow(); // Initial position

        return () => {
            if (burstTimeoutRef.current) clearTimeout(burstTimeoutRef.current);
            if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
        }
    }, [trainedCharacter, characters, setTrainedCharacter, randomizeBeatWindow]);

    const resetRaceState = useCallback(() => {
        setPosition(0);
        setCurrentLane(Math.floor(LANE_COUNT / 2));
        setCharge(0);
        setIsBursting(false);
        setBeatProgress(0);
        elapsedTimeRef.current = 0;
        lastTickRef.current = 0;
        beatCycleStartRef.current = 0;
        setFinalResult(null);
        if (burstTimeoutRef.current) clearTimeout(burstTimeoutRef.current);
        if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
        randomizeBeatWindow();
    }, [randomizeBeatWindow]);
    
    const finishRace = useCallback(() => {
        setRaceState('finished');
        if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);

        const finalAllRunners = [...opponents, {id: 99, position, lane: currentLane, speed: 0}].sort((a,b) => b.position - a.position);
        const finalPlacement = finalAllRunners.findIndex(r => r.id === 99) + 1;

        const baseScore = 5000;
        const timeBonus = Math.max(0, Math.round((MAX_RACE_TIME - elapsedTimeRef.current) / 100));
        const placementPenalty = (finalPlacement - 1) * 250;
        const score = baseScore + timeBonus - placementPenalty;
        
        const result: RaceResult = {
            id: uuidv4(),
            umaId: trainedCharacter!.character.id,
            distance,
            phase1_quality: 90, // placeholder
            phase2_quality: 85, // placeholder
            phase3_quality: 95, // placeholder
            overall_quality: 90, // placeholder
            raceScore: score,
            placement: finalPlacement,
            date: new Date().toISOString()
        }
        
        setFinalResult(result)
        addRaceToHistory(result)
    }, [addRaceToHistory, distance, trainedCharacter, opponents, position, currentLane]);


    const gameLoop = useCallback((timestamp: number) => {
        if (lastTickRef.current === 0) {
            lastTickRef.current = timestamp;
            beatCycleStartRef.current = timestamp;
            gameLoopRef.current = requestAnimationFrame(gameLoop);
            return;
        }

        const delta = timestamp - lastTickRef.current;
        lastTickRef.current = timestamp;
        
        elapsedTimeRef.current += delta;
        
        // Beat timing logic
        const timeSinceBeatCycleStart = timestamp - beatCycleStartRef.current;
        let currentBeatProgress = timeSinceBeatCycleStart / BASE_BEAT_INTERVAL;

        if (currentBeatProgress >= 1.0) {
            currentBeatProgress = 0;
            beatCycleStartRef.current = timestamp;
        }
        setBeatProgress(currentBeatProgress);


        // Speed and position logic
        const baseSpeed = (trainedCharacter.trainedStats.speed ?? 50) / 10;
        const burstMultiplier = isBursting ? 2 : 1;
        const techBonus = (trainedCharacter.trainedStats.technique ?? 50) / 100; // 0.5 to 1
        const currentSpeed = baseSpeed * burstMultiplier * (1 + techBonus);
        
        let shouldFinish = false;
        
        setPosition(pos => {
            const newPos = Math.min(RACE_LENGTH, pos + currentSpeed * (delta / 1000));
            if (newPos >= RACE_LENGTH) {
                shouldFinish = true;
            }
            return newPos;
        });

        setOpponents(prev => prev.map(op => ({
            ...op,
            position: Math.min(RACE_LENGTH, op.position + op.speed * (delta / 1000))
        })));

        if (shouldFinish || elapsedTimeRef.current >= MAX_RACE_TIME) {
            finishRace();
        } else {
            gameLoopRef.current = requestAnimationFrame(gameLoop);
        }
    }, [trainedCharacter, isBursting, finishRace]);


    const startRace = () => {
        resetRaceState();
        setRaceState('racing');

        const newOpponents = Array.from({ length: OPPONENT_COUNT }).map((_, i) => ({
            id: i,
            position: 0,
            lane: (i + 1) % LANE_COUNT,
            speed: (trainedCharacter?.character.baseStats.speed ?? 50) / 10 * (0.8 + Math.random() * 0.4) 
        }));
        setOpponents(newOpponents);

        lastTickRef.current = 0;
        
        gameLoopRef.current = requestAnimationFrame(gameLoop);
    };

    const handlePlayerClick = () => {
        if (raceState !== 'racing' || !trainedCharacter) return;
        
        const progress = (performance.now() - beatCycleStartRef.current) / BASE_BEAT_INTERVAL;

        if (progress >= beatWindow.start && progress <= beatWindow.end) {
            setShowHitMarker(true);
            setTimeout(() => setShowHitMarker(false), 150);
            
            if (charge < MAX_CHARGE) {
                setCharge(c => c + 1);
            }
        } else {
             setCurrentLane(prev => (prev + (Math.random() > 0.5 ? 1 : -1) + LANE_COUNT) % LANE_COUNT);
        }
    };
    
    useEffect(() => {
        if (charge === MAX_CHARGE && !isBursting) {
             setIsBursting(true);
             setCharge(0);
             if (burstTimeoutRef.current) clearTimeout(burstTimeoutRef.current);
             burstTimeoutRef.current = setTimeout(() => {
                setIsBursting(false);
                randomizeBeatWindow(); // Move the window after burst ends
             }, BURST_DURATION);
        }
    }, [charge, isBursting, randomizeBeatWindow]);


    if (!trainedCharacter) {
        return (
             <div className="flex items-center justify-center h-full">
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
        if (p === 1) return "1st";
        if (p === 2) return "2nd";
        if (p === 3) return "3rd";
        return `${p}th`;
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
                    <span className="text-2xl text-muted-foreground">/ {OPPONENT_COUNT + 1}</span>
                </div>
                 <p className="text-xl">
                    Finished in {placementText(finalResult?.placement ?? 4)} place!
                </p>
                <div className="text-lg">
                    Final Race Score: <span className="font-bold text-primary">{finalResult?.raceScore}</span>
                </div>

                <div className="flex justify-center gap-4 pt-4">
                    <Button variant="outline" onClick={() => setRaceState('setup')}>Race Again</Button>
                    <Button onClick={() => router.push('/')}>Select New Character</Button>
                </div>
            </CardContent>
        </Card>
    );

    const renderRacing = () => {
        return (
            <div className="w-full flex flex-col items-center gap-4">
                <Card className="w-full">
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <CardTitle className='font-headline text-2xl'>{character.name}</CardTitle>
                            <span className="font-bold text-xl">{placementText(playerRank)} / {OPPONENT_COUNT + 1}</span>
                        </div>
                        <CardDescription>Click in the highlighted zone to charge, click outside to switch lanes.</CardDescription>
                    </CardHeader>
                     <CardContent className="space-y-4">
                        <div className="relative w-full h-8 bg-muted rounded-full overflow-hidden border">
                            {/* On-beat window */}
                            <div 
                                className="absolute top-0 h-full bg-primary/30" 
                                style={{ 
                                    left: `${beatWindow.start * 100}%`, 
                                    width: `${(beatWindow.end - beatWindow.start) * 100}%` 
                                }} 
                            />

                            {/* Beat indicator */}
                            <div className="absolute top-0 h-full w-1 bg-primary" style={{ left: `${beatProgress * 100}%` }} />
                            
                            {showHitMarker && (
                                <div 
                                    className="absolute top-0 h-full w-2 bg-accent animate-ping" 
                                    style={{ left: `${beatProgress * 100}%`}} 
                                />
                            )}
                        </div>

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

                <div className="relative w-full h-48 bg-muted/50 p-2 rounded-lg space-y-2 border">
                    {Array.from({ length: LANE_COUNT }).map((_, i) => (
                         <div key={i} className="relative w-full h-1/3 bg-foreground/10 rounded">
                           {currentLane === i && (
                                <div 
                                    className="absolute top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold transition-all duration-100"
                                    style={{ left: `calc(${(position / RACE_LENGTH) * 100}% - 16px)`}}
                                >
                                    U
                                </div>
                           )}
                           {opponents.filter(o => o.lane === i).map(op => (
                               <div 
                                    key={op.id}
                                    className="absolute top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-destructive flex items-center justify-center text-destructive-foreground font-bold transition-all duration-100"
                                    style={{ left: `calc(${(op.position / RACE_LENGTH) * 100}% - 16px)`}}
                                >
                                    {op.id + 1}
                                </div>
                           ))}
                         </div>
                    ))}
                     <div className="absolute top-0 right-0 w-0.5 h-full bg-green-500" />
                </div>
                <Button onClick={handlePlayerClick} className="w-full max-w-xs" size="lg">Click</Button>
            </div>
        )
    };

    return (
        <div className="w-full h-full flex items-center justify-center">
            {raceState === 'setup' && renderSetup()}
            {raceState === 'racing' && renderRacing()}
            {raceState === 'finished' && finalResult && renderFinished()}
        </div>
    );
}
