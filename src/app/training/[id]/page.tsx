"use client"

import React, { useState, useEffect, useReducer, useMemo } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Image from 'next/image'
import { useAppContext } from '@/context/AppContext'
import { presetCharacters } from '@/lib/characters'
import type { UmaCharacter, Stat } from '@/lib/types'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Separator } from '@/components/ui/separator'
import { Zap, Shield, Dumbbell, Brain, Bed, Lightbulb, Trophy } from 'lucide-react'
import { useToast } from "@/hooks/use-toast"
import { getCharacterStrategyHints } from '@/ai/flows/get-character-strategy-hints'
import type { StrategyHints } from '@/ai/flows/get-character-strategy-hints'
import { Skeleton } from '@/components/ui/skeleton'
import { Label } from '@/components/ui/label'

type TrainingAction = 'speed' | 'stamina' | 'power' | 'technique' | 'rest'
type TrainingLog = { turn: number, action: TrainingAction, message: string }
type State = {
  turn: number
  stats: { speed: number, stamina: number, power: number, technique: number }
  energy: number
  logs: TrainingLog[]
}
type Action = { type: 'train', payload: { action: TrainingAction } } | { type: 'reset', payload: { baseStats: State['stats'] } }

const MAX_TURNS = 10
const ENERGY_COST = 15
const REST_GAIN = 20
const LOW_ENERGY_THRESHOLD = 20

const trainingOptions = [
    { id: 'speed', label: 'Speed Training', icon: Zap, cost: ENERGY_COST, gain: { stat: 'speed', amount: 5 } },
    { id: 'stamina', label: 'Stamina Training', icon: Shield, cost: ENERGY_COST, gain: { stat: 'stamina', amount: 5 } },
    { id: 'power', label: 'Power Training', icon: Dumbbell, cost: ENERGY_COST, gain: { stat: 'power', amount: 5 } },
    { id: 'technique', label: 'Technique Training', icon: Brain, cost: ENERGY_COST, gain: { stat: 'technique', amount: 5 } },
    { id: 'rest', label: 'Rest', icon: Bed, cost: 0, gain: { stat: 'energy', amount: REST_GAIN } },
] as const

const reducer = (state: State, action: Action): State => {
  if (action.type === 'reset') {
    return {
      turn: 1,
      stats: action.payload.baseStats,
      energy: 100,
      logs: []
    }
  }

  if (state.turn > MAX_TURNS) return state

  const { trainingAction } = { trainingAction: action.payload.action };
  
  if (trainingAction !== 'rest' && state.energy < ENERGY_COST) {
    return {
        ...state,
        logs: [{ turn: state.turn, action: trainingAction, message: "Not enough energy!" }, ...state.logs]
    }
  }
  
  let newStats = { ...state.stats }
  let newEnergy = state.energy
  let logMessage = ""
  const isFatigued = state.energy <= LOW_ENERGY_THRESHOLD && trainingAction !== 'rest'

  const option = trainingOptions.find(o => o.id === trainingAction)!
  
  if (trainingAction === 'rest') {
    newEnergy = Math.min(100, state.energy + option.gain.amount)
    logMessage = `Energy restored to ${newEnergy}.`
  } else {
    newEnergy -= option.cost
    const gainAmount = isFatigued ? Math.floor(option.gain.amount / 2) : option.gain.amount
    newStats[option.gain.stat as Stat] += gainAmount
    logMessage = `+${gainAmount} ${option.gain.stat}. ${isFatigued ? ' (Less effective due to low energy)' : ''}`
  }

  return {
    turn: state.turn + 1,
    stats: newStats,
    energy: newEnergy,
    logs: [{ turn: state.turn, action: trainingAction, message: logMessage }, ...state.logs],
  }
}

export default function TrainingPage() {
  const router = useRouter()
  const params = useParams()
  const { selectedCharacter, setTrainedCharacter } = useAppContext()
  const { toast } = useToast()

  const [character, setCharacter] = useState<UmaCharacter | null>(null)
  const [state, dispatch] = useReducer(reducer, { turn: 1, stats: { speed: 0, stamina: 0, power: 0, technique: 0 }, energy: 100, logs: [] })
  const [strategyHints, setStrategyHints] = useState<StrategyHints | null>(null)
  const [isLoadingHints, setIsLoadingHints] = useState(false)

  useEffect(() => {
    let char: UmaCharacter | undefined;
    if (selectedCharacter && selectedCharacter.id === params.id) {
        char = selectedCharacter;
    } else {
        char = presetCharacters.find(c => c.id === params.id)
    }

    if (char) {
      setCharacter(char)
      dispatch({ type: 'reset', payload: { baseStats: char.baseStats } })
    } else {
      router.push('/')
    }
  }, [params.id, selectedCharacter, router])
  
  useEffect(() => {
    if (character && state.turn === 1) {
      setIsLoadingHints(true);
      getCharacterStrategyHints(character.baseStats)
        .then(setStrategyHints)
        .catch(err => {
            console.error("Error getting hints:", err);
            toast({ title: "AI Error", description: "Could not fetch strategy hints.", variant: "destructive" });
        })
        .finally(() => setIsLoadingHints(false));
    }
  }, [character, state.turn, toast])


  const handleTraining = (action: TrainingAction) => {
    dispatch({ type: 'train', payload: { action } })
  }
  
  const handleRace = () => {
    if (!character) return;
    setTrainedCharacter({
        character: character,
        trainedStats: state.stats
    })
    toast({
        title: "Training Complete!",
        description: `${character.name} is ready to race!`
    })
    router.push('/race')
  }

  const isTrainingFinished = useMemo(() => state.turn > MAX_TURNS, [state.turn]);

  if (!character) {
    return <div className="flex-1 p-4 sm:p-6 flex justify-center items-center"><Skeleton className="w-full h-96" /></div>
  }
  
  return (
    <main className="flex-1 p-4 sm:p-6">
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <CardTitle className="text-2xl font-headline">Training: Turn {Math.min(state.turn, MAX_TURNS)} / {MAX_TURNS}</CardTitle>
                        {isTrainingFinished && (
                            <Button onClick={handleRace}><Trophy className="mr-2 h-4 w-4"/> Enter Race</Button>
                        )}
                    </div>
                    <CardDescription>Select a training option to improve your Uma's stats.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {trainingOptions.map(option => (
                            <Button
                                key={option.id}
                                variant="outline"
                                className="h-24 flex flex-col gap-2 justify-center"
                                onClick={() => handleTraining(option.id as TrainingAction)}
                                disabled={isTrainingFinished || (option.id !== 'rest' && state.energy < ENERGY_COST)}
                            >
                                <option.icon className="w-8 h-8 text-primary" />
                                <span className="font-semibold">{option.label}</span>
                                {option.id !== 'rest' && <span className="text-xs text-muted-foreground">Cost: {option.cost} Energy</span>}
                            </Button>
                        ))}
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Training Log</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4 max-h-60 overflow-y-auto pr-2">
                        {state.logs.length > 0 ? state.logs.map((log, index) => (
                             <Alert key={index} className={log.message.includes("Not enough energy") ? "border-destructive text-destructive" : ""}>
                                <AlertTitle className="text-sm font-semibold">Turn {log.turn}: {log.action.charAt(0).toUpperCase() + log.action.slice(1)}</AlertTitle>
                                <AlertDescription className="text-sm">{log.message}</AlertDescription>
                            </Alert>
                        )) : (
                            <p className="text-sm text-muted-foreground text-center py-4">Your training log is empty. Start training!</p>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader className="relative h-48 flex justify-center items-center">
                <Image src={character.imageUrl} alt={character.name} fill style={{objectFit: 'cover'}} className="rounded-t-lg" data-ai-hint={character.imageHint}/>
                <div className="absolute inset-0 bg-black/40 rounded-t-lg" />
                <CardTitle className="relative text-3xl font-headline text-white z-10">{character.name}</CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div>
                <Label>Energy ({state.energy}/100)</Label>
                <Progress value={state.energy} className="h-4 mt-1" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                {(Object.keys(state.stats) as Stat[]).map(stat => (
                    <div key={stat} className="flex items-center gap-2">
                        {React.createElement(trainingOptions.find(o => o.id === stat)!.icon, { className: 'w-5 h-5 text-primary' })}
                        <span className="capitalize text-sm font-medium">{stat}:</span>
                        <span className="font-bold">{state.stats[stat]}</span>
                    </div>
                ))}
              </div>
            </CardContent>
          </Card>
          
           <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Lightbulb className="text-primary"/> Strategy Hints</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingHints ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-4 w-full" />
                </div>
              ) : strategyHints ? (
                <div className="space-y-2 text-sm">
                  <p><strong>Best Distance:</strong> {strategyHints.bestDistance}</p>
                  <p><strong>Preferred Style:</strong> {strategyHints.preferredStyle}</p>
                  <Separator className="my-2" />
                  <p className="text-muted-foreground">{strategyHints.aiOpponentAnalysis}</p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No hints available.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  )
}
