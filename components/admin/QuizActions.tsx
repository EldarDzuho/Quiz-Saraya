'use client'

import { Button } from '@/components/ui/Button'
import { deleteQuiz } from '@/app/actions/quiz-actions'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

interface QuizActionsProps {
  quizId: string
  status: string
  slug: string | null
}

export function QuizActions({ quizId, status, slug }: QuizActionsProps) {
  const router = useRouter()
  const [copying, setCopying] = useState(false)

  const handleEdit = () => {
    router.push(`/admin/quizzes/${quizId}/edit`)
  }

  const handleScores = () => {
    router.push(`/admin/quizzes/${quizId}/scores`)
  }

  const handlePreview = () => {
    router.push(`/admin/quizzes/${quizId}/preview`)
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this quiz? This action cannot be undone.')) {
      return
    }
    
    try {
      await deleteQuiz(quizId)
      router.refresh()
    } catch (error) {
      console.error('Failed to delete quiz:', error)
      alert('Failed to delete quiz')
    }
  }

  const handleCopyLink = async () => {
    if (!slug) return
    
    const url = `${window.location.origin}/q/${slug}`
    try {
      await navigator.clipboard.writeText(url)
      setCopying(true)
      setTimeout(() => setCopying(false), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  return (
    <div className="flex gap-2">
      <Button size="sm" onClick={handleEdit}>
        Edit
      </Button>
      <Button size="sm" variant="secondary" onClick={handlePreview}>
        Preview
      </Button>
      {status === 'PUBLISHED' && (
        <>
          <Button size="sm" variant="secondary" onClick={handleScores}>
            Scores
          </Button>
          <Button size="sm" variant="secondary" onClick={handleCopyLink}>
            {copying ? 'Copied!' : 'Copy Link'}
          </Button>
        </>
      )}
      <Button size="sm" variant="danger" onClick={handleDelete}>
        Delete
      </Button>
    </div>
  )
}
