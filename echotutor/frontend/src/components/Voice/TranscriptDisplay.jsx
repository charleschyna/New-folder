import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLesson } from '../../context/LessonContext'

export default function TranscriptDisplay() {
  const { status, isInterrupted } = useLesson()
  const [transcript, setTranscript] = useState([])
  const bottomRef = useRef(null)

  // Subscribe to browser speech recognition events for display
  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) return

    const rec = new SR()
    rec.continuous     = true
    rec.interimResults = true
    rec.lang           = 'en-US'

    let interimId = null

    rec.onresult = (event) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const text = event.results[i][0].transcript
        if (event.results[i].isFinal) {
          setTranscript(prev => {
            // Remove interim, add final
            const filtered = prev.filter(t => !t.interim)
            return [...filtered, { id: Date.now(), text: text.trim(), interim: false, role: 'student' }].slice(-6)
          })
        } else {
          setTranscript(prev => {
            const filtered = prev.filter(t => !t.interim)
            return [...filtered, { id: 'interim', text, interim: true, role: 'student' }]
          })
        }
      }
    }

    rec.onerror = () => {}
    rec.onend   = () => { if (status === 'playing') try { rec.start() } catch {} }

    try { rec.start() } catch {}
    return () => { try { rec.stop() } catch {} }
  }, [status])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [transcript])

  return (
    <div className="space-y-1 text-xs">
      <div className="flex items-center gap-1.5 mb-2">
        <div className={`w-1.5 h-1.5 rounded-full ${status === 'playing' ? 'bg-green-400 animate-pulse' : 'bg-gray-300'}`} />
        <span className="text-gray-400 font-medium text-xs">
          {isInterrupted ? 'Echo is responding to your question…' : 'Voice transcript'}
        </span>
      </div>

      {transcript.length === 0 && (
        <p className="text-gray-300 italic text-xs">Speak naturally — Echo is always listening</p>
      )}

      <AnimatePresence initial={false}>
        {transcript.map((entry) => (
          <motion.div
            key={entry.id}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: entry.interim ? 0.5 : 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`flex items-start gap-2 ${entry.interim ? 'italic' : ''}`}
          >
            <span className="text-echo-400 shrink-0">🎤</span>
            <span className={`text-gray-600 leading-snug ${entry.interim ? 'text-gray-400' : ''}`}>
              {entry.text}
              {entry.interim && <span className="text-echo-300 ml-0.5">…</span>}
            </span>
          </motion.div>
        ))}
      </AnimatePresence>
      <div ref={bottomRef} />
    </div>
  )
}
