import { notFound, redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { createSupabaseServiceClient } from '@/lib/supabase'
import { QuizEditorClient } from '@/components/admin/QuizEditorClient'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function EditQuizPage({ params }: PageProps) {
  const { id } = await params
  const session = await getSession()
  
  if (!session) {
    redirect('/auth/login')
  }

  const supabase = createSupabaseServiceClient()
  
  const { data: quiz, error } = await supabase
    .from('QuizPost')
    .select(`
      *,
      questions:Question(
        *,
        choices:Choice(*)
      )
    `)
    .eq('id', id)
    .single()

  if (error || !quiz) {
    notFound()
  }
  
  // Sort questions and choices
  quiz.questions = (quiz.questions || []).sort((a: any, b: any) => a.order - b.order)
  quiz.questions.forEach((q: any) => {
    q.choices = (q.choices || []).sort((a: any, b: any) => a.order - b.order)
  })

  return <QuizEditorClient quiz={quiz} />
}
