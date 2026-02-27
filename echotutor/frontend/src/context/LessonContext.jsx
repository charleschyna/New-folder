import { createContext, useContext, useReducer, useCallback, useRef } from 'react'
import { aiAPI, lessonsAPI } from '../services/api'
import toast from 'react-hot-toast'

const LessonContext = createContext(null)

const initialState = {
  sessionId:      null,
  topic:          '',
  blocks:         [],
  currentIndex:   0,
  status:         'idle',       // idle | loading | playing | paused | interrupted | ended
  currentSpeech:  '',
  currentWrite:   '',
  isInterrupted:  false,
  greeting:       null,
  history:        [],
}

function lessonReducer(state, action) {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, status: 'loading' }
    case 'SET_BLOCKS':
      return { ...state, blocks: action.blocks, topic: action.topic, status: 'playing', currentIndex: 0 }
    case 'SET_STATUS':
      return { ...state, status: action.status }
    case 'SET_INDEX':
      return { ...state, currentIndex: action.index }
    case 'SET_CURRENT_SPEECH':
      return { ...state, currentSpeech: action.text }
    case 'SET_CURRENT_WRITE':
      return { ...state, currentWrite: action.text }
    case 'SET_SESSION_ID':
      return { ...state, sessionId: action.id }
    case 'SET_GREETING':
      return { ...state, greeting: action.greeting }
    case 'SET_INTERRUPTED':
      return { ...state, isInterrupted: action.value, status: action.value ? 'interrupted' : 'playing' }
    case 'ADD_HISTORY':
      return { ...state, history: [...state.history, action.entry] }
    case 'RESET':
      return { ...initialState, history: state.history }
    default:
      return state
  }
}

export function LessonProvider({ children }) {
  const [state, dispatch] = useReducer(lessonReducer, initialState)

  // Refs for imperative pause/stop during async lesson execution
  const pauseRef    = useRef(false)
  const stopRef     = useRef(false)
  const resumeRef   = useRef(null)   // resolve function to resume

  // ── Fetch greeting ───────────────────────────────────────────────────
  const fetchGreeting = useCallback(async () => {
    try {
      const { data } = await aiAPI.getGreeting()
      dispatch({ type: 'SET_GREETING', greeting: data })
      return data
    } catch (err) {
      console.error('Greeting fetch error:', err)
    }
  }, [])

  // ── Start a new lesson ───────────────────────────────────────────────
  const startLesson = useCallback(async (topic) => {
    dispatch({ type: 'SET_LOADING' })
    stopRef.current  = false
    pauseRef.current = false

    try {
      // 1. Create session
      const sessionRes = await lessonsAPI.createSession({ topic })
      dispatch({ type: 'SET_SESSION_ID', id: sessionRes.data.id })

      // 2. Generate lesson blocks
      const lessonRes = await aiAPI.teach({
        topic,
        session_id: sessionRes.data.id,
      })

      dispatch({ type: 'SET_BLOCKS', blocks: lessonRes.data.blocks, topic })
      dispatch({ type: 'ADD_HISTORY', entry: { role: 'user', content: topic } })
      return lessonRes.data.blocks
    } catch (err) {
      dispatch({ type: 'SET_STATUS', status: 'idle' })
      toast.error('Could not start lesson. Please try again.')
      throw err
    }
  }, [])

  // ── Handle student interruption ──────────────────────────────────────
  const handleInterruption = useCallback(async (question) => {
    dispatch({ type: 'SET_INTERRUPTED', value: true })
    try {
      const { data } = await aiAPI.interrupt({
        question,
        context: state.currentSpeech,
        session_id: state.sessionId,
      })
      dispatch({ type: 'ADD_HISTORY', entry: { role: 'user', content: question } })
      return data.blocks
    } catch (err) {
      console.error('Interruption error:', err)
      return []
    }
  }, [state.currentSpeech, state.sessionId])

  // ── Handle named voice command ───────────────────────────────────────
  const handleCommand = useCallback(async (command) => {
    try {
      const { data } = await aiAPI.command({
        command,
        context: state.currentSpeech,
      })
      return data.blocks
    } catch (err) {
      console.error('Command error:', err)
      return []
    }
  }, [state.currentSpeech])

  // ── Pause / resume / stop ────────────────────────────────────────────
  const pauseLesson  = useCallback(() => {
    pauseRef.current = true
    dispatch({ type: 'SET_STATUS', status: 'paused' })
  }, [])

  const resumeLesson = useCallback(() => {
    pauseRef.current = false
    dispatch({ type: 'SET_INTERRUPTED', value: false })
    if (resumeRef.current) {
      resumeRef.current()
      resumeRef.current = null
    }
  }, [])

  const stopLesson   = useCallback(async () => {
    stopRef.current = true
    if (state.sessionId) {
      try {
        await lessonsAPI.endSession(state.sessionId, {
          duration_seconds: Math.floor(
            (Date.now() - (state._startedAt || Date.now())) / 1000
          ),
        })
      } catch { /* ignore */ }
    }
    dispatch({ type: 'RESET' })
  }, [state.sessionId, state._startedAt])

  const advanceBlock = useCallback((index) => {
    dispatch({ type: 'SET_INDEX', index })
  }, [])

  const setCurrentSpeech = useCallback((text) => {
    dispatch({ type: 'SET_CURRENT_SPEECH', text })
  }, [])

  const setCurrentWrite  = useCallback((text) => {
    dispatch({ type: 'SET_CURRENT_WRITE', text })
  }, [])

  return (
    <LessonContext.Provider value={{
      ...state,
      pauseRef,
      stopRef,
      resumeRef,
      fetchGreeting,
      startLesson,
      handleInterruption,
      handleCommand,
      pauseLesson,
      resumeLesson,
      stopLesson,
      advanceBlock,
      setCurrentSpeech,
      setCurrentWrite,
    }}>
      {children}
    </LessonContext.Provider>
  )
}

export function useLesson() {
  const ctx = useContext(LessonContext)
  if (!ctx) throw new Error('useLesson must be used within LessonProvider')
  return ctx
}
