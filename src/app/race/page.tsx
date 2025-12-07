"use client"

import React, { useState, useEffect, useReducer, useCallback, useRef, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useAppContext } from '@/context/AppContext'
import type { UmaCharacter, Stat, SprintResult, TrainedUma, RaceResult, Trait } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Trophy, Flag, Shield, Zap, Brain, ChevronsUp, ChevronsDown } from 'lucide-react'
import { useToast } from "@/hooks/use-toast"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { v4 as uuidv4 } from "uuid"

type RacePhase = 'start' | 'mid' | 'final'
type RaceState = 'setup' | 'countdown' | 'racing' | 'finished'
type RaceDistance = 'short' | 'mid' | 'long'

const PHASE_DURATION = 5 * 1000 // 5 seconds per phase
const TENSION_PER_TAP = 8
const TENSION_DECAY_RATE = 25 // per second

const racePhases: RacePhase[] = ['start', 'mid', 'final']

const getPhaseConfig = (phase: RacePhase, character: UmaCharacter) => {
    let comfortMin = character.comfortMin;
    let comfortMax = character.comfortMax;
    let gravity = TENSION_DECAY_RATE;

    // Apply trait effects
    if (phase === 'start' && character.trait.name === 'Fast Starter') {
        comfortMax += 5;
    }
    if (phase === 'mid' && character.trait.name === 'Rhythm Master') {
        gravity *= 0.9; // Less decay
    }
     if (phase === 'final' && character.trait.name === 'Strong Finisher') {
        comfortMin -= 5;
    }

    return { comfortMin, comfortMax, gravity };
};


export default function RacePage() {
    const router = useRouter()
    const { trainedCharacter, addRaceToHistory, updateCharacter, setTrainedCharacter, characters } = useAppContext()
    const { toast } = useToast()

    const [raceState, setRaceState] = useState<RaceState>('setup')
    const [distance, setDistance] = useState<RaceDistance>('mid')
    const [currentPhaseIndex, setCurrentPhaseIndex] = useState(0)
    const [countdown, setCountdown] = useState(3)
    const [tension, setTension] = useState(0)
    
    const [phaseQualities, setPhaseQualities] = useState<Partial<Record<RacePhase, number>>>({})
    const [finalResult, setFinalResult] = useState<RaceResult | null>(null)
    const [progress, setProgress] = useState(0);

    const raceTimer = useRef<NodeJS.Timeout | null>(null)
    const countdownTimer = useRef<NodeJS.Timeout | null>(null)
    const animationFrame = useRef<number>(0)
    const phaseMetrics = useRef({ goodTime: 0, totalTime: 0, startTime: 0 })

    useEffect(() => {
        if (!trainedCharacter && characters.length > 0) {
            // If no trained character is set, but characters exist, set the first one.
            const firstChar = characters[0];
            setTrainedCharacter({
                character: firstChar,
                trainedStats: firstChar.baseStats
            });
        }
        
        return () => {
            if (raceTimer.current) clearTimeout(raceTimer.current)
            if (countdownTimer.current) clearTimeout(countdownTimer.current)
            if(animationFrame.current) cancelAnimationFrame(animationFrame.current)
        }
    }, [trainedCharacter, characters, setTrainedCharacter, toast, router])

    const currentPhase = useMemo(() => racePhases[currentPhaseIndex], [currentPhaseIndex])
    
    const calculateRaceResults = () => {
        if (!trainedCharacter) return;
        
        const weights = {
            short: { start: 0.5, mid: 0.3, final: 0.2 },
            mid: { start: 0.3, mid: 0.4, final: 0.3 },
            long: { start: 0.2, mid: 0.4, final: 0.4 },
        }
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
        // You could add XP for racing here as well
    }
    
    const finishPhase = () => {
        cancelAnimationFrame(animationFrame.current)
        const { goodTime, totalTime } = phaseMetrics.current
        const quality = totalTime > 0 ? (goodTime / totalTime) * 100 : 0
        setPhaseQualities(prev => ({...prev, [currentPhase]: quality}))
        
        if (currentPhaseIndex < racePhases.length - 1) {
            setCurrentPhaseIndex(prev => prev + 1)
            startPhase()
        } else {
            setRaceState('finished')
            calculateRaceResults()
        }
    }

    const updateTension = useCallback((deltaTime: number) => {
        if (!trainedCharacter) return;
        const { comfortMin, comfortMax, gravity } = getPhaseConfig(currentPhase, trainedCharacter.character);
        
        phaseMetrics.current.totalTime += deltaTime;
        setProgress((phaseMetrics.current.totalTime / PHASE_DURATION) * 100);
        if (tension >= comfortMin && tension <= comfortMax) {
          phaseMetrics.current.goodTime += deltaTime;
        }
        
        let decay = gravity;
        if (currentPhase === 'mid' && trainedCharacter.trainedStats.stamina > 60) {
            decay *= 0.8; // High stamina makes it easier to maintain pace
        }

        setTension(prev => Math.max(0, prev - decay * (deltaTime / 1000)))
    }, [trainedCharacter, tension, currentPhase])

    const gameLoop = useCallback((timestamp: number) => {
        if (phaseMetrics.current.startTime === 0) {
            phaseMetrics.current.startTime = timestamp;
        }
        const deltaTime = timestamp - phaseMetrics.current.startTime;
        phaseMetrics.current.startTime = timestamp;

        updateTension(deltaTime);
        animationFrame.current = requestAnimationFrame(gameLoop);
    }, [updateTension])

    const startPhase = () => {
        setTension(50); // Reset tension for new phase
        setProgress(0);
        phaseMetrics.current = { goodTime: 0, totalTime: 0, startTime: 0 }
        animationFrame.current = requestAnimationFrame(gameLoop)

        raceTimer.current = setTimeout(finishPhase, PHASE_DURATION)
    }

    const startRace = () => {
        setRaceState('racing')
        startPhase()
    }

    const startCountdown = () => {
        setRaceState('countdown')
        let count = 3
        setCountdown(count)
        countdownTimer.current = setInterval(() => {
            count--
            setCountdown(count)
            if (count === 0) {
                clearInterval(countdownTimer.current!)
                startRace()
            }
        }, 1000)
    }

    const handleTap = () => {
        if (raceState !== 'racing' || !trainedCharacter) return;
        
        let tensionGain = TENSION_PER_TAP;
        if (currentPhase === 'start' && trainedCharacter.trainedStats.speed > 60) {
            tensionGain *= 1.1; // High speed makes it more responsive
        }
        if (trainedCharacter.character.temperament === 'Fiery') tensionGain *= 1.2;
        if (trainedCharacter.character.temperament === 'Calm') tensionGain *= 0.8;

        setTension(prev => Math.min(100, prev + tensionGain))
    }

    if (!trainedCharacter) {
        return (
             <main className="flex-1 p-4 sm:p-6 flex items-center justify-center">
                <Card>
                    <CardHeader>
                        <CardTitle>Select a Character</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p>You need to select a character before you can race.</p>
                        <Button onClick={() => router.push('/')} className="mt-4">Go to Character Selection</Button>
                    </CardContent>
                </Card>
            </main>
        )
    }

    const character = trainedCharacter.character;
    const { comfortMin, comfortMax } = getPhaseConfig(currentPhase, character);
    const tensionHeight = `${tension}%`;
    const sweetZoneTop = `${100 - comfortMax}%`;
    const sweetZoneHeight = `${comfortMax - comfortMin}%`;
    
    const getPlacement = (score: number) => {
        if (score > 150) return 1
        if (score > 120) return 2
        if (score > 90) return 3
        return 4
    }

    const placementText = (p: number) => {
        switch(p) {
            case 1: return "1st"
            case 2: return "2nd"
            case 3: return "3rd"
            default: return `${p}th`
        }
    }
    
    const renderSetup = () => (
        <Card className="w-full max-w-lg">
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
                 <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="p-2 rounded-lg bg-muted"><Zap className="mx-auto mb-1"/> Speed: {trainedCharacter.trainedStats.speed}</div>
                    <div className="p-2 rounded-lg bg-muted"><Shield className="mx-auto mb-1"/> Stamina: {trainedCharacter.trainedStats.stamina}</div>
                    <div className="p-2 rounded-lg bg-muted"><Brain className="mx-auto mb-1"/> Technique: {trainedCharacter.trainedStats.technique}</div>
                </div>
            </CardContent>
            <CardFooter>
                <Button onClick={startCountdown} className="w-full">Start Race</Button>
            </CardFooter>
        </Card>
    );

    const renderRacing = () => (
        <Card className="w-full max-w-md">
             <CardHeader>
                <div className="flex justify-between items-center">
                    <CardTitle className="text-2xl font-headline capitalize">{currentPhase} Phase</CardTitle>
                    <Progress value={progress} className="w-40 h-3"/>
                </div>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center gap-4 h-96">
                {raceState === 'countdown' ? (
                    <span className="text-8xl font-bold font-headline text-primary">{countdown}</span>
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <button onClick={handleTap} className="w-40 h-full relative bg-muted rounded-lg overflow-hidden focus:outline-none focus:ring-2 focus:ring-primary">
                            <div className="absolute w-full bg-primary/20" style={{ top: sweetZoneTop, height: sweetZoneHeight }}/>
                            <div className="absolute bottom-0 w-full bg-primary transition-all duration-75 ease-linear" style={{ height: tensionHeight }} />
                             <div className="absolute bottom-0 w-full flex items-end justify-center" style={{ height: tensionHeight }}>
                               <span className="text-primary-foreground font-bold mb-2 text-lg">{Math.round(tension)}</span>
                            </div>
                        </button>
                    </div>
                )}
            </CardContent>
        </Card>
    );

    const renderFinished = () => (
        <Card className="w-full max-w-lg">
            <CardHeader className="text-center">
                <Trophy className="mx-auto w-16 h-16 text-primary" />
                <CardTitle className="text-3xl font-headline mt-4">Showcase Race Complete!</CardTitle>
                <CardDescription>A summary of {character.name}'s performance.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 text-center">
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
                
                <div className="grid grid-cols-3 gap-2 text-sm">
                    <div className="p-2 rounded-lg bg-green-500/10"><ChevronsUp className="w-6 h-6 mx-auto text-green-500"/> Start: {finalResult?.phase1_quality}%</div>
                    <div className="p-2 rounded-lg bg-blue-500/10"><Flag className="w-6 h-6 mx-auto text-blue-500"/> Mid: {finalResult?.phase2_quality}%</div>
                    <div className="p-2 rounded-lg bg-red-500/10"><ChevronsDown className="w-6 h-6 mx-auto text-red-500"/> Final: {finalResult?.phase3_quality}%</div>
                </div>

                <div className="flex justify-center gap-4 pt-4">
                    <Button variant="outline" onClick={() => router.push(`/training/${character.id}`)}>Train Again</Button>
                    <Button onClick={() => router.push('/')}>Select New Character</Button>
                </div>
            </CardContent>
        </Card>
    );

    return (
        <main className="flex-1 p-4 sm:p-6 flex items-center justify-center">
            {raceState === 'setup' && renderSetup()}
            {(raceState === 'countdown' || raceState === 'racing') && renderRacing()}
            {raceState === 'finished' && finalResult && renderFinished()}
        </main>
    );
}

    