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
const BASE_BEAT_INTERVAL = 500;
const BEAT_RANDOMNESS = 200; // +/- 100ms
const TIMING_WINDOW = 80; // ms, +/- from beat
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

    const [charge, setCharge] = useState(0);
    const [isBursting, setIsBursting] = useState(false);
    const burstTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const [currentLane, setCurrentLane] = useState(0);
    const [position, setPosition] = useState(0);
    const [opponents, setOpponents] = useState<Opponent[]>([]);

    const [lastBeatTimestamp, setLastBeatTimestamp] = useState(0);
    const [nextBeatInterval, setNextBeatInterval] = useState(BASE_BEAT_INTERVAL);

    const [showHitMarker, setShowHitMarker] = useState(false);
    const [beatProgress, setBeatProgress] = useState(0);


    const currentPosition = opponents.length > 0 ? opponents.filter(o => o.position > position).length + 1 : 1;

    useEffect(() => {
        if (!trainedCharacter && characters.length > 0) {
            const firstChar = characters.find(c => c.level > 0) || characters[0];
            setTrainedCharacter({
                character: firstChar,
                trainedStats: firstChar.baseStats
            });
        }
        return () => {
            if (burstTimeoutRef.current) clearTimeout(burstTimeoutRef.current);
            if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
        }
    }, [trainedCharacter, characters, setTrainedCharacter]);

    const resetRaceState = useCallback(() => {
        setPosition(0);
        setCurrentLane(Math.floor(LANE_COUNT / 2));
        setCharge(0);
        setIsBursting(false);
        setLastBeatTimestamp(0);
        setNextBeatInterval(BASE_BEAT_INTERVAL);
        elapsedTimeRef.current = 0;
        lastTickRef.current = 0;
        setFinalResult(null);
        if (burstTimeoutRef.current) clearTimeout(burstTimeoutRef.current);
        if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
    }, []);
    
    const finishRace = useCallback(() => {
        if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
        setRaceState('finished');
        
        const finalPlacement = opponents.filter(o => o.position > position).length + 1;
        const score = Math.round(position - elapsedTimeRef.current / 100);
        
        const result: RaceResult = {
            id: uuidv4(),
            umaId: trainedCharacter!.character.id,
            distance,
            phase1_quality: 90, phase2_quality: 85, phase3_quality: 95, // placeholder
            overall_quality: 90, // placeholder
            raceScore: score,
            placement: finalPlacement,
            date: new Date().toISOString()
        }
        
        setFinalResult(result)
        addRaceToHistory(result)
    }, [addRaceToHistory, distance, trainedCharacter, opponents, position]);

    const gameLoop = useCallback((timestamp: number) => {
        if (lastTickRef.current === 0) {
            lastTickRef.current = timestamp;
            gameLoopRef.current = requestAnimationFrame(gameLoop);
            return;
        }

        const delta = timestamp - lastTickRef.current;
        lastTickRef.current = timestamp;
        elapsedTimeRef.current += delta;
        
        if (!trainedCharacter) return;

        // Beat timing logic
        const timeSinceBeat = Date.now() - lastBeatTimestamp;
        if (timeSinceBeat >= nextBeatInterval) {
            setLastBeatTimestamp(Date.now());
            const nextInterval = BASE_BEAT_INTERVAL + (Math.random() - 0.5) * BEAT_RANDOMNESS;
            setNextBeatInterval(nextInterval);
            setBeatProgress(0);
        } else {
            setBeatProgress(Math.min(100, (timeSinceBeat / nextBeatInterval) * 100));
        }

        // Speed and position logic
        const baseSpeed = (trainedCharacter.character.baseStats.speed ?? 50) / 10;
        const burstMultiplier = isBursting ? 2 : 1;
        const techBonus = (trainedCharacter.character.baseStats.technique ?? 50) / 100; // 0.5 to 1
        const currentSpeed = baseSpeed * burstMultiplier * (1 + techBonus);
        
        const newPosition = position + currentSpeed * (delta / 1000);
        setPosition(newPosition);

        setOpponents(prev => prev.map(op => ({
            ...op,
            position: op.position + op.speed * (delta / 1000)
        })));

        if (newPosition >= RACE_LENGTH || elapsedTimeRef.current >= MAX_RACE_TIME) {
            finishRace();
        } else {
            gameLoopRef.current = requestAnimationFrame(gameLoop);
        }
    }, [trainedCharacter, isBursting, finishRace, position, lastBeatTimestamp, nextBeatInterval]);


    const startRace = () => {
        resetRaceState();
        setRaceState('racing');

        // Create opponents
        const newOpponents = Array.from({ length: OPPONENT_COUNT }).map((_, i) => ({
            id: i,
            position: 0,
            lane: (i + 1) % LANE_COUNT,
            speed: (trainedCharacter?.character.baseStats.speed ?? 50) / 10 * (0.8 + Math.random() * 0.4) // Speed between 80% and 120% of player
        }));
        setOpponents(newOpponents);

        setLastBeatTimestamp(Date.now());
        const firstInterval = BASE_BEAT_INTERVAL + (Math.random() - 0.5) * BEAT_RANDOMNESS;
        setNextBeatInterval(firstInterval);
        
        lastTickRef.current = 0;
        gameLoopRef.current = requestAnimationFrame(gameLoop);
    };

    const handlePlayerClick = () => {
        if (raceState !== 'racing' || !trainedCharacter) return;

        const timeSinceBeat = Date.now() - lastBeatTimestamp;
        const effectiveWindow = TIMING_WINDOW + (trainedCharacter.character.baseStats.technique / 2);

        if (timeSinceBeat <= effectiveWindow || (nextBeatInterval - timeSinceBeat) <= effectiveWindow) {
            setShowHitMarker(true);
            setTimeout(() => setShowHitMarker(false), 150);

            if (charge < MAX_CHARGE) {
                setCharge(c => c + 1);
            }
        } else {
             setCurrentLane(prev => (prev + 1) % LANE_COUNT);
        }
    };
    
    useEffect(() => {
        if (charge === MAX_CHARGE && !isBursting) {
             setIsBursting(true);
             setCharge(0);
             if (burstTimeoutRef.current) clearTimeout(burstTimeoutRef.current);
             burstTimeoutRef.current = setTimeout(() => setIsBursting(false), BURST_DURATION);
        }
    }, [charge, isBursting]);


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
        const windowSizePercent = (TIMING_WINDOW / nextBeatInterval) * 100;
        const allRunners = [...opponents, {id: 99, position: position, lane: currentLane, speed: 0}].sort((a,b) => b.position - a.position);
        const playerRank = allRunners.findIndex(r => r.id === 99) + 1;

        return (
            <div className="w-full flex flex-col items-center gap-4" onClick={handlePlayerClick}>
                <Card className="w-full">
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <CardTitle className='font-headline text-2xl'>Lane Pulse Racing: {character.name}</CardTitle>
                            <span className="font-bold text-xl">{placementText(playerRank)} / {OPPONENT_COUNT + 1}</span>
                        </div>
                        <CardDescription>Click on the beat to charge, click off-beat to switch lanes.</CardDescription>
                    </CardHeader>
                     <CardContent className="space-y-4">
                        <div className="relative w-full h-8 bg-muted rounded-full overflow-hidden">
                            <div className="absolute top-0 h-full bg-primary/20" style={{ left: `calc(100% - ${windowSizePercent}px)`, right: '0', bottom: '0' }} />
                            <div className="absolute top-0 h-full bg-primary/20" style={{ left: '0', width: `${windowSizePercent}px` }} />
                            <div className="absolute h-full w-1 bg-primary" style={{ left: `${beatProgress}%` }} />
                            {showHitMarker && (
                                <div 
                                    className="absolute top-0 h-full w-2 bg-accent animate-ping" 
                                    style={{ left: `${beatProgress}%`}} 
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

                <div className="relative w-full h-48 bg-muted/50 p-2 rounded-lg space-y-2">
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
                                    AI
                                </div>
                           ))}
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
