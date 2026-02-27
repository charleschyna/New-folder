import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { SimliClient, generateSimliSessionToken, generateIceServers } from 'simli-client'

const SIMLI_KEY     = import.meta.env.VITE_SIMLI_API_KEY
const SIMLI_FACE_ID = import.meta.env.VITE_SIMLI_FACE_ID || '5514e24d-6086-46a3-ace4-6a7264e5cb7c'
const EL_KEY        = import.meta.env.VITE_ELEVENLABS_API_KEY
const EL_VOICE      = import.meta.env.VITE_ELEVENLABS_VOICE_ID || 'Xb7hH8MSUJpSbSDYk0k2'
const PHOTO_URL     = '/tutor.jpg'

//  Fetch audio from ElevenLabs as raw ArrayBuffer 
async function fetchElevenLabsAudio(text) {
  if (!EL_KEY) return null
  const res = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${EL_VOICE}/stream`,
    {
      method: 'POST',
      headers: { 'xi-api-key': EL_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text,
        model_id: 'eleven_turbo_v2_5',
        voice_settings: { stability: 0.5, similarity_boost: 0.8 },
      }),
    }
  )
  if (!res.ok) return null
  return res.arrayBuffer()
}

//  Decode MP3  resample to 16kHz  PCM16 Uint8Array 
async function mp3ToPcm16(arrayBuffer) {
  const audioCtx = new AudioContext()
  const decoded  = await audioCtx.decodeAudioData(arrayBuffer.slice(0))
  await audioCtx.close()

  const TARGET_RATE = 16000
  const offCtx = new OfflineAudioContext(
    1,
    Math.ceil(decoded.duration * TARGET_RATE),
    TARGET_RATE
  )
  const src = offCtx.createBufferSource()
  src.buffer = decoded
  src.connect(offCtx.destination)
  src.start(0)
  const resampled = await offCtx.startRendering()

  const f32  = resampled.getChannelData(0)
  const i16  = new Int16Array(f32.length)
  for (let i = 0; i < f32.length; i++) {
    i16[i] = Math.max(-32768, Math.min(32767, Math.round(f32[i] * 32768)))
  }
  return new Uint8Array(i16.buffer)
}

//  AvatarPlayer 
const AvatarPlayer = forwardRef(function AvatarPlayer(
  { isSpeaking, currentSpeech, tutorName = 'Echo' },
  ref
) {
  const videoRef  = useRef(null)
  const audioRef  = useRef(null)
  const clientRef = useRef(null)

  // phases: boot | connecting | ready | speaking | error | no-key
  const [phase,    setPhase]    = useState(SIMLI_KEY ? 'boot' : 'no-key')
  const [imgError, setImgError] = useState(false)

  //  Initialise Simli WebRTC session on mount 
  useEffect(() => {
    if (!SIMLI_KEY) return
    let cancelled = false

    ;(async () => {
      setPhase('connecting')
      try {
        const [{ session_token }, iceServers] = await Promise.all([
          generateSimliSessionToken({
            apiKey: SIMLI_KEY,
            config: {
              faceId:           SIMLI_FACE_ID,
              handleSilence:    true,
              maxSessionLength: 600,
              maxIdleTime:      180,
            },
          }),
          generateIceServers(SIMLI_KEY),
        ])
        if (cancelled) return

        const client = new SimliClient(
          session_token,
          videoRef.current,
          audioRef.current,
          iceServers
        )
        clientRef.current = client

        client.on('start',         () => { if (!cancelled) setPhase('ready')    })
        client.on('speaking',      () => { if (!cancelled) setPhase('speaking') })
        client.on('silent',        () => { if (!cancelled) setPhase('ready')    })
        client.on('error',         () => { if (!cancelled) setPhase('error')    })
        client.on('startup_error', () => { if (!cancelled) setPhase('error')    })

        await client.start()
      } catch (err) {
        console.warn('[Simli] init error:', err)
        if (!cancelled) setPhase('error')
      }
    })()

    return () => {
      cancelled = true
      clientRef.current?.stop().catch(() => {})
      clientRef.current = null
    }
  }, [])

  //  Expose isReady() + speak() to ClassroomPage 
  useImperativeHandle(ref, () => ({
    isReady: () => phase === 'ready',

    speak: async (text) => {
      const client = clientRef.current
      if (!client || phase !== 'ready') return

      const buffer = await fetchElevenLabsAudio(text)
      if (!buffer) return

      const pcm16 = await mp3ToPcm16(buffer)
      client.sendAudioData(pcm16)

      // Resolve when avatar goes silent (or after duration + buffer)
      const durationMs = (pcm16.length / 2 / 16000) * 1000 + 1500
      await new Promise(resolve => {
        let done = false
        const finish = () => { if (!done) { done = true; resolve() } }
        client.on('silent', function onSilent() {
          client.off('silent', onSilent)
          finish()
        })
        setTimeout(finish, durationMs)
      })
    },
  }), [phase])

  const isConnecting = phase === 'boot' || phase === 'connecting'
  const isLive       = phase === 'ready' || phase === 'speaking'
  const showFallback = phase === 'no-key' || phase === 'error'
  const isTalking    = phase === 'speaking' || (isSpeaking && showFallback)

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      <div className="relative flex items-center justify-center">

        {/* Pulsing rings while speaking */}
        <AnimatePresence>
          {isTalking && (
            <>
              <motion.div key="r1"
                initial={{ opacity: 0 }} exit={{ opacity: 0 }}
                animate={{ opacity: [0.4, 0.1, 0.4], scale: [1, 1.18, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute rounded-full border-2 border-echo-400/40"
                style={{ width: 280, height: 280 }}
              />
              <motion.div key="r2"
                initial={{ opacity: 0 }} exit={{ opacity: 0 }}
                animate={{ opacity: [0.6, 0.2, 0.6], scale: [1, 1.08, 1] }}
                transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut', delay: 0.25 }}
                className="absolute rounded-full border border-echo-300/40"
                style={{ width: 248, height: 248 }}
              />
            </>
          )}
        </AnimatePresence>

        {/* Portrait frame: tall rect for live Simli, circle for fallback */}
        <div className={`relative overflow-hidden shadow-2xl z-10 border-4 transition-all duration-500 ${
          isLive || isConnecting
            ? 'rounded-2xl border-echo-400/80 shadow-echo-500/20 w-52 h-72'
            : 'rounded-full border-echo-500/50 shadow-black/60 w-44 h-44'
        }`}>

          {/*  Simli WebRTC video stream  */}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${
              isLive ? 'opacity-100' : 'opacity-0'
            }`}
          />

          {/* Hidden audio element Simli uses for playback */}
          <audio ref={audioRef} autoPlay className="hidden" />

          {/*  Connecting spinner  */}
          {isConnecting && (
            <div className="absolute inset-0 bg-gray-950 flex flex-col items-center justify-center gap-3">
              <svg className="w-12 h-12 -rotate-90" viewBox="0 0 48 48">
                <circle cx="24" cy="24" r="19" fill="none"
                  stroke="rgba(139,92,246,0.15)" strokeWidth="4"/>
                <circle cx="24" cy="24" r="19" fill="none" stroke="#a78bfa" strokeWidth="4"
                  strokeDasharray="119" strokeDashoffset="89" strokeLinecap="round"
                  className="animate-spin origin-center" style={{ animationDuration: '1s' }}/>
              </svg>
              <span className="text-echo-300 text-xs px-4 text-center leading-relaxed">
                Starting AI Tutor
              </span>
            </div>
          )}

          {/*  Static photo fallback (no key / error)  */}
          {showFallback && (
            !imgError ? (
              <img src={PHOTO_URL} alt={tutorName}
                className="absolute inset-0 w-full h-full object-cover object-top"
                onError={() => setImgError(true)} />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-400 via-purple-500 to-echo-600 flex items-center justify-center">
                <svg viewBox="0 0 80 80" className="w-20 h-20 opacity-90" fill="none">
                  <circle cx="40" cy="30" r="16" fill="white" fillOpacity="0.9"/>
                  <ellipse cx="40" cy="68" rx="26" ry="18" fill="white" fillOpacity="0.9"/>
                </svg>
              </div>
            )
          )}
        </div>

        {/* Status badge */}
        <div className={`absolute -bottom-1.5 -right-1.5 z-20 px-2 py-0.5 rounded-full text-[9px] font-bold shadow-lg transition-all ${
          phase === 'speaking'  ? 'bg-green-500 text-white'  :
          phase === 'ready'     ? 'bg-echo-500 text-white'   :
          isConnecting          ? 'bg-yellow-500 text-white' :
                                  'bg-gray-700 text-gray-400'
        }`}>
          {phase === 'speaking' ? ' LIVE' :
           phase === 'ready'    ? ' ON'   :
           isConnecting         ? ' AI'  : ''}
        </div>
      </div>

      {/* Name + status bar */}
      <div className="text-center">
        <p className="text-white font-semibold text-base tracking-wide">{tutorName}</p>
        <div className="flex items-center justify-center gap-1.5 mt-1">
          {isTalking ? (
            <>
              <div className="flex items-end gap-0.5 h-5 text-echo-400">
                {[8, 14, 20, 16, 10].map((h, i) => (
                  <div key={i} className="waveform-bar"
                    style={{ height: h, animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
              <span className="text-echo-400 text-xs font-medium">Speaking</span>
            </>
          ) : phase === 'ready' ? (
            <span className="text-green-400 text-xs">AI Tutor  Live</span>
          ) : isConnecting ? (
            <span className="text-yellow-400 text-xs animate-pulse">Connecting</span>
          ) : (
            <span className="text-gray-500 text-xs">AI Tutor  Ready</span>
          )}
        </div>
      </div>
    </div>
  )
})

export default AvatarPlayer