import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { LogOut, Settings, BookOpen, Clock, Star, Zap } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useLesson } from '../context/LessonContext'
import { lessonsAPI } from '../services/api'
import AccessibilityPanel from '../components/Accessibility/AccessibilityPanel'
import SubjectCard from '../components/Dashboard/SubjectCard'
import LearningHistory from '../components/Dashboard/LearningHistory'
import WelcomePanel from '../components/Dashboard/WelcomePanel'

const SUBJECTS = [
  { id: 1, name: 'Mathematics',    icon: '➕', color: '#6C63FF', desc: 'Algebra, calculus, geometry' },
  { id: 2, name: 'Physics',        icon: '⚡', color: '#06b6d4', desc: 'Mechanics, waves, quantum' },
  { id: 3, name: 'Chemistry',      icon: '🧪', color: '#10b981', desc: 'Atoms, bonds, reactions' },
  { id: 4, name: 'Biology',        icon: '🧬', color: '#f59e0b', desc: 'Cells, genetics, evolution' },
  { id: 5, name: 'Computer Science', icon: '💻', color: '#8b5cf6', desc: 'Algorithms, data structures' },
  { id: 6, name: 'History',        icon: '📜', color: '#ef4444', desc: 'World events, civilisations' },
  { id: 7, name: 'Literature',     icon: '📚', color: '#f97316', desc: 'Analysis, writing, poetry' },
  { id: 8, name: 'Economics',      icon: '📈', color: '#14b8a6', desc: 'Micro, macro, markets' },
]

export default function DashboardPage() {
  const { user, logout } = useAuth()
  const { startLesson }  = useLesson()
  const navigate         = useNavigate()

  const [history,    setHistory]    = useState([])
  const [showAccess, setShowAccess] = useState(false)
  const [topicInput, setTopicInput] = useState('')
  const [starting,   setStarting]   = useState(false)

  useEffect(() => {
    lessonsAPI.getHistory()
      .then(({ data }) => setHistory(data))
      .catch(() => {})
  }, [])

  const handleStart = async (topic) => {
    if (!topic.trim()) return
    setStarting(true)
    try {
      await startLesson(topic.trim())
      navigate('/classroom')
    } catch {
      setStarting(false)
    }
  }

  const handleTopicSubmit = (e) => {
    e.preventDefault()
    handleStart(topicInput)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-echo-50 via-white to-calm-50">
      {/* ── Topbar ── */}
      <header className="bg-white/80 backdrop-blur border-b border-echo-100 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-echo-500 rounded-xl flex items-center justify-center">
              <BookOpen size={18} className="text-white" />
            </div>
            <span className="font-bold text-echo-900 text-lg">EchoTutor</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAccess(v => !v)}
              className="p-2 rounded-xl hover:bg-echo-50 transition-colors text-gray-500 hover:text-echo-600"
              aria-label="Accessibility settings"
            >
              <Settings size={20} />
            </button>
            <button
              onClick={logout}
              className="p-2 rounded-xl hover:bg-red-50 transition-colors text-gray-500 hover:text-red-500"
              aria-label="Log out"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">

        {/* ── Welcome panel ── */}
        <WelcomePanel user={user} history={history} />

        {/* ── Ask Echo anything ── */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-r from-echo-500 to-echo-600 rounded-3xl p-6 text-white shadow-echo-lg"
        >
          <div className="flex items-center gap-2 mb-3">
            <Zap size={20} />
            <h2 className="text-lg font-semibold">Ask Echo anything</h2>
          </div>
          <p className="text-echo-100 text-sm mb-4">
            Type a topic or question and Echo will build a personalised lesson for you right now.
          </p>
          <form onSubmit={handleTopicSubmit} className="flex gap-3">
            <input
              type="text"
              value={topicInput}
              onChange={e => setTopicInput(e.target.value)}
              placeholder="e.g. Explain photosynthesis, How does gravity work…"
              className="flex-1 px-4 py-3 rounded-2xl bg-white/20 border border-white/30 text-white placeholder-white/60 focus:outline-none focus:bg-white/30 transition-colors text-sm"
            />
            <motion.button
              type="submit"
              disabled={starting || !topicInput.trim()}
              whileTap={{ scale: 0.95 }}
              className="px-5 py-3 bg-white text-echo-600 font-semibold rounded-2xl hover:bg-echo-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm whitespace-nowrap"
            >
              {starting ? 'Starting…' : 'Start Lesson ✨'}
            </motion.button>
          </form>
        </motion.section>

        {/* ── Subject grid ── */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Star size={18} className="text-echo-500" />
            <h2 className="text-lg font-semibold text-gray-800">Choose a subject</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {SUBJECTS.map((subject, i) => (
              <SubjectCard
                key={subject.id}
                subject={subject}
                index={i}
                onSelect={() => handleStart(subject.name)}
                disabled={starting}
              />
            ))}
          </div>
        </section>

        {/* ── History + Accessibility ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <Clock size={18} className="text-echo-500" />
              <h2 className="text-lg font-semibold text-gray-800">Recent lessons</h2>
            </div>
            <LearningHistory history={history} onResume={(topic) => handleStart(topic)} />
          </div>
          <div>
            <AccessibilityPanel compact />
          </div>
        </div>
      </main>

      {/* Floating accessibility overlay */}
      {showAccess && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4" onClick={() => setShowAccess(false)}>
          <div onClick={e => e.stopPropagation()} className="w-full max-w-sm">
            <AccessibilityPanel onClose={() => setShowAccess(false)} />
          </div>
        </div>
      )}
    </div>
  )
}
