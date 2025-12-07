"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { useAppContext } from "@/context/AppContext"
import { useToast } from "@/hooks/use-toast"
import { v4 as uuidv4 } from "uuid"

const MAX_POINTS = 150
const MIN_STAT = 30
const MAX_STAT = 70

const createUmaSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters long."),
  speed: z.number().min(MIN_STAT).max(MAX_STAT),
  stamina: z.number().min(MIN_STAT).max(MAX_STAT),
  technique: z.number().min(MIN_STAT).max(MAX_STAT),
}).refine(data => data.speed + data.stamina + data.technique <= MAX_POINTS, {
  message: `Total stat points cannot exceed ${MAX_POINTS}.`,
  path: ["speed"],
});

type CreateUmaForm = z.infer<typeof createUmaSchema>

export default function CreateUmaPage() {
  const router = useRouter()
  const { setSelectedCharacter } = useAppContext()
  const { toast } = useToast()

  const { control, handleSubmit, watch, formState: { errors } } = useForm<CreateUmaForm>({
    resolver: zodResolver(createUmaSchema),
    defaultValues: {
      name: "",
      speed: MIN_STAT,
      stamina: MIN_STAT,
      technique: MIN_STAT,
    },
  })

  const watchedStats = watch(["speed", "stamina", "technique"])
  const totalPoints = watchedStats.reduce((sum, val) => sum + (val || MIN_STAT), 0)

  const onSubmit = (data: CreateUmaForm) => {
    if (totalPoints > MAX_POINTS) {
        toast({
            title: "Error",
            description: `Total points exceed the limit of ${MAX_POINTS}.`,
            variant: "destructive"
        })
        return
    }

    const newCharacter: any = {
      id: uuidv4(),
      name: data.name,
      imageUrl: `https://picsum.photos/seed/${data.name}/400/600`,
      description: "A custom character full of potential.",
      imageHint: "anime character",
      baseStats: {
        speed: data.speed,
        stamina: data.stamina,
        technique: data.technique,
      },
      temperament: 'Normal',
      comfortMin: 40,
      comfortMax: 60,
      trait: { name: 'Rookie', description: 'A fresh face with a lot to learn.' },
    }
    
    setSelectedCharacter(newCharacter)
    toast({
      title: "Character Created!",
      description: `${data.name} is ready for training.`,
    })
    router.push(`/training/${newCharacter.id}`)
  }

  return (
    <main className="flex-1 p-4 sm:p-6 flex justify-center items-start">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-3xl font-headline">Create Your Own Uma</CardTitle>
          <CardDescription>Design a new character. You have {MAX_POINTS} points to distribute among the stats.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Controller
                name="name"
                control={control}
                render={({ field }) => <Input id="name" placeholder="e.g., Lightning Bolt" {...field} />}
              />
              {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Label>Stat Points</Label>
                <span className={`font-bold ${totalPoints > MAX_POINTS ? 'text-destructive' : 'text-foreground'}`}>
                  {totalPoints} / {MAX_POINTS}
                </span>
              </div>
              {(['speed', 'stamina', 'technique'] as const).map(stat => (
                <div key={stat} className="space-y-2">
                   <Controller
                    name={stat}
                    control={control}
                    render={({ field }) => (
                      <>
                        <div className="flex justify-between">
                            <Label htmlFor={stat} className="capitalize">{stat}</Label>
                            <span>{field.value}</span>
                        </div>
                        <Slider
                            id={stat}
                            min={MIN_STAT}
                            max={MAX_STAT}
                            step={1}
                            value={[field.value]}
                            onValueChange={(value) => field.onChange(value[0])}
                        />
                      </>
                    )}
                  />
                </div>
              ))}
              {errors.speed && <p className="text-sm text-destructive">{errors.speed.message}</p>}
            </div>

          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={totalPoints > MAX_POINTS}>
              Start Training
            </Button>
          </CardFooter>
        </form>
      </Card>
    </main>
  )
}
