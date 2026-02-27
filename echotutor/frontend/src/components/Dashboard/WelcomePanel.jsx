import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useLesson } from '../../context/LessonContext'
import { speechService } from '../../services/speechService'

export default function WelcomePanel({ user, history }) {
  const { fetchGreeting } = useLesson()
  const [greeting, setGreeting] = useState('')
  const [spoken,   setSpoken]   = useState(false)

  useEffect(() => {
    if (user && !spoken) {
      loadGreeting()
    }
  }, [user])

  const loadGreeting = async () => {
    try {
      const data = await fetchGreeting()
      const text = data?.greeting || `Hello ${user?.first_name}, welcome to EchoTutor!`
      setGreeting(text)
      // Speak the greeting after a short delay
      setTimeout(() => {
        speechService.speak(text)
        setSpoken(true)
      }, 800)
    } catch {
      const fallback = `Hello ${user?.first_name || 'there'}, welcome back to EchoTutor!`
      setGreeting(fallback)
    }
  }

  const totalMinutes = history.reduce((sum, s) => sum + (s.duration_minutes || 0), 0)
  const totalSessions = history.length
  const streak = Math.min(totalSessions, 7)  // simplified streak

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-3xl shadow-echo p-6 border border-echo-100"
    >
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        {/* Avatar initials */}
        <div className="w-16 h-16 bg-gradient-to-br from-echo-400 to-echo-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-echo shrink-0">
          {user?.first_name?.[0]?.toUpperCase() || '?'}
        </div>

        <div className="flex-1">
          {/* Greeting text */}
          <motion.h2
            key={greeting.slice(0, 30)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-xl font-semibold text-gray-800 leading-snug"
          >
            {greeting || `Hello ${user?.first_name || ''}! 👋`}
          </motion.h2>
          <p className="text-sm text-echo-500 font-medium mt-0.5">
            {user?.preferred_pace === 'slow'   ? '🐢 Slow & steady learner' :
             user?.preferred_pace === 'fast'   ? '🚀 Fast-track learner' :
             '🚶 Balanced learner'} ·{' '}
            {user?.learning_style === 'auditory'    ? '🎧 Auditory style' :
             user?.learning_style === 'visual'      ? '👁️ Visual style' :
             user?.learning_style === 'reading'     ? '📖 Reading style' :
             '✋ Hands-on style'}
          </p>
        </div>

        {/* Stats */}
        <div className="flex gap-4 sm:gap-6 shrink-0">
          <div className="text-center">
            <div className="text-2xl font-bold text-echo-600">{totalSessions}</div>
            <div className="text-xs text-gray-400 whitespace-nowrap">sessions</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-echo-600">{Math.round(totalMinutes)}</div>
            <div className="text-xs text-gray-400 whitespace-nowrap">minutes</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-warm-500">{streak}🔥</div>
            <div className="text-xs text-gray-400 whitespace-nowrap">day streak</div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
