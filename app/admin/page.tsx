import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { CreateQuizButton } from '@/components/admin/CreateQuizButton'
import { QuizActions } from '@/components/admin/QuizActions'
import { createSupabaseServiceClient } from '@/lib/supabase'
import SignOutButton from '@/components/SignOutButton'

export default async function AdminPage() {
  const session = await getSession()
  
  if (!session) {
    redirect('/auth/login')
  }

  // Use Supabase client instead of Prisma
  const supabase = createSupabaseServiceClient()
  
  const { data: quizzes, error } = await supabase
    .from('QuizPost')
    .select(`
      *,
      questions:Question(count),
      attempts:Attempt(count),
      scoreEntries:ScoreEntry(count)
    `)
    .order('updatedAt', { ascending: false })

  if (error) {
    console.error('Error fetching quizzes:', error)
  }

  // Transform data to match Prisma structure
  const transformedQuizzes = (quizzes || []).map((quiz: any) => ({
    ...quiz,
    questions: quiz.questions || [],
    _count: {
      attempts: quiz.attempts?.[0]?.count || 0,
      scoreEntries: quiz.scoreEntries?.[0]?.count || 0,
    }
  }))

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Quiz Admin</h1>
            <p className="text-gray-900 mt-1">
              Manage your quizzes and view analytics
            </p>
          </div>
          <div className="flex items-center gap-3">
            <CreateQuizButton />
            <SignOutButton />
          </div>
        </div>

        {transformedQuizzes.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <p className="text-gray-800 mb-4">No quizzes yet</p>
              <CreateQuizButton />
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {transformedQuizzes.map((quiz: any) => (
              <Card key={quiz.id}>
                <CardContent className="py-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h2 className="text-xl font-semibold text-gray-900">{quiz.title}</h2>
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${
                            quiz.status === 'PUBLISHED'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {quiz.status}
                        </span>
                      </div>
                      
                      {quiz.description && (
                        <p className="text-gray-900 mb-2">{quiz.description}</p>
                      )}
                      
                      <div className="flex gap-4 text-sm text-gray-800">
                        <span>{quiz.questions.length} questions</span>
                        <span>•</span>
                        <span>{quiz._count.attempts} attempts</span>
                        <span>•</span>
                        <span>{quiz._count.scoreEntries} saved scores</span>
                      </div>
                      
                      {quiz.status === 'PUBLISHED' && quiz.slug && (
                        <div className="mt-2 text-sm text-blue-600">
                          /{quiz.slug}
                        </div>
                      )}
                      
                      <div className="text-xs text-gray-700 mt-2">
                        Updated {new Date(quiz.updatedAt).toLocaleDateString()}
                      </div>
                    </div>
                    
                    <QuizActions
                      quizId={quiz.id}
                      status={quiz.status}
                      slug={quiz.slug}
                      isActive={quiz.isActive || false}
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
