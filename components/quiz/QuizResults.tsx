'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { getThemeStyle } from '@/lib/theme'
import { saveScore } from '@/app/actions/public-actions'

interface QuizResultsProps {
  attempt: {
    id: string
    playerName: string
    score: number
    maxScore: number
    quizPost: {
      title: string
      theme: any
      slug: string
      questions: Array<{
        id: string
        text: string
        order: number
        choices: Array<{
          id: string
          text: string
          isCorrect: boolean
        }>
      }>
    }
    answers: Array<{
      questionId: string
      selectedChoice: {
        id: string
        text: string
        isCorrect: boolean
      } | null
    }>
  }
}

export function QuizResults({ attempt }: QuizResultsProps) {
  const [email, setEmail] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const themeStyle = getThemeStyle(attempt.quizPost.theme)
  const percentage = attempt.maxScore > 0 
    ? Math.round((attempt.score / attempt.maxScore) * 100) 
    : 0

  const handleSaveScore = async () => {
    if (!email.trim()) {
      alert('Please enter your email')
      return
    }

    setSaving(true)
    try {
      const result = await saveScore(attempt.id, attempt.playerName, email)
      if (result.success) {
        setSaved(true)
      } else {
        alert(result.error || 'Failed to save score')
      }
    } catch (error) {
      console.error('Save error:', error)
      alert('Failed to save score')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen" style={themeStyle}>
      <div className="min-h-screen bg-black bg-opacity-30">
        <div className="max-w-3xl mx-auto px-4 py-8">
          {/* Score Card */}
          <div className="bg-white/20 backdrop-blur-2xl rounded-3xl shadow-2xl p-8 mb-8 border border-white/40 text-center">
            <div className="py-8">
              <h1 className="text-3xl font-bold mb-2 text-white drop-shadow-lg">{attempt.quizPost.title}</h1>
              <p className="text-white mb-6 drop-shadow-md">Results for {attempt.playerName}</p>
              
              <div className="flex justify-center items-center gap-8 mb-6">
                <div>
                  <div className="text-5xl font-bold text-white drop-shadow-lg">
                    {attempt.score}
                  </div>
                  <div className="text-white mt-1 drop-shadow-md">out of {attempt.maxScore}</div>
                </div>
                <div>
                  <div className="text-5xl font-bold text-white drop-shadow-lg">
                    {percentage}%
                  </div>
                  <div className="text-white mt-1 drop-shadow-md">correct</div>
                </div>
              </div>

              {!saved ? (
                <div className="max-w-md mx-auto">
                  <p className="text-sm text-white mb-4 drop-shadow-md">
                    Save your score to the leaderboard
                  </p>
                  <div className="flex gap-2">
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email..."
                      labelClassName="text-white drop-shadow-md"
                      onKeyPress={(e) => e.key === 'Enter' && handleSaveScore()}
                    />
                    <Button onClick={handleSaveScore} disabled={saving}>
                      {saving ? 'Saving...' : 'Save'}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="bg-green-500/20 backdrop-blur-lg border border-green-400/50 rounded-lg p-4 max-w-md mx-auto">
                  <p className="text-white font-medium drop-shadow-md">✓ Score saved successfully!</p>
                </div>
              )}
            </div>
          </div>

          {/* Question Review */}
          <h2 className="text-2xl font-bold text-white mb-4 drop-shadow-lg">Review Answers</h2>
          <div className="space-y-6">
            {attempt.quizPost.questions.map((question, qIndex) => {
              const answer = attempt.answers.find(a => a.questionId === question.id)
              const correctChoice = question.choices.find(c => c.isCorrect)
              const isCorrect = answer?.selectedChoice?.isCorrect || false

              return (
                <div key={question.id} className="bg-white/20 backdrop-blur-2xl rounded-3xl shadow-2xl p-6 border border-white/40">
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <span className={`text-2xl ${isCorrect ? 'text-green-400' : 'text-red-400'} drop-shadow-lg`}>
                        {isCorrect ? '✓' : '✗'}
                      </span>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold mb-2 text-white drop-shadow-md">
                          {qIndex + 1}. {question.text}
                        </h3>
                        
                        <div className="space-y-2">
                          {answer?.selectedChoice && (
                            <div className={`p-3 rounded-lg ${
                              isCorrect ? 'bg-green-500/20 backdrop-blur-lg border border-green-400/50' : 'bg-red-500/20 backdrop-blur-lg border border-red-400/50'
                            }`}>
                              <div className="text-sm font-medium mb-1 text-white drop-shadow-md">Your answer:</div>
                              <div className="text-white">{answer.selectedChoice.text}</div>
                            </div>
                          )}
                          
                          {!isCorrect && correctChoice && (
                            <div className="p-3 rounded-lg bg-green-500/20 backdrop-blur-lg border border-green-400/50">
                              <div className="text-sm font-medium mb-1 text-white drop-shadow-md">Correct answer:</div>
                              <div className="text-white">{correctChoice.text}</div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Retake Button */}
          <div className="mt-8 text-center bg-white/20 backdrop-blur-2xl rounded-3xl shadow-2xl p-6 border border-white/40">
            <a
              href={`/q/${attempt.quizPost.slug}`}
              className="inline-block bg-black text-white px-6 py-3 rounded-2xl hover:bg-gray-800 transition font-medium shadow-xl"
            >
              Take Quiz Again
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
