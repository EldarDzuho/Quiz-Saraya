'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { getThemeStyle } from '@/lib/theme'
import { startQuiz, submitQuiz } from '@/app/actions/public-actions'
import { getDeviceIdSync } from '@/lib/device'

interface QuizTakerProps {
  quiz: {
    id: string
    slug: string
    title: string
    description: string | null
    theme: any
    questions: Array<{
      id: string
      text: string
      order: number
      choices: Array<{
        id: string
        text: string
        order: number
      }>
    }>
  }
  user: {
    name: string
    email: string
  } | null
}

export function QuizTaker({ quiz, user }: QuizTakerProps) {
  const router = useRouter()
  const [started, setStarted] = useState(false)
  const [attemptId, setAttemptId] = useState<string | null>(null)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  const themeStyle = getThemeStyle(quiz.theme)
  const playerName = user?.name || 'Guest'

  // Redirect to login if not logged in
  useEffect(() => {
    if (!user) {
      router.push(`/auth/user-login?redirect=/${quiz.slug}`)
    }
  }, [user, router, quiz.slug])

  const handleStart = async () => {
    const deviceId = getDeviceIdSync()
    if (!deviceId) {
      alert('Could not identify device')
      return
    }

    setSubmitting(true)
    try {
      const result = await startQuiz(quiz.slug, playerName, deviceId)
      
      if (result.success && result.attemptId) {
        setAttemptId(result.attemptId)
        setStarted(true)
      } else {
        alert(result.error || 'Failed to start quiz')
      }
    } catch (error) {
      console.error('Start error:', error)
      alert('Failed to start quiz')
    } finally {
      setSubmitting(false)
    }
  }

  const handleAnswerChange = (questionId: string, choiceId: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: choiceId }))
  }

  const handleSubmit = async () => {
    // Check all questions answered
    const unanswered = quiz.questions.filter(q => !answers[q.id])
    if (unanswered.length > 0) {
      alert(`Please answer all questions. ${unanswered.length} remaining.`)
      return
    }

    if (!attemptId) {
      alert('Invalid attempt')
      return
    }

    setSubmitting(true)
    try {
      const answersArray = Object.entries(answers).map(([questionId, choiceId]) => ({
        questionId,
        choiceId,
      }))

      const result = await submitQuiz(attemptId, quiz.slug, answersArray)
      
      if (result.success) {
        // Pass along the alreadyCompleted flag via URL params
        const url = `/${quiz.slug}/results/${result.attemptId}${result.alreadyCompleted ? '?repeat=true' : ''}`
        router.push(url)
      } else {
        alert(result.error || 'Failed to submit quiz')
        setSubmitting(false)
      }
    } catch (error) {
      console.error('Submit error:', error)
      alert('Failed to submit quiz')
      setSubmitting(false)
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen" style={themeStyle}>
        <div className="min-h-screen bg-black bg-opacity-30 flex items-center justify-center p-4">
          <div className="bg-white/20 backdrop-blur-2xl rounded-3xl shadow-2xl p-8 max-w-md w-full border border-white/40">
            <h1 className="text-3xl font-bold mb-4 text-center text-white drop-shadow-lg">Loading...</h1>
            <p className="text-white text-center drop-shadow-md">Redirecting to login...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!started) {
    return (
      <div className="min-h-screen" style={themeStyle}>
        <div className="min-h-screen bg-black bg-opacity-30 flex items-center justify-center p-4">
          <div className="bg-white/20 backdrop-blur-2xl rounded-3xl shadow-2xl p-8 max-w-md w-full border border-white/40">
            <h1 className="text-3xl font-bold mb-4 text-center text-white drop-shadow-lg">{quiz.title}</h1>
            {quiz.description && (
              <p className="text-white mb-6 text-center drop-shadow-md">{quiz.description}</p>
            )}
            <div className="mb-6 text-center">
              <p className="text-white drop-shadow-md">Playing as</p>
              <p className="text-xl font-bold text-white drop-shadow-lg">{playerName}</p>
            </div>
            <Button onClick={handleStart} disabled={submitting} className="w-full" size="lg">
              {submitting ? 'Starting...' : 'Start Quiz'}
            </Button>
            <p className="text-sm text-white text-center mt-4 drop-shadow-md">
              {quiz.questions.length} questions
            </p>
          </div>
        </div>
      </div>
    )
  }

  const answeredCount = Object.keys(answers).length
  const progress = (answeredCount / quiz.questions.length) * 100

  return (
    <div className="min-h-screen" style={themeStyle}>
      <div className="min-h-screen bg-black bg-opacity-30">
        <div className="max-w-3xl mx-auto px-4 py-8">
          {/* Progress Bar */}
          <div className="bg-white/20 backdrop-blur-2xl rounded-3xl shadow-2xl p-4 mb-6 border border-white/40">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-white drop-shadow-md">
                Progress: {answeredCount} / {quiz.questions.length}
              </span>
              <span className="text-sm font-medium text-white drop-shadow-md">
                {Math.round(progress)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Questions */}
          <div className="space-y-6">
            {quiz.questions.map((question, qIndex) => (
              <div key={question.id} className="bg-white/20 backdrop-blur-2xl rounded-3xl shadow-2xl p-6 border border-white/40">
                <h2 className="text-xl font-semibold mb-4 text-white drop-shadow-md">
                  {qIndex + 1}. {question.text}
                </h2>
                <div className="space-y-3">
                  {question.choices
                    .sort((a, b) => a.order - b.order)
                    .map((choice, cIndex) => {
                      const isSelected = answers[question.id] === choice.id
                      return (
                        <label
                          key={choice.id}
                          className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition ${
                            isSelected
                              ? 'border-blue-500'
                              : 'border-white/30 hover:border-white/50'
                          }`}
                        >
                          <input
                            type="radio"
                            name={`question-${question.id}`}
                            value={choice.id}
                            checked={isSelected}
                            onChange={() => handleAnswerChange(question.id, choice.id)}
                            className="w-4 h-4 text-blue-600"
                          />
                          <span className={`font-medium mx-3 ${isSelected ? 'text-blue-500' : 'text-white'}`}>
                            {String.fromCharCode(65 + cIndex)}.
                          </span>
                          <span className={`flex-1 ${isSelected ? 'text-blue-500' : 'text-white'}`}>{choice.text}</span>
                        </label>
                      )
                    })}
                </div>
              </div>
            ))}
          </div>

          {/* Submit Button */}
          <div className="mt-8 bg-white/20 backdrop-blur-2xl rounded-3xl shadow-2xl p-6 border border-white/40">
            <Button
              onClick={handleSubmit}
              disabled={submitting || answeredCount < quiz.questions.length}
              className="w-full"
              size="lg"
            >
              {submitting
                ? 'Submitting...'
                : answeredCount < quiz.questions.length
                ? `Answer all questions (${quiz.questions.length - answeredCount} remaining)`
                : 'Submit Quiz'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
