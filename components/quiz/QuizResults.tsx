'use client'

import { useSearchParams } from 'next/navigation'
import { getThemeStyle } from '@/lib/theme'

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
  const searchParams = useSearchParams()
  const isRepeat = searchParams.get('repeat') === 'true'

  const themeStyle = getThemeStyle(attempt.quizPost.theme)
  const percentage = attempt.maxScore > 0 
    ? Math.round((attempt.score / attempt.maxScore) * 100) 
    : 0

  // Calculate rewards - NEW FORMULA
  const coinsEarned = isRepeat ? 0 : 100 // Fixed 100 coins
  const xpEarned = isRepeat ? 0 : 50     // Fixed 50 XP
  
  // Tokens: 1 per correct answer + 2 bonus for perfect
  const correctAnswers = attempt.score
  let tokensEarned = isRepeat ? 0 : correctAnswers
  const isPerfect = percentage === 100
  if (isPerfect && !isRepeat) {
    tokensEarned += 2 // Add 2 bonus tokens for perfect score
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

              {/* Rewards Earned */}
              {isRepeat ? (
                <div className="mb-6 p-4 bg-blue-500/20 backdrop-blur-lg rounded-2xl border border-blue-400/50">
                  <div className="text-white font-semibold mb-2 drop-shadow-md">ℹ️ Already Completed</div>
                  <div className="text-white text-sm drop-shadow-md">
                    You've already completed this quiz before. Rewards are only given once per quiz.
                  </div>
                </div>
              ) : (
                <div className="mb-6 p-4 bg-gradient-to-r from-yellow-500/20 to-green-500/20 backdrop-blur-lg rounded-2xl border border-yellow-400/50">
                  <div className="text-white font-semibold mb-2 drop-shadow-md">🎉 Rewards Earned:</div>
                  <div className="flex justify-center gap-4 flex-wrap">
                    <div className="text-white drop-shadow-md">
                      💰 <span className="font-bold">{coinsEarned}</span> Coins
                    </div>
                    <div className="text-white drop-shadow-md">
                      ⚡ <span className="font-bold">{xpEarned}</span> XP
                    </div>
                    <div className="text-white drop-shadow-md">
                      💎 <span className="font-bold">{tokensEarned}</span> Token{tokensEarned !== 1 ? 's' : ''} 
                      {correctAnswers > 0 && ` (${correctAnswers} correct${isPerfect ? ' + 2 perfect bonus!' : ''})`}
                    </div>
                  </div>
                </div>
              )}

              <div className="max-w-md mx-auto">
                <a
                  href="/"
                  className="inline-block bg-white/20 backdrop-blur-lg text-white px-6 py-3 rounded-2xl hover:bg-white/30 transition font-medium shadow-xl border border-white/40"
                >
                  ← Back to Quizzes
                </a>
              </div>
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

          {/* Action Buttons */}
          <div className="mt-8 text-center bg-white/20 backdrop-blur-2xl rounded-3xl shadow-2xl p-6 border border-white/40">
            <div className="flex justify-center gap-4 flex-wrap">
              <a
                href={`/${attempt.quizPost.slug}`}
                className="inline-block bg-black text-white px-6 py-3 rounded-2xl hover:bg-gray-800 transition font-medium shadow-xl"
              >
                Take Quiz Again
              </a>
              <a
                href="/"
                className="inline-block bg-white/20 backdrop-blur-lg text-white px-6 py-3 rounded-2xl hover:bg-white/30 transition font-medium shadow-xl border border-white/40"
              >
                Back to Quizzes
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
