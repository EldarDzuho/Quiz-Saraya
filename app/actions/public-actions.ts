'use server'

import { calculateScore } from '@/lib/quiz-utils'
import { hashDeviceId } from '@/lib/crypto'
import { revalidatePath } from 'next/cache'
import { createSupabaseServiceClient } from '@/lib/supabase'
import { createSupabaseServerClient } from '@/lib/supabase'
import { getOrCreateUserAccountId } from './user-actions'

export async function startQuiz(
  slug: string,
  playerName: string,
  deviceId: string
) {
  try {
    const supabase = createSupabaseServiceClient()
    
    const { data: quiz, error: quizError } = await supabase
      .from('QuizPost')
      .select('id')
      .eq('slug', slug)
      .eq('status', 'PUBLISHED')
      .single()
    
    if (quizError || !quiz) {
      console.error('Quiz not found:', quizError)
      return { success: false, error: 'Quiz not found' }
    }
    
    // Get logged in user's email and accountId
    const supabaseAuth = await createSupabaseServerClient()
    const { data: { user } } = await supabaseAuth.auth.getUser()
    
    let accountId: string | null = null
    let playerEmail: string | null = null
    
    if (user?.email) {
      playerEmail = user.email
      accountId = await getOrCreateUserAccountId(user.email, user.user_metadata?.name || playerName)
    }
    
    // Hash device ID for privacy
    const deviceHash = hashDeviceId(deviceId)
    
    // Generate attempt ID
    const { nanoid } = await import('nanoid')
    const attemptId = 'a' + nanoid(24)
    
    // Create attempt (score will be updated on submit)
    const { error: attemptError } = await supabase
      .from('Attempt')
      .insert({
        id: attemptId,
        quizPostId: quiz.id,
        deviceHash,
        playerName,
        playerEmail,
        accountId,
        score: 0,
        maxScore: 0,
        startedAt: new Date().toISOString(),
        finishedAt: null,
      })
    
    if (attemptError) {
      console.error('Attempt creation error:', attemptError)
      return { success: false, error: attemptError.message }
    }
    
    return {
      success: true,
      attemptId,
    }
  } catch (error) {
    console.error('startQuiz error:', error)
    return { success: false, error: 'Failed to start quiz. Please try again.' }
  }
}

export async function submitQuiz(
  attemptId: string,
  slug: string,
  answers: { questionId: string; choiceId: string | null }[]
) {
  try {
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
      console.error('Quiz not found:', quizError)
      return { success: false, error: 'Quiz not found' }
    }
    
    // Verify attempt exists and get accountId
    const { data: attempt, error: attemptError } = await supabase
      .from('Attempt')
      .select('id, accountId, quizPostId')
      .eq('id', attemptId)
      .single()
    
    if (attemptError || !attempt) {
      console.error('Attempt not found:', attemptError)
      return { success: false, error: 'Attempt not found' }
    }
    
    // Sort questions
    quiz.questions = (quiz.questions || []).sort((a: any, b: any) => a.order - b.order)
    
    // Calculate score
    const { score, maxScore } = calculateScore(quiz.questions, answers)
    
    // Update attempt with score and finish time
    const { error: updateError } = await supabase
      .from('Attempt')
      .update({
        score,
        maxScore,
        finishedAt: new Date().toISOString(),
      })
      .eq('id', attemptId)
    
    if (updateError) {
      console.error('Update attempt error:', updateError)
      return { success: false, error: updateError.message }
    }
    
    // Create answers
    const { nanoid } = await import('nanoid')
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
      console.error('Insert answers error:', answersError)
      return { success: false, error: answersError.message }
    }
    
    // Check if user has already completed this quiz before (rewards only once per quiz)
    let alreadyCompleted: boolean = false
    if (attempt.accountId) {
      const { data: previousAttempts } = await supabase
        .from('Attempt')
        .select('id, finishedAt')
        .eq('quizPostId', attempt.quizPostId)
        .eq('accountId', attempt.accountId)
        .not('finishedAt', 'is', null)
        .neq('id', attemptId) // Exclude current attempt
        .limit(1)
      
      alreadyCompleted = !!(previousAttempts && previousAttempts.length > 0)
    }
    
    // Record activity in central account system if user has accountId and hasn't completed before
    if (attempt.accountId && !alreadyCompleted) {
      const { recordQuizCompletion } = await import('@/lib/central-account')
      const recordResult = await recordQuizCompletion(
        attempt.accountId,
        quiz.id,
        score,
        maxScore
      )
      
      if (!recordResult.success) {
        console.error('Failed to record quiz completion:', recordResult.error)
        // Don't fail the whole operation if rewards fail
      }
    }
    
    return {
      success: true,
      attemptId,
      score,
      maxScore,
      alreadyCompleted, // Let the UI know if this was a repeat
    }
  } catch (error) {
    console.error('submitQuiz error:', error)
    return { success: false, error: 'Failed to submit quiz. Please try again.' }
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
  
  // Check if this attempt already has a saved score (attemptId must be unique)
  const { data: existing } = await supabase
    .from('ScoreEntry')
    .select('id')
    .eq('attemptId', attemptId)
    .single()
  
  if (existing) {
    return { success: false, error: 'Score already saved for this attempt' }
  }
  
  // Get accountId for this email
  const accountId = await getOrCreateUserAccountId(email, playerName)
  
  // Hash email for analytics/grouping
  const { hashEmail } = await import('@/lib/crypto')
  const emailHash = hashEmail(email)
  
  // Generate score entry ID
  const { nanoid } = await import('nanoid')
  const scoreId = 's' + nanoid(24)
  
  const { error } = await supabase
    .from('ScoreEntry')
    .insert({
      id: scoreId,
      quizPostId: attempt.quizPostId,
      attemptId: attempt.id,
      deviceHash: attempt.deviceHash,
      accountId,
      name: playerName,
      email,
      emailHash,
      score: attempt.score,
      maxScore: attempt.maxScore,
    })
  
  if (error) {
    return { success: false, error: error.message }
  }
  
  revalidatePath(`/admin/quizzes/${attempt.quizPostId}/scores`)
  return { success: true }
}
