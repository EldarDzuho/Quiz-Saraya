export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">Saraya Quiz</h1>
        <p className="text-lg text-gray-900 mb-8">Quiz as a Post Platform</p>
        <a 
          href="/admin" 
          className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
        >
          Go to Admin
        </a>
      </div>
    </main>
  )
}
