import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Eye, EyeOff, Mail, Lock, BookOpen, Sparkles, MessageCircle, PenTool } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate  = useNavigate()

  const [form, setForm]       = useState({ email: '', password: '' })
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleChange = (e) =>
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.email || !form.password) {
      toast.error('Please fill in all fields.')
      return
    }
    setLoading(true)
    try {
      await login(form.email, form.password)
      navigate('/dashboard')
    } catch (err) {
      const msg = err?.response?.data?.error || 'Login failed. Please try again.'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-echo-bg">
      {/* ── LEFT COLUMN: LOGIN FORM ─────────────────────────────────────── */}
      <div className="flex items-center justify-center p-6 sm:p-12 lg:p-16 relative z-10 bg-white">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="w-full max-w-md"
        >
          {/* Logo Area */}
          <div className="mb-10">
            <motion.div
              initial={{ scale: 0.8, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200, damping: 15 }}
              className="inline-flex items-center justify-center w-14 h-14 bg-echo-500 rounded-2xl shadow-echo mb-6"
            >
              <BookOpen size={28} className="text-white" />
            </motion.div>
            <h1 className="text-4xl font-extrabold text-echo-900 tracking-tight mb-2">
              Welcome to <span className="gradient-text">EchoTutor</span>
            </h1>
            <p className="text-gray-500 text-lg">Your personal AI tutor is waiting 👋</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            <div className="space-y-1">
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700">
                Email Address
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none transition-colors group-focus-within:text-echo-500 text-gray-400">
                  <Mail size={20} />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  className="input-echo pl-11 py-3.5 text-base"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label htmlFor="password" className="block text-sm font-semibold text-gray-700">
                Password
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none transition-colors group-focus-within:text-echo-500 text-gray-400">
                  <Lock size={20} />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPwd ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="input-echo pl-11 pr-12 py-3.5 text-base"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(v => !v)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-echo-500 transition-colors"
                  aria-label={showPwd ? 'Hide password' : 'Show password'}
                >
                  {showPwd ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: 1.01, boxShadow: "0 8px 24px rgba(108, 99, 255, 0.25)" }}
              whileTap={{ scale: 0.98 }}
              className="btn-echo w-full mt-4 flex items-center justify-center gap-2 py-4 text-lg"
            >
              {loading ? (
                <>
                  <span className="inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In & Start Learning'
              )}
            </motion.button>
          </form>

          <div className="mt-8 pt-8 border-t border-gray-100 text-center">
            <p className="text-gray-500">
              New to EchoTutor?{' '}
              <Link to="/signup" className="text-echo-600 font-bold hover:text-echo-700 hover:underline transition-all">
                Create a free account
              </Link>
            </p>
            <p className="text-xs text-gray-400 mt-6 inline-flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100">
              <span className="animate-pulse">🎓</span> Demo: any email + password works in offline mode
            </p>
          </div>
        </motion.div>
      </div>

      {/* ── RIGHT COLUMN: HERO SHOWCASE ─────────────────────────────────── */}
      <div className="hidden lg:flex relative mesh-gradient-bg items-center justify-center p-12 overflow-hidden">
        {/* Decorative Grid SVG */}
        <div className="absolute inset-0 z-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, black 1px, transparent 0)', backgroundSize: '32px 32px' }} />

        {mounted && (
          <div className="relative z-10 w-full max-w-lg">
            {/* Main Glass Panel */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.7, ease: "easeOut" }}
              className="glass-panel p-8 rounded-3xl relative"
            >
              <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-6 text-echo-500">
                <Sparkles size={32} />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4 leading-tight">
                Learning that feels <br/> <span className="gradient-text italic">human.</span>
              </h2>
              <p className="text-gray-600 text-lg leading-relaxed mb-8">
                Experience voice-first AI tutoring with a live interactive whiteboard and real-time interruption handling.
              </p>
              
              <div className="flex gap-3">
                <span className="glass-pill px-4 py-2 text-sm font-semibold text-echo-700 flex items-center gap-2">
                  <MessageCircle size={16} /> Speaking
                </span>
                <span className="glass-pill px-4 py-2 text-sm font-semibold text-warm-600 flex items-center gap-2">
                  <PenTool size={16} /> Drawing
                </span>
              </div>
            </motion.div>

            {/* Floating Elements */}
            <AnimatePresence>
              {/* Floating equation box */}
              <motion.div
                initial={{ opacity: 0, x: 50, y: -20 }}
                animate={{ opacity: 1, x: 0, y: [-10, 10, -10] }}
                transition={{ 
                  opacity: { delay: 0.6, duration: 0.5 },
                  y: { repeat: Infinity, duration: 5, ease: "easeInOut" }
                }}
                className="absolute -right-12 -top-10 glass-pill px-6 py-4 shadow-xl"
              >
                <span className="text-xl font-mono font-bold text-gray-800">ax² + bx + c = 0</span>
              </motion.div>

              {/* Floating chat bubble */}
              <motion.div
                initial={{ opacity: 0, x: -50, y: 20 }}
                animate={{ opacity: 1, x: 0, y: [10, -10, 10] }}
                transition={{ 
                  opacity: { delay: 0.8, duration: 0.5 },
                  y: { repeat: Infinity, duration: 6, ease: "easeInOut", delay: 1 }
                }}
                className="absolute -left-12 -bottom-8 glass-pill px-6 py-4 shadow-xl flex items-center gap-3"
              >
                <div className="w-8 h-8 rounded-full bg-warm-500 flex items-center justify-center text-white font-bold text-sm">
                  EK
                </div>
                <div className="space-y-1.5">
                  <div className="w-24 h-2 bg-gray-200 rounded-full"></div>
                  <div className="w-16 h-2 bg-gray-200 rounded-full"></div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  )
}

