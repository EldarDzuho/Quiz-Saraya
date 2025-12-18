'use client'

import { motion } from 'framer-motion'
import { Star, ArrowRight, LogOut, User } from 'lucide-react'
import Link from 'next/link'
import { AVAILABLE_ICONS } from '@/components/ui/IconPicker'
import { useState } from 'react'
import { UserProfileModal } from '@/components/user/UserProfileModal'
import { createSupabaseClient } from '@/lib/supabase-client'
import { useRouter } from 'next/navigation'

interface Quiz {
  id: string
  title: string
  description: string | null
  slug: string
  icon: string | null
  gradient: string | null
}

interface QuizHomepageClientProps {
  quizzes: Quiz[]
  stats: {
    activeQuizzes: number
    playersOnline: number
    completedToday: number
  }
  user: {
    email: string
    name: string
  }
}

const FloatingShape = ({ delay = 0 }: { delay?: number }) => (
  <motion.div
    className="absolute rounded-full bg-white/10 backdrop-blur-sm"
    initial={{ scale: 0, opacity: 0 }}
    animate={{
      scale: [1, 1.2, 1],
      opacity: [0.3, 0.6, 0.3],
      y: [-20, 20, -20],
    }}
    transition={{
      duration: 8,
      repeat: Infinity,
      delay,
      ease: "easeInOut"
    }}
  />
)

export function QuizHomepageClient({ quizzes, stats, user }: QuizHomepageClientProps) {
  const [showAll, setShowAll] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const displayedQuizzes = showAll ? quizzes : quizzes.slice(0, 4)
  const router = useRouter()

  const handleLogout = async () => {
    const supabase = createSupabaseClient()
    await supabase.auth.signOut()
    router.push('/auth/user-login')
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-purple-600 via-blue-600 to-blue-500">
      {/* Profile Modal */}
      <UserProfileModal
        isOpen={showProfile}
        onClose={() => setShowProfile(false)}
        email={user.email}
        name={user.name}
      />

      {/* Animated background shapes */}
      <div className="absolute top-20 left-20 w-32 h-32">
        <FloatingShape delay={0} />
      </div>
      <div className="absolute top-40 right-32 w-24 h-24">
        <FloatingShape delay={1} />
      </div>
      <div className="absolute bottom-32 left-40 w-40 h-40">
        <FloatingShape delay={3} />
      </div>
      <div className="absolute bottom-20 right-20 w-28 h-28">
        <FloatingShape delay={2.5} />
      </div>

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />

      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 py-12">
        {/* User Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed top-4 right-4 flex items-center gap-2"
        >
          <button
            onClick={() => setShowProfile(true)}
            className="bg-white/20 backdrop-blur-md hover:bg-white/30 transition rounded-2xl p-3 border border-white/30 flex items-center gap-2"
            title="My Profile"
          >
            <User className="w-5 h-5 text-white" />
            <span className="text-white font-medium hidden sm:inline">Profile</span>
          </button>
          <button
            onClick={handleLogout}
            className="bg-white/20 backdrop-blur-md hover:bg-white/30 transition rounded-2xl p-3 border border-white/30"
            title="Sign Out"
          >
            <LogOut className="w-5 h-5 text-white" />
          </button>
        </motion.div>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-center mb-16 mt-16"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2, type: "spring", stiffness: 200 }}
            className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white/20 backdrop-blur-md mb-6"
          >
            <Star className="w-10 h-10 text-yellow-300" fill="currentColor" />
          </motion.div>
          
          <h1 className="text-6xl font-bold text-white mb-4 drop-shadow-lg">
            SarayaQuizzes
          </h1>
          
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-white/90 text-xl"
          >
            By Saraya Solutions
          </motion.p>
        </motion.div>

        {/* Quiz Cards Grid */}
        {quizzes.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center text-white/80 text-lg"
          >
            No active quizzes available at the moment
          </motion.div>
        ) : (
          <>
            <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-2 gap-6 px-4">
              {displayedQuizzes.map((quiz, index) => {
                const iconName = quiz.icon || 'Brain'
                const Icon = AVAILABLE_ICONS.find(i => i.name === iconName)?.component || AVAILABLE_ICONS[0].component
                const gradient = quiz.gradient || 'from-purple-500 to-pink-500'

                return (
                  <motion.div
                    key={quiz.id}
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    whileHover={{ scale: 1.05, y: -5 }}
                    className="group cursor-pointer"
                  >
                    <Link href={`/${quiz.slug}`}>
                      <div className="relative bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-2xl overflow-hidden transition-all duration-300 hover:bg-white/15 hover:border-white/30">
                        {/* Card gradient overlay */}
                        <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-20 transition-opacity duration-300`} />
                        
                        {/* Icon */}
                        <motion.div
                          whileHover={{ rotate: 360 }}
                          transition={{ duration: 0.6 }}
                          className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br ${gradient} mb-6 shadow-lg`}
                        >
                          <Icon className="w-8 h-8 text-white" />
                        </motion.div>

                        {/* Content */}
                        <h3 className="text-2xl font-bold text-white mb-2">
                          {quiz.title}
                        </h3>
                        
                        {quiz.description && (
                          <p className="text-white/80 mb-6">
                            {quiz.description}
                          </p>
                        )}

                        {/* CTA */}
                        <div className="flex items-center text-white group-hover:gap-3 gap-2 transition-all duration-300">
                          <span className="text-white/90">Click to start</span>
                          <motion.div
                            animate={{ x: [0, 5, 0] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                          >
                            <ArrowRight className="w-5 h-5" />
                          </motion.div>
                        </div>

                        {/* Shine effect */}
                        <motion.div
                          className="absolute top-0 -left-full h-full w-1/2 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12"
                          animate={{
                            left: ['-100%', '200%']
                          }}
                          transition={{
                            duration: 3,
                            repeat: Infinity,
                            repeatDelay: 2,
                            ease: "easeInOut"
                          }}
                        />
                      </div>
                    </Link>
                  </motion.div>
                )
              })}
            </div>

            {/* Show All Button */}
            {quizzes.length > 4 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="mt-8"
              >
                <button
                  onClick={() => setShowAll(!showAll)}
                  className="px-8 py-3 bg-white/20 backdrop-blur-md rounded-2xl border border-white/30 text-white font-medium hover:bg-white/30 transition-all"
                >
                  {showAll ? 'Show Less' : `Show All (${quizzes.length})`}
                </button>
              </motion.div>
            )}
          </>
        )}

        {/* Stats Section */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="mt-16 flex flex-wrap justify-center gap-8"
        >
          {[
            { label: 'Active Quizzes', value: stats.activeQuizzes >= 50 ? '50+' : stats.activeQuizzes.toString() },
            { label: 'Total Attempts', value: stats.playersOnline >= 1000 ? `${(stats.playersOnline / 1000).toFixed(1)}K` : stats.playersOnline.toString() },
            { label: 'Completed Today', value: stats.completedToday >= 1000 ? `${(stats.completedToday / 1000).toFixed(1)}K` : stats.completedToday.toString() }
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.7 + index * 0.1 }}
              whileHover={{ scale: 1.1 }}
              className="text-center bg-white/10 backdrop-blur-md rounded-2xl px-8 py-4 border border-white/20"
            >
              <div className="text-white text-3xl font-bold mb-1">{stat.value}</div>
              <div className="text-white/70 text-sm">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>

        {/* Admin Link */}
        {/* <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-12"
        >
          <Link 
            href="/admin" 
            className="text-white/50 hover:text-white/80 transition text-sm"
          >
            Admin Panel
          </Link>
        </motion.div> */}
      </div>
    </div>
  )
}
