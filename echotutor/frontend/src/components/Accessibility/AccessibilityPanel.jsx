import { motion } from 'framer-motion'
import {
  Sun, Type, BookOpen, Mic, ZapOff, X,
  Check,
} from 'lucide-react'
import { useAccessibility } from '../../context/AccessibilityContext'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'

const SETTINGS = [
  {
    key: 'highContrast',
    label: 'High Contrast',
    desc: 'Dark background, bright text',
    icon: Sun,
    color: 'text-yellow-500',
  },
  {
    key: 'largeText',
    label: 'Large Text',
    desc: 'Bigger, easier-to-read text',
    icon: Type,
    color: 'text-blue-500',
  },
  {
    key: 'dyslexiaFont',
    label: 'Dyslexia Font',
    desc: 'OpenDyslexic typeface',
    icon: BookOpen,
    color: 'text-green-500',
  },
  {
    key: 'voiceOnly',
    label: 'Voice-Only Mode',
    desc: 'Navigate entirely by speech',
    icon: Mic,
    color: 'text-purple-500',
  },
  {
    key: 'reduceMotion',
    label: 'Reduce Motion',
    desc: 'Less animation and movement',
    icon: ZapOff,
    color: 'text-gray-500',
  },
]

export default function AccessibilityPanel({ compact, onClose }) {
  const { settings, toggle, reset } = useAccessibility()
  const { updateAccessibility }     = useAuth()

  const handleToggle = async (key) => {
    toggle(key)
    try {
      // Map frontend keys to backend field names
      const backendMap = {
        highContrast: 'high_contrast',
        largeText:    'large_text',
        dyslexiaFont: 'dyslexia_font',
        voiceOnly:    'voice_only_mode',
        reduceMotion: 'reduce_motion',
      }
      await updateAccessibility({ [backendMap[key]]: !settings[key] })
    } catch { /* best-effort sync */ }
  }

  if (compact) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-1.5">
          ♿ Accessibility
        </h3>
        <div className="space-y-2">
          {SETTINGS.map(s => (
            <label
              key={s.key}
              className="flex items-center justify-between gap-2 cursor-pointer"
            >
              <span className="text-sm text-gray-600">{s.label}</span>
              <button
                role="switch"
                aria-checked={settings[s.key]}
                onClick={() => handleToggle(s.key)}
                className={`relative w-10 h-5 rounded-full transition-colors duration-200 ${
                  settings[s.key] ? 'bg-echo-500' : 'bg-gray-200'
                }`}
              >
                <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all duration-200 ${
                  settings[s.key] ? 'left-5.5' : 'left-0.5'
                }`} style={{ left: settings[s.key] ? '22px' : '2px' }} />
              </button>
            </label>
          ))}
        </div>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 12 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      className="bg-white rounded-3xl shadow-echo-lg border border-echo-100 overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-echo-50 border-b border-echo-100">
        <div>
          <h2 className="font-semibold text-gray-800">Accessibility Settings</h2>
          <p className="text-xs text-gray-500">Personalise your learning experience</p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-echo-100 transition-colors text-gray-500"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Settings list */}
      <div className="p-4 space-y-2">
        {SETTINGS.map((s, i) => {
          const Icon = s.icon
          const active = settings[s.key]
          return (
            <motion.button
              key={s.key}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06 }}
              onClick={() => handleToggle(s.key)}
              className={`w-full flex items-center gap-3 p-3 rounded-2xl border-2 transition-all text-left ${
                active
                  ? 'border-echo-400 bg-echo-50'
                  : 'border-gray-100 hover:border-echo-200'
              }`}
              role="switch"
              aria-checked={active}
              aria-label={s.label}
            >
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                active ? 'bg-echo-100' : 'bg-gray-50'
              }`}>
                <Icon size={18} className={active ? 'text-echo-600' : 'text-gray-400'} />
              </div>
              <div className="flex-1">
                <p className={`text-sm font-medium ${active ? 'text-echo-800' : 'text-gray-700'}`}>
                  {s.label}
                </p>
                <p className="text-xs text-gray-400">{s.desc}</p>
              </div>
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                active ? 'bg-echo-500 border-echo-500' : 'border-gray-200'
              }`}>
                {active && <Check size={12} className="text-white" />}
              </div>
            </motion.button>
          )
        })}
      </div>

      {/* Footer */}
      <div className="px-4 pb-4">
        <button
          onClick={() => {
            reset()
            toast('Accessibility settings reset.', { icon: '♿' })
          }}
          className="w-full text-sm text-gray-400 hover:text-echo-500 transition-colors py-2"
        >
          Reset to defaults
        </button>
      </div>
    </motion.div>
  )
}
