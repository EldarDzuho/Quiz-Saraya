'use server'

import { requireAdmin } from '@/lib/auth'
import { validateQuizForPublish, generateUniqueSlug } from '@/lib/quiz-utils'
import { revalidatePath } from 'next/cache'
import { createSupabaseServiceClient } from '@/lib/supabase'

export async function createQuiz(title: string) {
  const session = await requireAdmin()
  const supabase = createSupabaseServiceClient()
  
  // Generate a unique ID (cuid-like)
  const { nanoid } = await import('nanoid')
  const quizId = 'c' + nanoid(24)
  
  const { data: quiz, error } = await supabase
    .from('QuizPost')
    .insert({
      id: quizId,
      title,
      authorId: session.user.id,
      authorEmail: session.user.email || undefined,
      status: 'DRAFT',
      theme: {},
    })
    .select()
    .single()
  
  if (error) {
    console.error('Error creating quiz:', error)
    return { success: false, error: error.message }
  }
  
  revalidatePath('/admin')
  return { success: true, quizId: quiz.id }
}

export async function updateQuizMeta(
  quizId: string,
  data: { title?: string; description?: string; theme?: any }
) {
  await requireAdmin()
  const supabase = createSupabaseServiceClient()
  
  // If title is changing and quiz is published, regenerate slug
  let newSlug: string | undefined
  if (data.title) {
    const { data: currentQuiz } = await supabase
      .from('QuizPost')
      .select('status, slug')
      .eq('id', quizId)
      .single()
    
    if (currentQuiz?.status === 'PUBLISHED') {
      newSlug = await generateUniqueSlug(data.title, quizId)
    }
  }
  
  const updateData: any = {
    title: data.title,
    description: data.description,
    theme: data.theme,
    updatedAt: new Date().toISOString(),
  }
  
  if (newSlug) {
    updateData.slug = newSlug
  }
  
  const { error } = await supabase
    .from('QuizPost')
    .update(updateData)
    .eq('id', quizId)
  
  if (error) {
    console.error('Error updating quiz:', error)
    return { success: false, error: error.message }
  }
  
  revalidatePath('/admin')
  revalidatePath(`/admin/quizzes/${quizId}/edit`)
  return { success: true }
}

export async function deleteQuiz(quizId: string) {
  await requireAdmin()
  const supabase = createSupabaseServiceClient()
  
  const { error } = await supabase
    .from('QuizPost')
    .delete()
    .eq('id', quizId)
  
  if (error) {
    console.error('Error deleting quiz:', error)
    return { success: false, error: error.message }
  }
  
  revalidatePath('/admin')
  return { success: true }
}

export async function publishQuiz(quizId: string) {
  await requireAdmin()
  const supabase = createSupabaseServiceClient()
  
  // Fetch quiz with questions and choices
  const { data: quiz, error: quizError } = await supabase
    .from('QuizPost')
    .select(`
      *,
      questions:Question(
        *,
        choices:Choice(*)
      )
    `)
    .eq('id', quizId)
    .single()
  
  if (quizError || !quiz) {
    return { success: false, error: 'Quiz not found' }
  }
  
  const errors = validateQuizForPublish(quiz as any)
  if (errors.length > 0) {
    return { success: false, errors }
  }
  
  const slug = await generateUniqueSlug(quiz.title)
  
  const { error } = await supabase
    .from('QuizPost')
    .update({
      status: 'PUBLISHED',
      slug,
      publishedAt: new Date().toISOString(),
    })
    .eq('id', quizId)
  
  if (error) {
    return { success: false, error: error.message }
  }
  
  revalidatePath('/admin')
  revalidatePath(`/admin/quizzes/${quizId}/edit`)
  return { success: true, slug }
}

export async function unpublishQuiz(quizId: string) {
  await requireAdmin()
  const supabase = createSupabaseServiceClient()
  
  const { error } = await supabase
    .from('QuizPost')
    .update({ status: 'DRAFT' })
    .eq('id', quizId)
  
  if (error) {
    return { success: false, error: error.message }
  }
  
  revalidatePath('/admin')
  revalidatePath(`/admin/quizzes/${quizId}/edit`)
  return { success: true }
}

export async function addQuestion(quizId: string, text: string) {
  await requireAdmin()
  const supabase = createSupabaseServiceClient()
  
  // Get max order
  const { data: questions } = await supabase
    .from('Question')
    .select('order')
    .eq('quizPostId', quizId)
    .order('order', { ascending: false })
    .limit(1)
  
  const maxOrder = questions && questions.length > 0 ? questions[0].order : -1
  
  // Generate a unique ID
  const { nanoid } = await import('nanoid')
  const questionId = 'q' + nanoid(24)
  
  const { data: question, error } = await supabase
    .from('Question')
    .insert({
      id: questionId,
      quizPostId: quizId,
      text,
      order: maxOrder + 1,
      type: 'MULTIPLE_CHOICE',
      points: 1,
    })
    .select()
    .single()
  
  if (error) {
    return { success: false, error: error.message }
  }
  
  revalidatePath(`/admin/quizzes/${quizId}/edit`)
  return { success: true, questionId: question.id }
}

export async function updateQuestion(
  questionId: string,
  data: { text?: string; points?: number }
) {
  await requireAdmin()
  const supabase = createSupabaseServiceClient()
  
  const { data: question, error } = await supabase
    .from('Question')
    .update({
      text: data.text,
      points: data.points,
      updatedAt: new Date().toISOString(),
    })
    .eq('id', questionId)
    .select()
    .single()
  
  if (error) {
    return { success: false, error: error.message }
  }
  
  revalidatePath(`/admin/quizzes/${question.quizPostId}/edit`)
  return { success: true }
}

export async function deleteQuestion(questionId: string) {
  await requireAdmin()
  const supabase = createSupabaseServiceClient()
  
  const { data: question } = await supabase
    .from('Question')
    .select('quizPostId')
    .eq('id', questionId)
    .single()
  
  if (!question) {
    return { success: false, error: 'Question not found' }
  }
  
  const { error } = await supabase
    .from('Question')
    .delete()
    .eq('id', questionId)
  
  if (error) {
    return { success: false, error: error.message }
  }
  
  revalidatePath(`/admin/quizzes/${question.quizPostId}/edit`)
  return { success: true }
}

export async function reorderQuestions(quizId: string, questionIds: string[]) {
  await requireAdmin()
  const supabase = createSupabaseServiceClient()
  
  for (let i = 0; i < questionIds.length; i++) {
    await supabase
      .from('Question')
      .update({ order: i })
      .eq('id', questionIds[i])
  }
  
  revalidatePath(`/admin/quizzes/${quizId}/edit`)
  return { success: true }
}

export async function addChoice(questionId: string, text: string) {
  await requireAdmin()
  const supabase = createSupabaseServiceClient()
  
  const { data: question } = await supabase
    .from('Question')
    .select('*, choices:Choice(*)')
    .eq('id', questionId)
    .single()
  
  if (!question) {
    return { success: false, error: 'Question not found' }
  }
  
  // Enforce max 6 choices
  if (question.choices && question.choices.length >= 6) {
    return { success: false, error: 'Maximum 6 choices allowed' }
  }
  
  const maxOrder = question.choices && question.choices.length > 0
    ? Math.max(...question.choices.map((c: any) => c.order))
    : -1
  
  // Generate a unique ID
  const { nanoid } = await import('nanoid')
  const choiceId = 'ch' + nanoid(24)
  
  const { data: choice, error } = await supabase
    .from('Choice')
    .insert({
      id: choiceId,
      questionId,
      text,
      order: maxOrder + 1,
      isCorrect: false,
    })
    .select()
    .single()
  
  if (error) {
    return { success: false, error: error.message }
  }
  
  revalidatePath(`/admin/quizzes/${question.quizPostId}/edit`)
  return { success: true, choiceId: choice.id }
}

export async function updateChoice(
  choiceId: string,
  data: { text?: string; isCorrect?: boolean }
) {
  await requireAdmin()
  const supabase = createSupabaseServiceClient()
  
  const { data: choice } = await supabase
    .from('Choice')
    .select('*, question:Question!inner(*)')
    .eq('id', choiceId)
    .single()
  
  if (!choice) {
    return { success: false, error: 'Choice not found' }
  }
  
  // If marking as correct, unmark all other choices for this question
  if (data.isCorrect === true) {
    await supabase
      .from('Choice')
      .update({ isCorrect: false })
      .eq('questionId', choice.questionId)
  }
  
  const { error } = await supabase
    .from('Choice')
    .update({
      text: data.text,
      isCorrect: data.isCorrect,
      updatedAt: new Date().toISOString(),
    })
    .eq('id', choiceId)
  
  if (error) {
    return { success: false, error: error.message }
  }
  
  revalidatePath(`/admin/quizzes/${choice.question.quizPostId}/edit`)
  return { success: true }
}

export async function deleteChoice(choiceId: string) {
  await requireAdmin()
  const supabase = createSupabaseServiceClient()
  
  const { data: choice } = await supabase
    .from('Choice')
    .select('*, question:Question!inner(*)')
    .eq('id', choiceId)
    .single()
  
  if (!choice) {
    return { success: false, error: 'Choice not found' }
  }
  
  const { error } = await supabase
    .from('Choice')
    .delete()
    .eq('id', choiceId)
  
  if (error) {
    return { success: false, error: error.message }
  }
  
  revalidatePath(`/admin/quizzes/${choice.question.quizPostId}/edit`)
  return { success: true }
}
