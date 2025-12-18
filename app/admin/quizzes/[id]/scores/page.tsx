import { notFound, redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { InfoTooltip } from '@/components/ui/InfoTooltip'
import Link from 'next/link'
import { createSupabaseServiceClient } from '@/lib/supabase'
import { shortHash } from '@/lib/crypto'

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

  // Calculate analytics per spec
  const totalAttempts = quiz.attempts.length
  const savedScores = quiz.scoreEntries.length
  
  // Unique devices from attempts
  const uniqueDevices = new Set(quiz.attempts.map((a: any) => a.deviceHash)).size
  
  // Unique emails from saved scores
  const uniqueEmails = new Set(quiz.scoreEntries.map((s: any) => s.emailHash)).size
  
  // Completion rate = savedScores / totalAttempts (per spec)
  const completionRate = totalAttempts > 0 
    ? ((savedScores / totalAttempts) * 100).toFixed(1) 
    : '0.0'

  // Average score from all completed attempts
  const completedAttempts = quiz.attempts.filter((a: any) => a.finishedAt).length
  const avgScore = completedAttempts > 0
    ? (quiz.attempts
        .filter((a: any) => a.finishedAt)
        .reduce((sum: number, a: any) => sum + (a.score || 0), 0) / completedAttempts).toFixed(1)
    : '0.0'
  
  // Group attempts by device for per-device analytics
  const deviceStats = new Map<string, {
    deviceHash: string
    attemptsCount: number
    savedScoresCount: number
    bestScore: number
    lastSeen: Date
    firstSeen: Date
    emails: Map<string, number> // email -> count
  }>()
  
  quiz.attempts.forEach((attempt: any) => {
    const hash = attempt.deviceHash
    if (!deviceStats.has(hash)) {
      deviceStats.set(hash, {
        deviceHash: hash,
        attemptsCount: 0,
        savedScoresCount: 0,
        bestScore: 0,
        lastSeen: new Date(attempt.createdAt),
        firstSeen: new Date(attempt.createdAt),
        emails: new Map()
      })
    }
    
    const stats = deviceStats.get(hash)!
    stats.attemptsCount++
    stats.bestScore = Math.max(stats.bestScore, attempt.score || 0)
    const attemptDate = new Date(attempt.createdAt)
    if (attemptDate > stats.lastSeen) {
      stats.lastSeen = attemptDate
    }
    if (attemptDate < stats.firstSeen) {
      stats.firstSeen = attemptDate
    }
  })
  
  // Add saved score info to device stats with email counts
  quiz.scoreEntries.forEach((entry: any) => {
    const hash = entry.deviceHash
    if (deviceStats.has(hash)) {
      const stats = deviceStats.get(hash)!
      stats.savedScoresCount++
      if (entry.email) {
        const currentCount = stats.emails.get(entry.email) || 0
        stats.emails.set(entry.email, currentCount + 1)
      }
    }
  })
  
  // Convert to array and sort by attempts count descending
  const deviceStatsArray = Array.from(deviceStats.values())
    .sort((a, b) => b.attemptsCount - a.attemptsCount)

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
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <Card>
            <CardContent className="text-center py-6">
              <div className="text-3xl font-bold text-blue-600">{totalAttempts}</div>
              <div className="text-sm text-gray-900 mt-1 flex items-center justify-center">
                Total Attempts
                <InfoTooltip text="Number of times someone clicked 'Start Quiz', including abandoned attempts" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="text-center py-6">
              <div className="text-3xl font-bold text-green-600">{savedScores}</div>
              <div className="text-sm text-gray-900 mt-1 flex items-center justify-center">
                Saved Scores
                <InfoTooltip text="Number of quiz completions where the user saved their score to the leaderboard" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="text-center py-6">
              <div className="text-3xl font-bold text-purple-600">{uniqueDevices}</div>
              <div className="text-sm text-gray-900 mt-1 flex items-center justify-center">
                Unique Devices
                <InfoTooltip text="Number of distinct devices that attempted the quiz (based on privacy-safe device fingerprint)" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="text-center py-6">
              <div className="text-3xl font-bold text-indigo-600">{uniqueEmails}</div>
              <div className="text-sm text-gray-900 mt-1 flex items-center justify-center">
                Unique Emails
                <InfoTooltip text="Number of distinct email addresses that saved scores to the leaderboard" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="text-center py-6">
              <div className="text-3xl font-bold text-pink-600">{completionRate}%</div>
              <div className="text-sm text-gray-900 mt-1 flex items-center justify-center">
                Completion Rate
                <InfoTooltip text="Percentage of quiz attempts that resulted in saved scores (Saved Scores ÷ Total Attempts × 100)" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="text-center py-6">
              <div className="text-3xl font-bold text-orange-600">{avgScore}</div>
              <div className="text-sm text-gray-900 mt-1 flex items-center justify-center">
                Average Score
                <InfoTooltip text="Average score of all completed quiz attempts (finished attempts only)" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Saved Scores Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              Saved Scores
              <InfoTooltip text="List of all quiz completions where users saved their score to the leaderboard, showing their performance and device used" />
            </CardTitle>
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
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-800 uppercase">Email</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-800 uppercase">Device</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-800 uppercase">Score</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-800 uppercase">%</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {quiz.scoreEntries.map((entry: any) => (
                      <tr key={entry.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {new Date(entry.createdAt).toLocaleDateString()} {new Date(entry.createdAt).toLocaleTimeString()}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">{entry.name}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{entry.email}</td>
                        <td className="px-4 py-3 text-sm text-gray-600 font-mono">{shortHash(entry.deviceHash)}</td>
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

        {/* Attempts Per Device Analytics */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              Attempts Per Device
              <InfoTooltip text="Analytics grouped by device showing how many times each device attempted the quiz, their best score, and which emails were used from that device" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            {deviceStatsArray.length === 0 ? (
              <p className="text-gray-800 text-center py-8">No device data yet</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-800 uppercase">Device Hash</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-800 uppercase">Attempts</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-800 uppercase">Saved</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-800 uppercase">Best Score</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-800 uppercase">First / Last Seen</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-800 uppercase">Emails (×count)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {deviceStatsArray.map((stats) => {
                      const emailEntries = Array.from(stats.emails.entries())
                      const topEmails = emailEntries.slice(0, 3)
                      const remainingEmails = emailEntries.slice(3)
                      
                      return (
                        <tr key={stats.deviceHash} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-600 font-mono">{shortHash(stats.deviceHash)}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{stats.attemptsCount}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{stats.savedScoresCount}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{stats.bestScore}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            <div className="text-xs text-gray-600">First: {stats.firstSeen.toLocaleDateString()}</div>
                            <div>Last: {stats.lastSeen.toLocaleDateString()} {stats.lastSeen.toLocaleTimeString()}</div>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {topEmails.length > 0 ? (
                              <div className="space-y-1">
                                {topEmails.map(([email, count], idx) => (
                                  <div key={idx}>
                                    {email}{count > 1 && <span className="text-xs text-gray-600"> ({count}×)</span>}
                                  </div>
                                ))}
                                {remainingEmails.length > 0 && (
                                  <details className="text-xs text-blue-600 cursor-pointer">
                                    <summary className="hover:underline">
                                      +{remainingEmails.length} more (click to view all)
                                    </summary>
                                    <div className="mt-2 space-y-1 text-gray-900 text-sm">
                                      {remainingEmails.map(([email, count], idx) => (
                                        <div key={idx}>
                                          {email}{count > 1 && <span className="text-xs text-gray-600"> ({count}×)</span>}
                                        </div>
                                      ))}
                                    </div>
                                  </details>
                                )}
                              </div>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Attempts */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              Recent Attempts (All)
              <InfoTooltip text="All quiz attempts including completed and abandoned ones. Shows when users started the quiz, whether they finished, and their final score" />
            </CardTitle>
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
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-800 uppercase">Device</th>
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
                        <td className="px-4 py-3 text-sm text-gray-600 font-mono">{shortHash(attempt.deviceHash)}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {attempt.score} / {attempt.maxScore}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {attempt.finishedAt ? (
                            <span className="text-green-600 font-medium">Completed</span>
                          ) : (
                            <span className="text-red-600 font-medium">Exited</span>
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
