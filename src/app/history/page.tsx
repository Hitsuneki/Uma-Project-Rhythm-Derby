"use client"

import { useAppContext } from "@/context/AppContext"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { format } from 'date-fns'

export default function HistoryPage() {
  const { sprintHistory } = useAppContext()

  return (
    <main className="flex-1 p-4 sm:p-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl font-headline">Sprint History</CardTitle>
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
    </main>
  )
}
