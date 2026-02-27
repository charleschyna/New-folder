import { motion } from 'framer-motion'
import { Clock, RotateCcw, CheckCircle } from 'lucide-react'

export default function LearningHistory({ history, onResume }) {
  if (!history || history.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
        <div className="text-4xl mb-3">📚</div>
        <p className="text-gray-500 text-sm">No lessons yet — start your first one above!</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      <div className="divide-y divide-gray-50">
        {history.slice(0, 6).map((session, i) => (
          <motion.div
            key={session.id}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="flex items-center gap-3 p-4 hover:bg-echo-50/50 transition-colors group"
          >
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
              session.status === 'completed' ? 'bg-green-50' : 'bg-echo-50'
            }`}>
              {session.status === 'completed'
                ? <CheckCircle size={18} className="text-green-500" />
                : <Clock size={18} className="text-echo-500" />
              }
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800 truncate">{session.topic}</p>
              <p className="text-xs text-gray-400">
                {session.subject} · {session.duration_minutes}min ·{' '}
                {new Date(session.started_at).toLocaleDateString('en-GB', {
                  day: 'numeric', month: 'short',
                })}
              </p>
            </div>

            <button
              onClick={() => onResume(session.topic)}
              className="opacity-0 group-hover:opacity-100 flex items-center gap-1 text-xs text-echo-500 hover:text-echo-700 font-medium transition-all whitespace-nowrap"
              aria-label={`Resume lesson: ${session.topic}`}
            >
              <RotateCcw size={13} /> Resume
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
