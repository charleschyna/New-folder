import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  useCallback,
} from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Eraser } from 'lucide-react'

/**
 * WhiteboardCanvas
 * ─────────────────────────────────────────────────────────────────────────────
 * A canvas-based whiteboard that:
 *   • Animates text character by character ("typewriter" effect)
 *   • Renders equations and diagrams
 *   • Maintains a scrollable history of written blocks
 *   • Exposed via ref: writeText(text), drawDiagram(instruction), clear()
 *
 * Props:
 *   currentWrite  {string}  — incoming text to write (from lesson blocks)
 */
const WhiteboardCanvas = forwardRef(function WhiteboardCanvas({ currentWrite }, ref) {
  const canvasRef   = useRef(null)
  const ctxRef      = useRef(null)
  const [lines, setLines]   = useState([])
  const [typing, setTyping] = useState('')
  const typeTimer   = useRef(null)
  const writeQueue  = useRef([])
  const isTyping    = useRef(false)

  // ── Canvas setup ───────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    ctxRef.current = ctx
    resizeCanvas()

    const ro = new ResizeObserver(resizeCanvas)
    ro.observe(canvas.parentElement)
    return () => ro.disconnect()
  }, [])

  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const parent = canvas.parentElement
    canvas.width  = parent.clientWidth  || 800
    canvas.height = parent.clientHeight || 400
    redrawAll()
  }, [])

  // ── Redraw all committed lines ────────────────────────────────────────────
  const redrawAll = useCallback(() => {
    const canvas = canvasRef.current
    const ctx    = ctxRef.current
    if (!canvas || !ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    // Parchment background
    ctx.fillStyle = '#fffef7'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    let y = 40
    const lineHeight = 38
    const x = 24

    lines.forEach(line => {
      drawLine(ctx, line, x, y, canvas.width - 48)
      y += lineHeight + (line.type === 'heading' ? 8 : 0)
    })
  }, [lines])

  useEffect(() => {
    redrawAll()
  }, [lines, redrawAll])

  // ── Draw a single line block ───────────────────────────────────────────────
  function drawLine(ctx, line, x, y, maxWidth) {
    switch (line.type) {
      case 'heading':
        ctx.font = 'bold 22px "Inter", sans-serif'
        ctx.fillStyle = '#3730a3'
        ctx.fillText(line.text, x, y)
        // Underline
        const metrics = ctx.measureText(line.text)
        ctx.beginPath()
        ctx.moveTo(x, y + 4)
        ctx.lineTo(x + Math.min(metrics.width, maxWidth), y + 4)
        ctx.strokeStyle = '#6C63FF'
        ctx.lineWidth = 2
        ctx.stroke()
        break

      case 'equation':
        ctx.font = 'bold 20px "Courier New", monospace'
        ctx.fillStyle = '#1e1b4b'
        // Equation box
        const eqMetrics = ctx.measureText(line.text)
        const boxW = Math.min(eqMetrics.width + 24, maxWidth)
        ctx.fillStyle = 'rgba(108, 99, 255, 0.06)'
        ctx.beginPath()
        ctx.roundRect(x - 8, y - 22, boxW + 16, 32, 8)
        ctx.fill()
        ctx.fillStyle = '#1e1b4b'
        ctx.font = 'bold 20px "Courier New", monospace'
        ctx.fillText(line.text, x, y, maxWidth)
        break

      case 'bullet':
        ctx.font = '17px "Inter", sans-serif'
        ctx.fillStyle = '#374151'
        ctx.fillText('•  ' + line.text, x, y, maxWidth)
        break

      case 'diagram':
        ctx.font = 'italic 15px "Inter", sans-serif'
        ctx.fillStyle = '#6b7280'
        ctx.fillText('[ ' + line.text + ' ]', x, y, maxWidth)
        // Simple decorative box
        ctx.strokeStyle = 'rgba(108, 99, 255, 0.25)'
        ctx.lineWidth = 1
        ctx.setLineDash([4, 4])
        ctx.strokeRect(x - 4, y - 20, 260, 28)
        ctx.setLineDash([])
        break

      default:
        ctx.font = '18px "Inter", sans-serif'
        ctx.fillStyle = '#1f2937'
        ctx.fillText(line.text, x, y, maxWidth)
    }
  }

  // ── Classify and write text ───────────────────────────────────────────────
  const writeText = useCallback((text) => {
    writeQueue.current.push(text)
    if (!isTyping.current) {
      processQueue()
    }
  }, [])

  const processQueue = useCallback(() => {
    if (writeQueue.current.length === 0) {
      isTyping.current = false
      return
    }
    isTyping.current = true
    const text = writeQueue.current.shift()
    animateTypewriter(text)
  }, [])

  const animateTypewriter = useCallback((text) => {
    const lineType = classifyText(text)
    let i = 0
    setTyping('')

    const tick = () => {
      i++
      setTyping(text.slice(0, i))
      if (i < text.length) {
        typeTimer.current = setTimeout(tick, 28)
      } else {
        // Commit to lines
        setLines(prev => {
          const newLine = { text, type: lineType }
          // Limit to 12 lines visible
          const updated = [...prev, newLine]
          return updated.length > 12 ? updated.slice(updated.length - 12) : updated
        })
        setTyping('')
        setTimeout(processQueue, 300)
      }
    }

    typeTimer.current = setTimeout(tick, 50)
  }, [processQueue])

  const classifyText = (text) => {
    if (/[=+\-*/²³√∑∫∂]/u.test(text) || /\b[a-z]=/.test(text)) return 'equation'
    if (/^step\s*\d+|^[0-9]+\./i.test(text.trim())) return 'bullet'
    if (/^(key|topic|subject|concept|summary|formula|definition)/i.test(text.trim())) return 'heading'
    if (/(arrow|diagram|graph|chart|flowchart|box|circle)/i.test(text)) return 'diagram'
    return 'text'
  }

  const drawDiagram = useCallback((instruction) => {
    setLines(prev => [...prev, { text: instruction, type: 'diagram' }])
  }, [])

  const clear = useCallback(() => {
    clearTimeout(typeTimer.current)
    writeQueue.current = []
    isTyping.current   = false
    setLines([])
    setTyping('')
  }, [])

  // Expose methods via ref
  useImperativeHandle(ref, () => ({ writeText, drawDiagram, clear }), [writeText, drawDiagram, clear])

  return (
    <div className="w-full h-full flex flex-col gap-2">
      {/* Header */}
      <div className="flex items-center justify-between px-1">
        <h3 className="text-sm font-semibold text-gray-600">📋 Whiteboard</h3>
        <button
          onClick={clear}
          className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-400 transition-colors"
          aria-label="Clear whiteboard"
        >
          <Eraser size={13} /> Clear
        </button>
      </div>

      {/* Canvas */}
      <div className="relative flex-1 bg-[#fffef7] rounded-2xl border-2 border-echo-100 overflow-hidden shadow-inner">
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full"
          style={{ touchAction: 'none' }}
        />

        {/* Typewriter overlay — live character-by-character text */}
        {typing && (
          <div className="absolute bottom-4 left-6 right-6">
            <div className="inline-block bg-white/90 border border-echo-200 rounded-xl px-4 py-2 text-gray-800 font-mono text-base shadow-sm typewriter-cursor">
              {typing}
            </div>
          </div>
        )}

        {/* Empty state */}
        {lines.length === 0 && !typing && (
          <div className="absolute inset-0 flex items-center justify-center text-gray-300 text-sm">
            <div className="text-center space-y-2">
              <div className="text-4xl">✏️</div>
              <p>Echo will write explanations here</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
})

export default WhiteboardCanvas
