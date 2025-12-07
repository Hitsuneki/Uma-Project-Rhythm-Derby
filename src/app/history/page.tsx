"use client"

import { useAppContext } from "@/context/AppContext"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { format } from 'date-fns'

export default function HistoryPage() {
  const { sprintHistory, raceHistory } = useAppContext()

  return (
      <Tabs defaultValue="races">
        <div className="flex justify-between items-center mb-4">
            <h1 className="text-3xl font-headline">History</h1>
            <TabsList>
                <TabsTrigger value="races">Races</TabsTrigger>
                <TabsTrigger value="sprints">Sprints</TabsTrigger>
            </TabsList>
        </div>
        
        <TabsContent value="races">
            <Card>
                <CardHeader>
                <CardTitle>Race History</CardTitle>
                <CardDescription>Review your past showcase races.</CardDescription>
                </CardHeader>
                <CardContent>
                {raceHistory.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                        <p className="text-lg">No races completed yet.</p>
                        <p>Go train a character and enter a showcase race!</p>
                    </div>
                ) : (
                    <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Placement</TableHead>
                            <TableHead>Score</TableHead>
                            <TableHead>Quality</TableHead>
                            <TableHead>Distance</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {raceHistory.map(race => (
                            <TableRow key={race.id}>
                            <TableCell>{format(new Date(race.date), "PPP p")}</TableCell>
                            <TableCell><span className="font-bold text-lg">{race.placement}</span></TableCell>
                            <TableCell>{race.raceScore}</TableCell>
                            <TableCell><Badge variant="secondary">{race.overall_quality}%</Badge></TableCell>
                            <TableCell><Badge variant="outline" className="capitalize">{race.distance}</Badge></TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                    </Table>
                )}
                </CardContent>
            </Card>
        </TabsContent>
        
        <TabsContent value="sprints">
            <Card>
                <CardHeader>
                <CardTitle>Sprint History</CardTitle>
                <CardDescription>Review your past training sprints.</CardDescription>
                </CardHeader>
                <CardContent>
                {sprintHistory.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                    <p className="text-lg">No sprints completed yet.</p>
                    <p>Go train a character!</p>
                    </div>
                ) : (
                    <Table>
                    <TableHeader>
                        <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Score</TableHead>
                        <TableHead>Good Stride</TableHead>
                        <TableHead>Overstrain</TableHead>
                        <TableHead>Underpace</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {sprintHistory.map(sprint => (
                            <TableRow key={sprint.id}>
                            <TableCell>{format(new Date(sprint.date), "PPP p")}</TableCell>
                            <TableCell><span className="font-bold">{sprint.score}</span></TableCell>
                            <TableCell><Badge variant="secondary" className="bg-green-500/20 text-green-700">{sprint.goodStride}%</Badge></TableCell>
                            <TableCell><Badge variant="secondary" className="bg-red-500/20 text-red-700">{sprint.overstrain}%</Badge></TableCell>
                            <TableCell><Badge variant="secondary" className="bg-blue-500/20 text-blue-700">{sprint.underpace}%</Badge></TableCell>
                            </TableRow>
                        )
                        )}
                    </TableBody>
                    </Table>
                )}
                </CardContent>
            </Card>
        </TabsContent>
      </Tabs>
  )
}
