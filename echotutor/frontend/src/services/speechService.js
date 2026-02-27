/**
 * SpeechService
 * ─────────────────────────────────────────────────────────────────────────────
 * Text-to-Speech with ElevenLabs as primary (human-quality voice) and
 * Web Speech Synthesis as silent fallback.
 *
 * Flow:
 *   1. If VITE_ELEVENLABS_API_KEY is set → stream audio from ElevenLabs API
 *   2. Otherwise → fall back to browser SpeechSynthesis
 *
 * Public API (unchanged so callers need no edits):
 *   speak(text, options)  → Promise<void>
 *   stop()
 *   pause()
 *   resume()
 *   isSpeaking            (getter)
 *   setRate(rate)
 *   onSpeakStart(fn)
 *   onSpeakEnd(fn)
 */

const EL_KEY     = import.meta.env.VITE_ELEVENLABS_API_KEY || ''
const EL_VOICE   = import.meta.env.VITE_ELEVENLABS_VOICE_ID || 'Xb7hH8MSUJpSbSDYk0k2'  // Alice — Clear, Engaging Educator
const EL_BASE    = 'https://api.elevenlabs.io/v1'
const HAS_EL     = Boolean(EL_KEY)

class SpeechService {
  constructor() {
    // Browser fallback
    this._synth          = window.speechSynthesis || null
    this._utterance      = null
    this._voices         = []
    this._preferredVoice = null

    // ElevenLabs playback state
    this._audioEl        = null      // <audio> element for EL streaming

    this._rate           = 0.95
    this._pitch          = 1.0
    this._volume         = 1.0
    this._speaking       = false

    this._onSpeakStart   = null
    this._onSpeakEnd     = null

    if (this._synth) {
      this._loadVoices()
      this._synth.addEventListener('voiceschanged', () => this._loadVoices())
    }
  }

  // ── Browser voice setup ───────────────────────────────────────────────────
  _loadVoices() {
    this._voices = this._synth.getVoices()
    this._preferredVoice =
      this._voices.find(v => v.lang.startsWith('en') &&
        /female|zira|hazel|susan|samantha|karen|victoria/i.test(v.name)) ||
      this._voices.find(v => v.lang.startsWith('en-US')) ||
      this._voices.find(v => v.lang.startsWith('en')) ||
      this._voices[0] || null
  }

  // ── Main speak entry point ────────────────────────────────────────────────
  speak(text, options = {}) {
    if (!text?.trim()) return Promise.resolve()
    this.stop()
    this._speaking = true
    this._onSpeakStart?.()

    if (HAS_EL) {
      return this._speakElevenLabs(text, options)
    }
    return this._speakBrowser(text, options)
  }

  // ── ElevenLabs TTS ────────────────────────────────────────────────────────
  async _speakElevenLabs(text, options = {}) {
    const rate       = options.rate ?? this._rate
    // Map speaking rate to ElevenLabs stability (slower = more stable/deliberate)
    const stability  = Math.max(0.3, Math.min(1.0, 1.0 - (rate - 0.7) * 0.4))

    try {
      const res = await fetch(
        `${EL_BASE}/text-to-speech/${EL_VOICE}/stream`,
        {
          method: 'POST',
          headers: {
            'xi-api-key':   EL_KEY,
            'Content-Type': 'application/json',
            'Accept':       'audio/mpeg',
          },
          body: JSON.stringify({
            text,
            model_id: 'eleven_turbo_v2_5',
            voice_settings: {
              stability,
              similarity_boost: 0.85,
              style: 0.35,
              use_speaker_boost: true,
            },
          }),
        }
      )

      if (!res.ok) {
        const errText = await res.text().catch(() => String(res.status))
        console.warn(`ElevenLabs ${res.status}: ${errText} — falling back to browser TTS`)
        return this._speakBrowser(text, options)
      }

      const blob = await res.blob()
      const url  = URL.createObjectURL(blob)

      return new Promise((resolve) => {
        const audio    = new Audio(url)
        audio.volume   = options.volume ?? this._volume
        this._audioEl  = audio

        const cleanup  = () => {
          URL.revokeObjectURL(url)
          this._speaking = false
          this._audioEl  = null
          this._onSpeakEnd?.()
          resolve()
        }

        audio.onended = cleanup
        audio.onerror = cleanup

        audio.play().catch(() => {
          // Autoplay policy blocked — fall back to browser TTS
          URL.revokeObjectURL(url)
          this._speakBrowser(text, options).then(resolve)
        })
      })
    } catch (err) {
      console.warn('ElevenLabs fetch failed — falling back to browser TTS:', err.message)
      return this._speakBrowser(text, options)
    }
  }

  // ── Browser Web Speech Synthesis (fallback) ───────────────────────────────
  _speakBrowser(text, options = {}) {
    return new Promise((resolve, reject) => {
      if (!this._synth) { this._done(); resolve(); return }

      const utt = new SpeechSynthesisUtterance(text)
      if (this._preferredVoice) utt.voice  = this._preferredVoice
      utt.rate   = options.rate   ?? this._rate
      utt.pitch  = options.pitch  ?? this._pitch
      utt.volume = options.volume ?? this._volume

      utt.onend   = () => { this._done(); resolve() }
      utt.onerror = (e) => {
        this._done()
        if (e.error === 'interrupted') resolve()
        else reject(e)
      }

      this._utterance = utt
      this._synth.speak(utt)
    })
  }

  _done() {
    this._speaking = false
    this._onSpeakEnd?.()
  }

  // ── Control ───────────────────────────────────────────────────────────────
  stop() {
    if (this._audioEl) {
      this._audioEl.pause()
      this._audioEl.src = ''
      this._audioEl = null
    }
    if (this._synth) {
      this._synth.cancel()
      this._utterance = null
    }
    this._speaking = false
  }

  pause() {
    this._audioEl?.pause()
    this._synth?.pause()
  }

  resume() {
    this._audioEl?.play().catch(() => {})
    this._synth?.resume()
  }

  get isSpeaking() {
    return this._speaking || (this._synth?.speaking ?? false)
  }

  setRate(rate) {
    this._rate = Math.max(0.1, Math.min(2.0, rate))
  }

  onSpeakStart(fn) { this._onSpeakStart = fn }
  onSpeakEnd(fn)   { this._onSpeakEnd   = fn }
}

export const speechService = new SpeechService()
export default speechService
