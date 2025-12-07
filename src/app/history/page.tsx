"use client"

import { useAppContext } from "@/context/AppContext"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { format } from 'date-fns'

export default function HistoryPage() {
  const { raceHistory } = useAppContext()

  return (
    <main className="flex-1 p-4 sm:p-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl font-headline">Race History</CardTitle>
          <CardDescription>Review your past race results.</CardDescription>
        </CardHeader>
        <CardContent>
          {raceHistory.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-lg">No races completed yet.</p>
              <p>Go train a character and compete!</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Character</TableHead>
                  <TableHead>Distance</TableHead>
                  <TableHead>Placement</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {raceHistory.map(race => {
                  const player = race.participants.find(p => 'character' in p && 'trainedStats' in p) as any;
                  
                  if (!player) return null;

                  return (
                    <TableRow key={race.id}>
                      <TableCell>{format(new Date(race.date), "PPP p")}</TableCell>
                      <TableCell>{player.character.name}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{race.distance}</Badge>
                      </TableCell>
                      <TableCell>
                        <span className="font-bold">{race.playerPlacement} / {race.participants.length}</span>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </main>
  )
}
