import { notFound } from 'next/navigation'
import { QuizResults } from '@/components/quiz/QuizResults'
import { createSupabaseClient } from '@/lib/supabase'

interface PageProps {
  params: Promise<{ slug: string; attemptId: string }>
}

export default async function ResultsPage({ params }: PageProps) {
  const { slug, attemptId } = await params

  const supabase = createSupabaseClient()
  
  const { data: attempt, error } = await supabase
    .from('Attempt')
    .select(`
      *,
      quizPost:QuizPost(
        *,
        questions:Question(
          *,
          choices:Choice(*)
        )
      ),
      answers:Answer(
        *,
        question:Question(*),
        selectedChoice:Choice(*)
      )
    `)
    .eq('id', attemptId)
    .single()

  if (error || !attempt || attempt.quizPost.slug !== slug) {
    notFound()
  }
  
  // Sort questions
  attempt.quizPost.questions = (attempt.quizPost.questions || []).sort((a: any, b: any) => a.order - b.order)

  return <QuizResults attempt={attempt} />
}
