import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Mic, MicOff } from 'lucide-react'
import { useLesson } from '../../context/LessonContext'
import { speechService } from '../../services/speechService'

export default function MicrophoneButton() {
  const { status, pauseLesson, resumeLesson } = useLesson()
  const [manuallyMuted, setManuallyMuted] = useState(false)

  const isListening = status === 'playing' && !manuallyMuted
  const isMuted     = manuallyMuted

  const toggle = useCallback(() => {
    if (manuallyMuted) {
      setManuallyMuted(false)
      resumeLesson()
    } else {
      setManuallyMuted(true)
      speechService.stop()
      pauseLesson()
    }
  }, [manuallyMuted, pauseLesson, resumeLesson])

  return (
    <div className="flex flex-col items-center gap-2">
      <motion.button
        onClick={toggle}
        whileTap={{ scale: 0.92 }}
        className={`relative w-16 h-16 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 ${
          isMuted
            ? 'bg-gray-700 text-gray-400'
            : isListening
            ? 'bg-red-500 text-white mic-active'
            : 'bg-echo-500 text-white hover:bg-echo-600'
        }`}
        aria-label={isMuted ? 'Unmute microphone' : 'Mute microphone'}
        aria-pressed={isListening}
      >
        {isMuted ? <MicOff size={24} /> : <Mic size={24} />}

        {/* Ripple rings while listening */}
        <AnimatePresence>
          {isListening && !isMuted && (
            <>
              {[1, 2].map(i => (
                <motion.span
                  key={i}
                  className="absolute inset-0 rounded-full border-2 border-red-400"
                  initial={{ scale: 1, opacity: 0.6 }}
                  animate={{ scale: 1.8 + i * 0.4, opacity: 0 }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.4, ease: 'easeOut' }}
                />
              ))}
            </>
          )}
        </AnimatePresence>
      </motion.button>

      <p className="text-xs text-gray-400 text-center">
        {isMuted    ? 'Muted — tap to speak' :
         isListening ? 'Listening…' :
         'Tap to mute'}
      </p>

      {/* Voice command hint */}
      {isListening && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-xs text-echo-400/80 text-center max-w-[130px] leading-tight"
        >
          Say "repeat", "slower", "example", or ask anything!
        </motion.p>
      )}
    </div>
  )
}
