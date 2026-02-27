/**
 * AvatarService
 * ─────────────────────────────────────────────────────────────────────────────
 * Integrates with the D-ID API to generate talking avatar streams.
 * Falls back silently (CSS avatar renders instead) when no API key is set.
 *
 * D-ID docs: https://docs.d-id.com/reference/createtalk
 *
 * Auth note: D-ID API key is provided as "<b64_email>:<api_secret>".
 * The Authorization header must be: Basic btoa("<b64_email>:<api_secret>")
 */

const DID_BASE   = 'https://api.d-id.com'
const API_KEY    = import.meta.env.VITE_DID_API_KEY || ''
const SOURCE_URL = import.meta.env.VITE_DID_SOURCE_URL ||
  'https://create-images-results.d-id.com/DefaultPresenters/Noelle_f/image.jpeg'

// D-ID Basic auth: the API key is "base64email:secret" — wrap the whole thing in btoa()
const AUTH_HEADER = API_KEY ? `Basic ${btoa(API_KEY)}` : ''

class AvatarService {
  constructor() {
    this._cache    = new Map()
    this._inFlight = new Map()
  }

  /**
   * Pre-fetch D-ID videos for all speech blocks at lesson start.
   * Fires all requests in parallel so videos are already cached when needed.
   */
  prefetchBlocks(blocks) {
    if (!AUTH_HEADER) return
    blocks
      .filter(b => b.type === 'speech')
      .slice(0, 12)
      .forEach(b => this.createTalkStream(b.content).catch(() => {}))
  }

  /**
   * Request a talking clip for the given text.
   * Returns the result_url string (mp4) or null on failure.
   */
  async createTalkStream(text, options = {}) {
    if (!AUTH_HEADER) return null

    const cacheKey = text.slice(0, 100).trim()
    if (this._cache.has(cacheKey)) return this._cache.get(cacheKey)

    // Return existing in-flight promise to avoid duplicate API calls
    if (this._inFlight.has(cacheKey)) return this._inFlight.get(cacheKey)

    const promise = this._fetchTalk(text, options, cacheKey)
    this._inFlight.set(cacheKey, promise)
    promise.finally(() => this._inFlight.delete(cacheKey))
    return promise
  }

  async _fetchTalk(text, options, cacheKey) {
    try {
      // 1. Create talk
      const createRes = await fetch(`${DID_BASE}/talks`, {
        method: 'POST',
        headers: {
          Authorization: AUTH_HEADER,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          source_url: options.sourceUrl || SOURCE_URL,
          script: {
            type: 'text',
            subtitles: false,
            provider: {
              type: 'microsoft',
              voice_id: options.voiceId || 'en-US-JennyNeural',
            },
            input: text,
          },
          config: { fluent: true, pad_audio: 0 },
        }),
      })

      if (!createRes.ok) {
        const errBody = await createRes.text().catch(() => '')
        throw new Error(`D-ID create failed (${createRes.status}): ${errBody}`)
      }
      const { id } = await createRes.json()

      // 2. Poll until done (max 30s)
      const resultUrl = await this._poll(id)
      if (resultUrl) this._cache.set(cacheKey, resultUrl)
      return resultUrl
    } catch (err) {
      console.warn('D-ID avatar error (using CSS fallback):', err.message)
      return null
    }
  }

  async _poll(talkId, maxAttempts = 30) {
    for (let i = 0; i < maxAttempts; i++) {
      await new Promise(r => setTimeout(r, 1000))
      try {
        const res = await fetch(`${DID_BASE}/talks/${talkId}`, {
          headers: { Authorization: AUTH_HEADER },
        })
        if (!res.ok) continue
        const data = await res.json()
        if (data.status === 'done')  return data.result_url
        if (data.status === 'error') return null
        // statuses: 'created' | 'started' | 'done' | 'error'
      } catch {
        continue
      }
    }
    console.warn('D-ID: polling timed out after 30s')
    return null
  }

  /** Clear the local video cache (call when starting a new lesson) */
  clearCache() {
    this._cache.clear()
  }
}

export const avatarService = new AvatarService()
export default avatarService
