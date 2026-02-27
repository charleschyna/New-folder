import { useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Square, Settings } from 'lucide-react'
import { useLesson } from '../context/LessonContext'
import { useAuth }   from '../context/AuthContext'
import AvatarPlayer  from '../components/Avatar/AvatarPlayer'
import WhiteboardCanvas from '../components/Whiteboard/WhiteboardCanvas'
import VoiceController  from '../components/Voice/VoiceController'
import MicrophoneButton from '../components/Voice/MicrophoneButton'
import TranscriptDisplay from '../components/Voice/TranscriptDisplay'
import { speechService } from '../services/speechService'
import avatarService    from '../services/avatarService'

export default function ClassroomPage() {
  const navigate  = useNavigate()
  const { user }  = useAuth()
  const lesson    = useLesson()

  const {
    blocks, currentIndex, status, topic,
    currentSpeech, currentWrite, isInterrupted,
    pauseRef, stopRef, resumeRef,
    setCurrentSpeech, setCurrentWrite, advanceBlock,
    handleInterruption, handleCommand, resumeLesson, stopLesson,
  } = lesson

  const executingRef   = useRef(false)
  const whiteboardRef  = useRef(null)
  const avatarRef      = useRef(null)
  const interruptQueue = useRef([])

  // ── Redirect if no lesson is loaded ───────────────────────────────────────
  useEffect(() => {
    if (status === 'idle' && blocks.length === 0) {
      navigate('/dashboard')
    }
  }, [status, blocks.length, navigate])

  // ── Execute lesson blocks sequentially ────────────────────────────────────
  const executeBlocks = useCallback(async (blocksToRun, startIndex = 0) => {
    if (executingRef.current) return
    executingRef.current = true

    for (let i = startIndex; i < blocksToRun.length; i++) {
      if (stopRef.current) break

      // Wait if paused
      while (pauseRef.current) {
        await new Promise(resolve => {
          resumeRef.current = resolve
        })
      }
      if (stopRef.current) break

      const block = blocksToRun[i]
      advanceBlock(i)

      switch (block.type) {
        case 'speech':
          setCurrentSpeech(block.content)
          if (avatarRef.current?.isReady()) {
            await avatarRef.current.speak(block.content)
          } else {
            await speechService.speak(block.content, {
              rate: user?.preferred_pace === 'slow'   ? 0.8
                  : user?.preferred_pace === 'fast'   ? 1.15
                  : 0.95,
            })
          }
          break

        case 'write':
          setCurrentWrite(block.content)
          whiteboardRef.current?.writeText(block.content)
          await delay(800)
          break

        case 'draw':
          whiteboardRef.current?.drawDiagram(block.content)
          await delay(1200)
          break

        case 'pause':
          setCurrentSpeech(block.content || 'Does that make sense so far?')
          await speechService.speak(block.content || 'Does that make sense so far?')
          await delay(2000) // Brief pause for student to respond
          break

        default:
          break
      }

      // Small gap between blocks
      await delay(300)
    }

    executingRef.current = false
  }, [advanceBlock, pauseRef, stopRef, resumeRef, setCurrentSpeech, setCurrentWrite, user])

  // ── Pre-fetch D-ID videos for all speech blocks when lesson loads ──────────
  useEffect(() => {
    if (blocks.length > 0) avatarService.prefetchBlocks(blocks)
  }, [blocks])

  // ── Start execution when blocks are available ──────────────────────────────
  useEffect(() => {
    if (blocks.length > 0 && status === 'playing' && !executingRef.current) {
      executeBlocks(blocks, 0)
    }
  }, [blocks, status, executeBlocks])

  // ── Handle voice interruption ──────────────────────────────────────────────
  const onInterruption = useCallback(async (transcript) => {
    if (status === 'loading') return

    speechService.stop()
    pauseRef.current = true

    const responseBlocks = await handleInterruption(transcript)
    if (responseBlocks.length > 0) {
      executingRef.current = false
      await executeBlocks(responseBlocks, 0)
    }

    // Resume main lesson
    pauseRef.current = false
    resumeLesson()
    executingRef.current = false
    await executeBlocks(blocks, currentIndex)
  }, [status, pauseRef, handleInterruption, executeBlocks, resumeLesson, blocks, currentIndex])

  // ── Handle named commands ──────────────────────────────────────────────────
  const onCommand = useCallback(async (command) => {
    speechService.stop()
    pauseRef.current = true

    const responseBlocks = await handleCommand(command)
    if (responseBlocks.length > 0) {
      executingRef.current = false
      await executeBlocks(responseBlocks, 0)
    }

    pauseRef.current = false
    resumeLesson()
    executingRef.current = false
    await executeBlocks(blocks, currentIndex)
  }, [pauseRef, handleCommand, executeBlocks, resumeLesson, blocks, currentIndex])

  // ── Exit classroom ─────────────────────────────────────────────────────────
  const handleExit = async () => {
    speechService.stop()
    await stopLesson()
    navigate('/dashboard')
  }

  // Progress bar
  const progress = blocks.length > 0 ? ((currentIndex + 1) / blocks.length) * 100 : 0

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">

      {/* ── Header bar ─────────────────────────────────────────────────── */}
      <header className="flex items-center justify-between px-4 sm:px-6 py-3 bg-gray-900/90 backdrop-blur border-b border-gray-800 z-10">
        <button
          onClick={handleExit}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm"
        >
          <ArrowLeft size={18} /> Back to Dashboard
        </button>

        <div className="flex-1 mx-6 max-w-sm">
          <div className="text-xs text-gray-400 mb-1 text-center truncate">{topic}</div>
          <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-echo-400 to-echo-500 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
            status === 'playing'     ? 'bg-green-500/20 text-green-400' :
            status === 'paused'      ? 'bg-yellow-500/20 text-yellow-400' :
            status === 'interrupted' ? 'bg-orange-500/20 text-orange-400' :
            status === 'loading'     ? 'bg-blue-500/20 text-blue-400' :
            'bg-gray-500/20 text-gray-400'
          }`}>
            {status === 'loading' ? '⏳ Loading…' :
             status === 'playing' ? '▶ Teaching' :
             status === 'paused'  ? '⏸ Paused' :
             status === 'interrupted' ? '💬 Answering' : '⏹ Idle'}
          </span>
          <button
            onClick={handleExit}
            className="p-1.5 rounded-lg hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-colors"
            aria-label="Stop lesson"
          >
            <Square size={16} />
          </button>
        </div>
      </header>

      {/* ── Main classroom layout ───────────────────────────────────────── */}
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-5 gap-0 overflow-hidden">

        {/* Left panel: Avatar */}
        <div className="lg:col-span-2 bg-gray-900 flex flex-col items-center justify-start p-6 gap-6 border-r border-gray-800">
          <AvatarPlayer
            ref={avatarRef}
            isSpeaking={status === 'playing' || status === 'interrupted'}
            currentSpeech={currentSpeech}
            tutorName={user?.tutor_name || 'Echo'}
          />

          {/* Current speech bubble */}
          <AnimatePresence mode="wait">
            {currentSpeech && (
              <motion.div
                key={currentSpeech.slice(0, 20)}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="w-full bg-gray-800/60 rounded-2xl p-4 text-sm text-gray-200 leading-relaxed border border-gray-700"
              >
                <div className="flex items-start gap-2">
                  <span className="text-echo-400 text-base mt-0.5">💬</span>
                  <p>{currentSpeech}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Microphone */}
          <MicrophoneButton />
        </div>

        {/* Right panel: Whiteboard + Transcript */}
        <div className="lg:col-span-3 flex flex-col bg-white">
          {/* Whiteboard */}
          <div className="flex-1 p-4 sm:p-6 overflow-hidden">
            <WhiteboardCanvas ref={whiteboardRef} currentWrite={currentWrite} />
          </div>

          {/* Voice transcript */}
          <div className="border-t border-gray-100 bg-gray-50 p-4 min-h-[100px] max-h-[140px] overflow-y-auto">
            <TranscriptDisplay />
          </div>
        </div>
      </main>

      {/* ── Hidden voice controller (always listening) ─────────────────── */}
      <VoiceController
        onInterruption={onInterruption}
        onCommand={onCommand}
        active={status === 'playing' || status === 'paused'}
      />
    </div>
  )
}

// Utility
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}
