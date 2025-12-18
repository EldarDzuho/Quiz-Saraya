import { createSupabaseServiceClient, createSupabaseServerClient } from '@/lib/supabase'
import { QuizHomepageClient } from '@/components/quiz/QuizHomepageClient'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function Home() {
  // Check if user is authenticated
  const supabaseAuth = await createSupabaseServerClient()
  const { data: { user } } = await supabaseAuth.auth.getUser()
  
  // Redirect to login if not authenticated
  if (!user) {
    redirect('/auth/user-login?redirect=/')
  }

  // User is authenticated through central account system
  // Account already exists in central system (created during registration)

  const supabase = createSupabaseServiceClient()
  
  const { data: quizzes, error: quizzesError } = await supabase
    .from('QuizPost')
    .select('id, title, description, slug, icon, gradient')
    .eq('status', 'PUBLISHED')
    .eq('isActive', true)
    .order('createdAt', { ascending: false })

  if (quizzesError) {
    console.error('Failed to fetch quizzes:', quizzesError)
  }

  // Get stats
  const { data: allAttempts, error: attemptsError } = await supabase
    .from('Attempt')
    .select('id, finishedAt')

  if (attemptsError) {
    console.error('Failed to fetch attempts:', attemptsError)
  }

  // Calculate stats
  const activeQuizzes = quizzes?.length || 0
  const totalAttempts = allAttempts?.length || 0
  
  // Completed today (attempts finished today)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const completedToday = allAttempts?.filter((attempt: any) => 
    attempt.finishedAt && new Date(attempt.finishedAt) >= today
  ).length || 0

  return (
    <QuizHomepageClient 
      quizzes={quizzes || []}
      stats={{
        activeQuizzes,
        playersOnline: totalAttempts,
        completedToday
      }}
      user={{
        email: user.email!,
        name: user.user_metadata?.name || user.email!.split('@')[0]
      }}
    />
  )
}
