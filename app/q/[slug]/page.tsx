import { notFound } from 'next/navigation'
import { QuizTaker } from '@/components/quiz/QuizTaker'
import { createSupabaseClient } from '@/lib/supabase'

interface PageProps {
  params: Promise<{ slug: string }>
}

export default async function QuizPage({ params }: PageProps) {
  const { slug } = await params

  const supabase = createSupabaseClient()
  
  const { data: quiz, error } = await supabase
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

  if (error || !quiz) {
    notFound()
  }
  
  // Sort questions and choices
  quiz.questions = (quiz.questions || []).sort((a: any, b: any) => a.order - b.order)
  quiz.questions.forEach((q: any) => {
    q.choices = (q.choices || []).sort((a: any, b: any) => a.order - b.order)
  })

  return <QuizTaker quiz={quiz} />
}
