"use client"

import { useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useAppContext } from '@/context/AppContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Trophy } from 'lucide-react'

export default function RacePage() {
  const router = useRouter()
  const { trainedCharacter, sprintHistory } = useAppContext()
  
  useEffect(() => {
    if (!trainedCharacter) {
      router.push('/')
    }
  }, [trainedCharacter, router])

  const last5Sprints = useMemo(() => {
    if (!trainedCharacter) return []
    return sprintHistory.filter(s => s.umaId === trainedCharacter.character.id).slice(0, 5)
  }, [sprintHistory, trainedCharacter])

  const averageGoodStride = useMemo(() => {
    if (last5Sprints.length === 0) return 0
    const total = last5Sprints.reduce((sum, sprint) => sum + sprint.goodStride, 0)
    return total / last5Sprints.length
  }, [last5Sprints])


  if (!trainedCharacter) {
    return null;
  }

  const { speed, stamina, technique } = trainedCharacter.trainedStats;
  const raceScore = Math.round(speed * 1.2 + stamina * 1.0 + technique * 0.8 + averageGoodStride * 0.5);
  
  const getPlacement = (score: number) => {
    if (score > 280) return 1
    if (score > 240) return 2
    if (score > 200) return 3
    return 4
  }

  const placement = getPlacement(raceScore)
  
  const placementText = (p: number) => {
    switch(p) {
        case 1: return "1st"
        case 2: return "2nd"
        case 3: return "3rd"
        default: return `${p}th`
    }
  }


  return (
    <main className="flex-1 p-4 sm:p-6 flex items-center justify-center">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <Trophy className="mx-auto w-16 h-16 text-primary" />
          <CardTitle className="text-3xl font-headline mt-4">Showcase Race Complete!</CardTitle>
          <CardDescription>A summary of your character's performance.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 text-center">
            <div className="text-6xl font-bold">
                {placement}
                <span className="text-2xl text-muted-foreground">/ 4</span>
            </div>
            <p className="text-xl">
                {trainedCharacter.character.name} finished in {placementText(placement)} place!
            </p>
             <div className="text-lg">
                Final Race Score: <span className="font-bold text-primary">{raceScore}</span>
            </div>

            <div className="flex justify-center gap-4 pt-4">
                <Button variant="outline" onClick={() => router.push(`/training/${trainedCharacter.character.id}`)}>Train Again</Button>
                <Button onClick={() => router.push('/')}>Select New Character</Button>
              </div>
        </CardContent>
      </Card>
    </main>
  )
}
