"use client"

import React, { useReducer, useEffect, useState, useCallback, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAppContext } from '@/context/AppContext'
import { presetCharacters } from '@/lib/characters'
import type { UmaCharacter, Stat, SprintResult, TrainedUma } from '@/lib/types'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Zap, Shield, Brain, ChevronsUp, ChevronsDown, Award } from 'lucide-react'
import { useToast } from "@/hooks/use-toast"
import { Skeleton } from '@/components/ui/skeleton'
import { Label } from '@/components/ui/label'
import { v4 as uuidv4 } from "uuid"

type GameState = 'idle' | 'countdown' | 'sprinting' | 'finished'
type State = {
  stats: { speed: number, stamina: number, technique: number }
  lastSprint: SprintResult | null,
  level: number;
  xp: number;
  xpToNextLevel: number;
}
type Action = 
  | { type: 'apply_sprint_results', payload: { statChanges: Partial<Record<Stat, number>>, sprintResult: SprintResult } } 
  | { type: 'reset', payload: { character: UmaCharacter } }
  | { type: 'level_up', payload: { newXp: number, newXpToNextLevel: number } }
  | { type: 'gain_xp', payload: { xp: number } }


const SPRINT_DURATION = 12 * 1000 // 12 seconds
const TENSION_PER_TAP = 8
const TENSION_DECAY_RATE = 25 // per second

const statIcons = {
    speed: Zap,
    stamina: Shield,
    technique: Brain,
}

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case 'reset':
      return {
        stats: action.payload.character.baseStats,
        lastSprint: null,
        level: action.payload.character.level,
        xp: action.payload.character.xp,
        xpToNextLevel: action.payload.character.xpToNextLevel,
      }
    case 'apply_sprint_results':
      const newStats = { ...state.stats }
      for (const [stat, change] of Object.entries(action.payload.statChanges)) {
        newStats[stat as Stat] = Math.max(0, newStats[stat as Stat] + change)
      }
      return {
        ...state,
        stats: newStats,
        lastSprint: action.payload.sprintResult
      }
    case 'gain_xp':
      return {
        ...state,
        xp: state.xp + action.payload.xp,
      };
    case 'level_up':
      return {
        ...state,
        level: state.level + 1,
        xp: action.payload.newXp,
        xpToNextLevel: action.payload.newXpToNextLevel,
      };
    default:
      return state
  }
}

export default function TrainingPage() {
  const router = useRouter()
  const params = useParams()
  const { selectedCharacter, addSprintToHistory, setTrainedCharacter, updateCharacter } = useAppContext()
  const { toast } = useToast()

  const [character, setCharacter] = useState<UmaCharacter | null>(null)
  const [state, dispatch] = useReducer(reducer, { stats: { speed: 0, stamina: 0, technique: 0 }, lastSprint: null, level: 1, xp: 0, xpToNextLevel: 100 })

  const [gameState, setGameState] = useState<GameState>('idle')
  const [countdown, setCountdown] = useState(3)
  const [tension, setTension] = useState(0)
  
  const sprintTimer = useRef<NodeJS.Timeout | null>(null)
  const countdownTimer = useRef<NodeJS.Timeout | null>(null)
  const animationFrame = useRef<number>(0)
  
  const sprintMetrics = useRef({ goodStride: 0, overstrain: 0, underpace: 0, startTime: 0, totalTime: 0 })

  useEffect(() => {
    // Use selectedCharacter from context if available, otherwise find from presets
    const char = selectedCharacter || presetCharacters.find(c => c.id === params.id)
    if (char) {
      setCharacter(char)
      dispatch({ type: 'reset', payload: { character: char } })
    } else {
      router.push('/')
    }

    return () => {
      if (sprintTimer.current) clearTimeout(sprintTimer.current)
      if (countdownTimer.current) clearTimeout(countdownTimer.current)
      if(animationFrame.current) cancelAnimationFrame(animationFrame.current)
    }
  }, [params.id, router, selectedCharacter])

  const calculateSprintResults = () => {
    if (!character) return;

    const { goodStride, overstrain, underpace, totalTime } = sprintMetrics.current
    if (totalTime === 0) return;

    const goodStridePerc = (goodStride / totalTime) * 100
    const overstrainPerc = (overstrain / totalTime) * 100
    const underpacePerc = (underpace / totalTime) * 100

    let score = goodStridePerc - (overstrainPerc * 0.5 + underpacePerc * 0.25)
    
    let statChanges: Partial<Record<Stat, number>> = {}
    if (goodStridePerc > 50) {
      statChanges.speed = (statChanges.speed || 0) + 2
      statChanges.technique = (statChanges.technique || 0) + 1
    }
    if (overstrainPerc > 0) {
      statChanges.speed = (statChanges.speed || 0) + 1
      statChanges.stamina = (statChanges.stamina || 0) - 1
    }
    if (underpacePerc > 20) {
      statChanges.stamina = (statChanges.stamina || 0) + 2
    }
    
    // Trait effects
    if (character.trait.name === 'Late Burst' && (sprintMetrics.current.totalTime / 1000) > 9) {
        score *= 1.1;
    }
    if (character.trait.name === 'Powerhouse' && overstrainPerc > 0) {
        statChanges.speed = (statChanges.speed || 0) + 1;
    }
    if (character.trait.name === 'Prodigy' && goodStridePerc > 60) {
        statChanges.technique = (statChanges.technique || 0) + 1;
    }
     if (character.trait.name === 'Heart of Gold' && underpacePerc > 10) {
        statChanges.stamina = (statChanges.stamina || 0) + 1;
    }


    const result: SprintResult = {
      id: uuidv4(),
      umaId: character!.id,
      goodStride: Math.round(goodStridePerc),
      overstrain: Math.round(overstrainPerc),
      underpace: Math.round(underpacePerc),
      score: Math.round(score),
      statChanges,
      date: new Date().toISOString()
    }

    dispatch({ type: 'apply_sprint_results', payload: { statChanges, sprintResult: result } })
    addSprintToHistory(result)
    
    const xpGained = Math.max(10, Math.round(score / 5));
    dispatch({ type: 'gain_xp', payload: { xp: xpGained } });

    toast({ title: "Sprint Complete!", description: `You scored ${result.score} and gained ${xpGained} XP.` })
  }

  const updateTension = useCallback((deltaTime: number) => {
    if (!character) return;
    
    sprintMetrics.current.totalTime += deltaTime;
    if (tension > character.comfortMax) {
      sprintMetrics.current.overstrain += deltaTime;
    } else if (tension < character.comfortMin) {
      sprintMetrics.current.underpace += deltaTime;
    } else {
      sprintMetrics.current.goodStride += deltaTime;
    }
    
    let decay = TENSION_DECAY_RATE;
    if(character.trait.name === 'Steady') decay *= 0.8;
    
    setTension(prev => Math.max(0, prev - decay * (deltaTime / 1000)))
  }, [character, tension])

  const gameLoop = useCallback((timestamp: number) => {
    if (sprintMetrics.current.startTime === 0) {
      sprintMetrics.current.startTime = timestamp;
    }
    const deltaTime = timestamp - sprintMetrics.current.startTime;
    sprintMetrics.current.startTime = timestamp;

    updateTension(deltaTime);
    animationFrame.current = requestAnimationFrame(gameLoop);
  }, [updateTension])

  const startSprint = () => {
    setGameState('sprinting')
    sprintMetrics.current = { goodStride: 0, overstrain: 0, underpace: 0, startTime: 0, totalTime: 0 }
    animationFrame.current = requestAnimationFrame(gameLoop)
    sprintTimer.current = setTimeout(() => {
      setGameState('finished')
      cancelAnimationFrame(animationFrame.current)
      calculateSprintResults()
    }, SPRINT_DURATION)
  }

  const startCountdown = () => {
    setGameState('countdown');
    setCountdown(3);
    let count = 3;
    countdownTimer.current = setInterval(() => {
      count--;
      setCountdown(count);
      if (count === 0) {
        clearInterval(countdownTimer.current!);
        startSprint();
      }
    }, 1000);
  };

  const handleTap = () => {
    if (gameState !== 'sprinting') return
    let tensionGain = TENSION_PER_TAP;
    if (character?.temperament === 'Fiery') tensionGain *= 1.2;
    if (character?.temperament === 'Calm') tensionGain *= 0.8;
    setTension(prev => Math.min(100, prev + tensionGain))
  }
  
  const resetSprint = () => {
    setTension(0)
    setGameState('idle')
  }

  // Check for level up
  useEffect(() => {
    if (character && state.xp >= state.xpToNextLevel) {
      const newXp = state.xp - state.xpToNextLevel;
      const newXpToNextLevel = Math.floor(state.xpToNextLevel * 1.5);
      dispatch({ type: 'level_up', payload: { newXp, newXpToNextLevel } });
      toast({ title: "Level Up!", description: `${character.name} has reached Level ${state.level + 1}!` });
    }
  }, [state.xp, state.xpToNextLevel, state.level, character, toast]);

  const enterShowcaseRace = () => {
    if (!character) return;
    
    const finalCharacterState: UmaCharacter = {
        ...character,
        baseStats: state.stats, // The trained stats become the new base stats
        level: state.level,
        xp: state.xp,
        xpToNextLevel: state.xpToNextLevel,
    };
    
    const trainedUma: TrainedUma = {
      character: finalCharacterState,
      trainedStats: state.stats
    }
    
    updateCharacter(finalCharacterState);
    setTrainedCharacter(trainedUma)
    router.push('/race')
  }

  if (!character) {
    return <div className="flex-1 p-4 sm:p-6 flex justify-center items-center"><Skeleton className="w-full h-96" /></div>
  }

  const tensionHeight = `${tension}%`
  const sweetZoneTop = `${100 - character.comfortMax}%`
  const sweetZoneHeight = `${character.comfortMax - character.comfortMin}%`

  return (
    <main className="flex-1 p-4 sm:p-6">
       <div className="grid gap-6 lg:grid-cols-3">
         <div className="lg:col-span-2 space-y-6">
            <Card className="relative overflow-hidden">
                <CardHeader>
                  <CardTitle className="text-2xl font-headline">Training Sprint</CardTitle>
                   <CardDescription>
                    {
                        gameState === 'idle' ? 'Click "Start Sprint" to begin.' :
                        gameState === 'countdown' ? 'Get ready...' :
                        gameState === 'sprinting' ? 'Tap to build speed and stay in the sweet zone!' :
                        'Sprint finished! See your results below.'
                    }
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center gap-4 h-96">
                    {gameState === 'idle' && <Button onClick={startCountdown} size="lg">Start Sprint</Button>}
                    {gameState === 'countdown' && <span className="text-8xl font-bold font-headline text-primary">{countdown}</span>}
                    {(gameState === 'sprinting' || gameState === 'finished') && (
                       <div className="w-full h-full flex items-center justify-center">
                          <button onClick={handleTap} disabled={gameState !== 'sprinting'} className="w-40 h-full relative bg-muted rounded-lg overflow-hidden focus:outline-none focus:ring-2 focus:ring-primary">
                            <div className="absolute w-full bg-primary/20" style={{ top: sweetZoneTop, height: sweetZoneHeight }}/>
                            <div className="absolute bottom-0 w-full bg-primary transition-all duration-75 ease-linear" style={{ height: tensionHeight }} />
                            <div className="absolute bottom-0 w-full flex items-end justify-center" style={{ height: tensionHeight }}>
                               <span className="text-primary-foreground font-bold mb-2 text-lg">{Math.round(tension)}</span>
                            </div>
                            {gameState === 'sprinting' && (
                                <div className="absolute top-2 right-2">
                                    <Progress value={(sprintMetrics.current.totalTime / SPRINT_DURATION) * 100} className="w-32"/>
                                </div>
                            )}
                          </button>
                       </div>
                    )}
                </CardContent>
                {gameState === 'finished' && (
                     <CardFooter className="flex justify-center gap-4">
                        <Button onClick={resetSprint}>Train Again</Button>
                        <Button variant="outline" onClick={enterShowcaseRace}>Showcase Race</Button>
                    </CardFooter>
                )}
            </Card>

            {state.lastSprint && (
              <Card>
                <CardHeader>
                  <CardTitle>Last Sprint Results</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div className="flex flex-col items-center gap-1 p-2 rounded-lg bg-muted">
                        <Award className="w-8 h-8 text-primary"/>
                        <Label>Score</Label>
                        <span className="text-2xl font-bold">{state.lastSprint.score}</span>
                    </div>
                    <div className="flex flex-col items-center gap-1 p-2 rounded-lg bg-green-500/10">
                        <ChevronsUp className="w-8 h-8 text-green-500"/>
                        <Label>Good Stride</Label>
                        <span className="text-2xl font-bold">{state.lastSprint.goodStride}%</span>
                    </div>
                    <div className="flex flex-col items-center gap-1 p-2 rounded-lg bg-red-500/10">
                        <ChevronsUp className="w-8 h-8 text-red-500"/>
                        <Label>Overstrain</Label>
                        <span className="text-2xl font-bold">{state.lastSprint.overstrain}%</span>
                    </div>
                    <div className="flex flex-col items-center gap-1 p-2 rounded-lg bg-blue-500/10">
                        <ChevronsDown className="w-8 h-8 text-blue-500"/>
                        <Label>Underpace</Label>
                        <span className="text-2xl font-bold">{state.lastSprint.underpace}%</span>
                    </div>
                </CardContent>
              </Card>
            )}
        </div>
        
        <div className="lg:col-span-1 space-y-6">
          <Card>
             <CardHeader className="relative h-48 flex justify-center items-center rounded-t-lg bg-muted">
                 <div className="relative w-full h-full bg-muted flex items-center justify-center">
                    <span className="font-headline text-3xl text-muted-foreground z-10">{character.name}</span>
                 </div>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div>
                <div className="flex justify-between items-baseline">
                    <Label>Level</Label>
                    <span className="font-bold text-lg text-primary">{state.level}</span>
                </div>
                <Progress value={(state.xp / state.xpToNextLevel) * 100} className="h-2 mt-1" />
                <p className="text-xs text-muted-foreground text-right mt-1">{state.xp} / {state.xpToNextLevel} XP</p>
              </div>
              <Separator/>
              <div className="grid grid-cols-3 gap-4">
                {(Object.keys(state.stats) as Stat[]).map(stat => (
                    <div key={stat} className="flex flex-col items-center gap-2 p-2 rounded-lg bg-muted">
                        {React.createElement(statIcons[stat], { className: 'w-6 h-6 text-primary' })}
                        <span className="capitalize text-sm font-medium">{stat}</span>
                        <span className="font-bold text-xl">{state.stats[stat]}</span>
                    </div>
                ))}
              </div>
               <Separator />
               <div>
                <Label>Comfort Zone</Label>
                <div className="relative h-6 w-full bg-muted rounded-full mt-1">
                    <div className="absolute h-full bg-primary/30 rounded-full" style={{ left: `${character.comfortMin}%`, width: `${character.comfortMax - character.comfortMin}%`}} />
                </div>
               </div>
            </CardContent>
          </Card>
        </div>

      </div>
    </main>
  )
}
