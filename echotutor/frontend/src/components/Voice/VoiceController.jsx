import { useEffect, useRef, useCallback } from 'react'

const COMMANDS = {
  repeat:    /\brepeat\b|\bsay\s+that\s+again\b/i,
  slower:    /\bslower\b|\bslow\s+down\b|\bmore\s+slowly\b/i,
  faster:    /\bfaster\b|\bspeed\s+up\b/i,
  example:   /\b(give\s+me\s+an?\s+)?example\b/i,
  summarize: /\bsummar(ise|ize|y)\b|\brecap\b/i,
  why:       /^\s*why\b/i,
  steps:     /\b(show\s+me\s+the\s+)?steps?\b|\bhow\s+do\s+i\b/i,
}

/**
 * VoiceController
 * ─────────────────────────────────────────────────────────────────────────────
 * Invisible component that manages continuous speech recognition.
 * - Fires onInterruption(transcript) for general speech
 * - Fires onCommand(command, transcript) for named commands
 * - Respects the `active` prop to start/stop listening
 */
export default function VoiceController({ onInterruption, onCommand, active }) {
  const recognitionRef = useRef(null)
  const activeRef      = useRef(active)
  const onInterruptRef = useRef(onInterruption)
  const onCommandRef   = useRef(onCommand)

  useEffect(() => { activeRef.current      = active },       [active])
  useEffect(() => { onInterruptRef.current = onInterruption }, [onInterruption])
  useEffect(() => { onCommandRef.current   = onCommand },     [onCommand])

  const start = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) return

    if (recognitionRef.current) {
      try { recognitionRef.current.stop() } catch {}
    }

    const rec = new SR()
    rec.continuous       = true
    rec.interimResults   = false
    rec.lang             = 'en-US'
    rec.maxAlternatives  = 1

    rec.onresult = (event) => {
      const transcript = Array.from(event.results)
        .slice(event.resultIndex)
        .filter(r => r.isFinal)
        .map(r => r[0].transcript.trim())
        .join(' ')

      if (!transcript || !activeRef.current) return

      // Check for named command first
      for (const [cmd, pattern] of Object.entries(COMMANDS)) {
        if (pattern.test(transcript)) {
          onCommandRef.current?.(cmd, transcript)
          return
        }
      }

      // Otherwise treat as interruption / question
      onInterruptRef.current?.(transcript)
    }

    rec.onerror = (e) => {
      if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
        console.warn('Microphone access denied.')
        return
      }
      // Restart on other errors
      if (activeRef.current) {
        setTimeout(() => { if (activeRef.current) start() }, 1000)
      }
    }

    rec.onend = () => {
      if (activeRef.current) {
        setTimeout(() => { if (activeRef.current) start() }, 300)
      }
    }

    recognitionRef.current = rec
    rec.start()
  }, [])

  const stop = useCallback(() => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop() } catch {}
      recognitionRef.current = null
    }
  }, [])

  useEffect(() => {
    if (active) {
      start()
    } else {
      stop()
    }
    return stop
  }, [active, start, stop])

  return null   // invisible component
}
