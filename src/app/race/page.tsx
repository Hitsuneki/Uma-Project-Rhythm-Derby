"use client"

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { useAppContext } from '@/context/AppContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Separator } from '@/components/ui/separator'
import { generateAiOpponentStats } from '@/ai/flows/generate-ai-opponent-stats'
import { analyzeAiOpponentStats } from '@/ai/flows/analyze-ai-opponent-stats'
import type { AiOpponent, TrainedUma, RaceParticipant } from '@/lib/types'
import { Trophy, Flag, Info } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { v4 as uuidv4 } from "uuid"

type Distance = 'Short' | 'Mid' | 'Long'

const opponentNames = ["Rival Racer A", "Challenger B", "Speedster C"];

const calculateScore = (stats: TrainedUma['trainedStats'], distance: Distance, style: TrainedUma['character']['style']): number => {
  const { speed, stamina, power, technique } = stats
  let score = 0
  let styleBonus = 0

  switch (distance) {
    case 'Short':
      score = 0.5 * speed + 0.1 * stamina + 0.2 * power + 0.2 * technique
      if (style === 'Front') styleBonus = 5;
      break
    case 'Mid':
      score = 0.35 * speed + 0.25 * stamina + 0.2 * power + 0.2 * technique
      if (style === 'Mid') styleBonus = 5;
      break
    case 'Long':
      score = 0.25 * speed + 0.4 * stamina + 0.2 * power + 0.15 * technique
      if (style === 'Back') styleBonus = 5;
      break
  }
  
  const randomFactor = Math.random() * 10;
  return score + styleBonus + randomFactor;
}

export default function RacePage() {
  const router = useRouter()
  const { trainedCharacter, addRaceToHistory } = useAppContext()
  
  const [distance, setDistance] = useState<Distance | null>(null)
  const [aiOpponents, setAiOpponents] = useState<AiOpponent[]>([])
  const [participants, setParticipants] = useState<(RaceParticipant | (AiOpponent & { score: number, placement: number, character: { name: string, imageUrl: string } }))[]>([])
  const [raceStarted, setRaceStarted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [opponentHints, setOpponentHints] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!trainedCharacter) {
      router.push('/')
    }
  }, [trainedCharacter, router])

  const handleStartRace = async () => {
    if (!distance || !trainedCharacter) return
    setIsLoading(true);

    try {
      const generatedStats = await generateAiOpponentStats({ umaCount: 3, distanceType: distance });
      const opponents: AiOpponent[] = generatedStats.map((stats, i) => ({
        id: `ai-${i}`,
        name: opponentNames[i],
        stats: stats,
        style: stats.style,
      }));
      setAiOpponents(opponents);

      const hints: Record<string, string> = {};
      for (const op of opponents) {
        const hintResult = await analyzeAiOpponentStats(op.stats);
        hints[op.name] = hintResult.hint;
      }
      setOpponentHints(hints);

      const playerParticipant: RaceParticipant = {
        ...trainedCharacter,
        score: calculateScore(trainedCharacter.trainedStats, distance, trainedCharacter.character.style),
        placement: 0,
      }
      
      const aiParticipants = opponents.map(op => ({
        ...op,
        character: { name: op.name, imageUrl: `https://picsum.photos/seed/${op.name.replace(' ','')}/100/100` },
        score: calculateScore(op.stats, distance, op.style),
        placement: 0
      }))

      const allParticipants = [playerParticipant, ...aiParticipants].sort((a, b) => b.score - a.score)
      const rankedParticipants = allParticipants.map((p, i) => ({ ...p, placement: i + 1 }))
      
      setParticipants(rankedParticipants)
      
      const playerResult = rankedParticipants.find(p => 'character' in p && p.character.id === trainedCharacter.character.id)!

      addRaceToHistory({
        id: uuidv4(),
        distance,
        participants: rankedParticipants,
        playerPlacement: playerResult.placement,
        date: new Date().toISOString()
      })
      
      setRaceStarted(true)
    } catch (error) {
        console.error("Failed to start race:", error);
    } finally {
        setIsLoading(false)
    }
  }

  if (!trainedCharacter) {
    return <div className="flex-1 p-6"><Skeleton className="w-full h-96" /></div>;
  }
  
  const playerResult = participants.find(p => 'character' in p && p.character.id === trainedCharacter.character.id)

  return (
    <main className="flex-1 p-4 sm:p-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl font-headline">Race Day!</CardTitle>
          <CardDescription>Select a race distance and prove {trainedCharacter.character.name}'s strength.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {!raceStarted ? (
            <div className="flex flex-col items-center gap-6">
              <h3 className="text-xl font-semibold">Choose Distance</h3>
              <div className="flex gap-4">
                {(['Short', 'Mid', 'Long'] as Distance[]).map(d => (
                  <Button key={d} variant={distance === d ? "default" : "outline"} onClick={() => setDistance(d)} className="w-32 h-16 text-lg">
                    {d}
                  </Button>
                ))}
              </div>
              <Button onClick={handleStartRace} disabled={!distance || isLoading} size="lg" className="mt-4">
                {isLoading ? "Preparing Opponents..." : <><Flag className="mr-2 h-5 w-5"/> Start Race</>}
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              <Alert variant={playerResult?.placement === 1 ? "default" : "destructive"} className={playerResult?.placement === 1 ? "border-green-500" : ""}>
                <Trophy className="h-4 w-4" />
                <AlertTitle>Race Finished!</AlertTitle>
                <AlertDescription>
                  You finished in <strong>{playerResult?.placement}st/nd/rd/th</strong> place in the {distance} distance race.
                </AlertDescription>
              </Alert>

              <div className="space-y-3">
                <h3 className="text-lg font-semibold">Race Progress</h3>
                <div className="w-full bg-muted rounded-lg p-4 space-y-3">
                  {participants.map((p, i) => (
                    <div key={i} className="flex items-center gap-4">
                      <span className="font-bold w-6 text-center">{p.placement}</span>
                      <Image src={'character' in p ? p.character.imageUrl : `https://picsum.photos/seed/${p.name.replace(' ','')}/100/100`} alt={p.name} width={40} height={40} className="rounded-full" />
                      <div className="flex-1">
                          <div className="flex justify-between mb-1">
                              <span className="text-sm font-medium">{'character' in p ? p.character.name : p.name}</span>
                              <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <button><Info className="h-4 w-4 text-muted-foreground" /></button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>{opponentHints[p.name] || 'This is you!'}</p>
                                    </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                          </div>
                          <div className="w-full bg-background rounded-full h-4 overflow-hidden">
                              <div className="bg-primary h-4 rounded-full transition-all duration-1000 ease-out" style={{ width: `${(p.score / 120) * 100}%` }} />
                          </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />
              <div className="flex justify-center gap-4">
                <Button variant="outline" onClick={() => router.push(`/training/${trainedCharacter.character.id}`)}>Train Again</Button>
                <Button onClick={() => router.push('/')}>Select New Character</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  )
}
