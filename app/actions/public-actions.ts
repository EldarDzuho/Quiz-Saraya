'use server'

import { calculateScore } from '@/lib/quiz-utils'
import { hashDeviceId } from '@/lib/crypto'
import { revalidatePath } from 'next/cache'
import { createSupabaseServiceClient } from '@/lib/supabase'

export async function submitQuiz(
  slug: string,
  playerName: string,
  deviceId: string,
  answers: { questionId: string; choiceId: string | null }[]
) {
  const supabase = createSupabaseServiceClient()
  
  const { data: quiz, error: quizError } = await supabase
    .from('QuizPost')
    .select(`
      *,
      questions:Question(
        *,
        choices:Choice(*)
      )
    `)
    .eq('slug', slug)
    .eq('status', 'PUBLISHED')
    .single()
  
  if (quizError || !quiz) {
    return { success: false, error: 'Quiz not found' }
  }
  
  // Sort questions
  quiz.questions = (quiz.questions || []).sort((a: any, b: any) => a.order - b.order)
  
  // Calculate score
  const { score, maxScore } = calculateScore(quiz.questions, answers)
  
  // Generate attempt ID
  const { nanoid } = await import('nanoid')
  const attemptId = 'a' + nanoid(24)
  
  // Create attempt
  const { error: attemptError } = await supabase
    .from('Attempt')
    .insert({
      id: attemptId,
      quizPostId: quiz.id,
      playerName,
      score,
      maxScore,
      startedAt: new Date().toISOString(),
      finishedAt: new Date().toISOString(),
    })
  
  if (attemptError) {
    return { success: false, error: attemptError.message }
  }
  
  // Create answers
  const answerRecords = answers.map(answer => ({
    id: 'ans' + nanoid(21),
    attemptId: attemptId,
    questionId: answer.questionId,
    choiceId: answer.choiceId,
  }))
  
  const { error: answersError } = await supabase
    .from('Answer')
    .insert(answerRecords)
  
  if (answersError) {
    return { success: false, error: answersError.message }
  }
  
  return {
    success: true,
    attemptId,
    score,
    maxScore,
  }
}

export async function saveScore(
  attemptId: string,
  playerName: string,
  email: string
) {
  const supabase = createSupabaseServiceClient()
  
  const { data: attempt, error: attemptError } = await supabase
    .from('Attempt')
    .select('*')
    .eq('id', attemptId)
    .single()
  
  if (attemptError || !attempt) {
    return { success: false, error: 'Attempt not found' }
  }
  
  // Check if already saved
  const { data: existing } = await supabase
    .from('ScoreEntry')
    .select('id')
    .eq('quizPostId', attempt.quizPostId)
    .eq('playerName', playerName)
    .eq('score', attempt.score)
    .single()
  
  if (existing) {
    return { success: false, error: 'Score already saved' }
  }
  
  // Generate score entry ID
  const { nanoid } = await import('nanoid')
  const scoreId = 's' + nanoid(24)
  
  const { error } = await supabase
    .from('ScoreEntry')
    .insert({
      id: scoreId,
      quizPostId: attempt.quizPostId,
      playerName,
      score: attempt.score,
      maxScore: attempt.maxScore,
    })
  
  revalidatePath(`/admin/quizzes/${attempt.quizPostId}/scores`)
  return { success: true }
}
