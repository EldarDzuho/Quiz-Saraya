import { notFound, redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import Link from 'next/link'
import { createSupabaseServiceClient } from '@/lib/supabase'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function ScoresPage({ params }: PageProps) {
  const { id } = await params
  const session = await getSession()
  
  if (!session) {
    redirect('/auth/login')
  }

  const supabase = createSupabaseServiceClient()
  
  const { data: quiz, error } = await supabase
    .from('QuizPost')
    .select(`
      *,
      scoreEntries:ScoreEntry(*),
      attempts:Attempt(*)
    `)
    .eq('id', id)
    .single()

  if (error || !quiz) {
    notFound()
  }
  
  // Sort by createdAt desc
  quiz.scoreEntries = (quiz.scoreEntries || []).sort((a: any, b: any) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )
  quiz.attempts = (quiz.attempts || []).sort((a: any, b: any) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )

  // Calculate analytics
  const totalAttempts = quiz.attempts.length
  const savedScores = quiz.scoreEntries.length
  
  // Calculate completion rate based on completed attempts (finishedAt is set)
  const completedAttempts = quiz.attempts.filter((a: any) => a.finishedAt).length
  const completionRate = totalAttempts > 0 
    ? ((completedAttempts / totalAttempts) * 100).toFixed(1) 
    : '0.0'

  // Average score from all completed attempts
  const avgScore = completedAttempts > 0
    ? (quiz.attempts
        .filter((a: any) => a.finishedAt)
        .reduce((sum: number, a: any) => sum + (a.score || 0), 0) / completedAttempts).toFixed(1)
    : '0.0'

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <Link href="/admin" className="text-blue-600 hover:underline mb-2 block">
            ← Back to Admin
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">{quiz.title} - Scores & Analytics</h1>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="text-center py-6">
              <div className="text-3xl font-bold text-blue-600">{totalAttempts}</div>
              <div className="text-sm text-gray-900 mt-1">Total Attempts</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="text-center py-6">
              <div className="text-3xl font-bold text-green-600">{savedScores}</div>
              <div className="text-sm text-gray-900 mt-1">Saved Scores</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="text-center py-6">
              <div className="text-3xl font-bold text-purple-600">{completionRate}%</div>
              <div className="text-sm text-gray-900 mt-1">Completion Rate</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="text-center py-6">
              <div className="text-3xl font-bold text-orange-600">{avgScore}</div>
              <div className="text-sm text-gray-900 mt-1">Average Score</div>
            </CardContent>
          </Card>
        </div>

        {/* Saved Scores Table */}
        <Card>
          <CardHeader>
            <CardTitle>Saved Scores</CardTitle>
          </CardHeader>
          <CardContent>
            {savedScores === 0 ? (
              <p className="text-gray-800 text-center py-8">No saved scores yet</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-800 uppercase">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-800 uppercase">Name</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-800 uppercase">Score</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-800 uppercase">Percentage</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {quiz.scoreEntries.map((entry: any) => (
                      <tr key={entry.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {new Date(entry.createdAt).toLocaleDateString()} {new Date(entry.createdAt).toLocaleTimeString()}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">{entry.playerName}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {entry.score} / {entry.maxScore}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {entry.maxScore > 0 ? ((entry.score / entry.maxScore) * 100).toFixed(0) : 0}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Attempts */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Recent Attempts (All)</CardTitle>
          </CardHeader>
          <CardContent>
            {totalAttempts === 0 ? (
              <p className="text-gray-800 text-center py-8">No attempts yet</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-800 uppercase">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-800 uppercase">Player</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-800 uppercase">Score</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-800 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {quiz.attempts.slice(0, 20).map((attempt: any) => (
                      <tr key={attempt.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {new Date(attempt.createdAt).toLocaleDateString()} {new Date(attempt.createdAt).toLocaleTimeString()}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">{attempt.playerName}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {attempt.score} / {attempt.maxScore}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {attempt.finishedAt ? (
                            <span className="text-green-600">Completed</span>
                          ) : (
                            <span className="text-gray-800">In Progress</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
