import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Eye, EyeOff, Mail, Lock, User, BookOpen, ChevronRight, ChevronLeft } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

const STEPS = ['account', 'preferences']

const PACES = [
  { value: 'slow',   label: '🐢 Slow & Steady',  desc: 'Take time with each concept' },
  { value: 'normal', label: '🚶 Normal Pace',     desc: 'Balanced explanations' },
  { value: 'fast',   label: '🚀 Fast Track',      desc: 'Quick, concise teaching' },
]

const STYLES = [
  { value: 'auditory',     label: '🎧 Listener',      desc: 'Learn by hearing explanations' },
  { value: 'visual',       label: '👁️ Visual',        desc: 'Learn through diagrams and writing' },
  { value: 'reading',      label: '📖 Reader',        desc: 'Learn through structured text' },
  { value: 'kinesthetic',  label: '✋ Hands-on',      desc: 'Learn through examples and practice' },
]

export default function SignupPage() {
  const { register } = useAuth()
  const navigate     = useNavigate()

  const [step, setStep]   = useState(0)
  const [loading, setLoading] = useState(false)
  const [showPwd, setShowPwd] = useState(false)
  const [form, setForm] = useState({
    first_name: '', last_name: '', email: '',
    username: '', password: '', password2: '',
    preferred_pace: 'normal', learning_style: 'auditory',
  })

  const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }))

  const nextStep = () => {
    if (step === 0) {
      if (!form.first_name || !form.last_name || !form.email || !form.password || !form.password2) {
        toast.error('Please fill in all fields.')
        return
      }
      if (form.password !== form.password2) {
        toast.error('Passwords do not match.')
        return
      }
      if (!form.username) {
        set('username', form.email.split('@')[0].replace(/[^a-z0-9]/gi, '_'))
      }
    }
    setStep(s => s + 1)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const payload = {
        ...form,
        username: form.username || form.email.split('@')[0].replace(/[^a-z0-9]/gi, '_'),
      }
      await register(payload)
      navigate('/dashboard')
    } catch (err) {
      const errors = err?.response?.data
      if (errors && typeof errors === 'object') {
        const msg = Object.values(errors).flat().join(' ')
        toast.error(msg || 'Registration failed.')
      } else {
        toast.error('Registration failed. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-echo-50 via-white to-warm-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-echo-500 rounded-3xl shadow-echo-lg mb-4">
            <BookOpen size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-echo-900">EchoTutor</h1>
          <p className="text-gray-500 mt-1">Start your personalised learning journey ✨</p>
        </div>

        <div className="bg-white rounded-3xl shadow-echo p-8 border border-echo-100">
          {/* Step indicators */}
          <div className="flex items-center gap-2 mb-6">
            {STEPS.map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                  i <= step ? 'bg-echo-500 text-white' : 'bg-gray-100 text-gray-400'
                }`}>
                  {i + 1}
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`h-0.5 w-8 rounded transition-all ${i < step ? 'bg-echo-500' : 'bg-gray-200'}`} />
                )}
              </div>
            ))}
            <span className="ml-auto text-sm text-gray-400">
              Step {step + 1} of {STEPS.length}
            </span>
          </div>

          {/* STEP 0: Account details */}
          {step === 0 && (
            <motion.div
              key="step0"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-4"
            >
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Create your account</h2>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">First name</label>
                  <div className="relative">
                    <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text" value={form.first_name}
                      onChange={e => set('first_name', e.target.value)}
                      placeholder="Alex"
                      className="input-echo pl-9 py-2.5 text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Last name</label>
                  <input
                    type="text" value={form.last_name}
                    onChange={e => set('last_name', e.target.value)}
                    placeholder="Johnson"
                    className="input-echo py-2.5 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email address</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="email" value={form.email}
                    onChange={e => set('email', e.target.value)}
                    placeholder="you@example.com"
                    className="input-echo pl-9"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type={showPwd ? 'text' : 'password'} value={form.password}
                    onChange={e => set('password', e.target.value)}
                    placeholder="Min. 8 characters"
                    className="input-echo pl-9 pr-10"
                  />
                  <button
                    type="button" onClick={() => setShowPwd(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-echo-500"
                  >
                    {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm password</label>
                <input
                  type="password" value={form.password2}
                  onChange={e => set('password2', e.target.value)}
                  placeholder="Repeat password"
                  className="input-echo"
                />
              </div>

              <motion.button
                type="button" onClick={nextStep}
                whileTap={{ scale: 0.97 }}
                className="btn-echo w-full flex items-center justify-center gap-2"
              >
                Continue <ChevronRight size={18} />
              </motion.button>
            </motion.div>
          )}

          {/* STEP 1: Learning preferences */}
          {step === 1 && (
            <motion.form
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              onSubmit={handleSubmit}
              className="space-y-5"
            >
              <h2 className="text-xl font-semibold text-gray-800 mb-1">How do you learn best?</h2>
              <p className="text-sm text-gray-500">Echo will personalise every lesson just for you.</p>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Learning pace</label>
                <div className="space-y-2">
                  {PACES.map(p => (
                    <label key={p.value} className={`flex items-center gap-3 p-3 rounded-2xl border-2 cursor-pointer transition-all ${
                      form.preferred_pace === p.value
                        ? 'border-echo-500 bg-echo-50'
                        : 'border-gray-100 hover:border-echo-200'
                    }`}>
                      <input
                        type="radio" name="pace" value={p.value}
                        checked={form.preferred_pace === p.value}
                        onChange={() => set('preferred_pace', p.value)}
                        className="accent-echo-500"
                      />
                      <div>
                        <div className="font-medium text-sm">{p.label}</div>
                        <div className="text-xs text-gray-400">{p.desc}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Learning style</label>
                <div className="grid grid-cols-2 gap-2">
                  {STYLES.map(s => (
                    <label key={s.value} className={`flex flex-col gap-1 p-3 rounded-2xl border-2 cursor-pointer transition-all ${
                      form.learning_style === s.value
                        ? 'border-echo-500 bg-echo-50'
                        : 'border-gray-100 hover:border-echo-200'
                    }`}>
                      <input
                        type="radio" name="style" value={s.value}
                        checked={form.learning_style === s.value}
                        onChange={() => set('learning_style', s.value)}
                        className="sr-only"
                      />
                      <span className="font-medium text-sm">{s.label}</span>
                      <span className="text-xs text-gray-400">{s.desc}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  type="button" onClick={() => setStep(0)}
                  className="btn-echo-outline flex items-center gap-1"
                >
                  <ChevronLeft size={16} /> Back
                </button>
                <motion.button
                  type="submit"
                  disabled={loading}
                  whileTap={{ scale: 0.97 }}
                  className="btn-echo flex-1 flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {loading ? (
                    <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Creating…</>
                  ) : 'Create My Account 🎉'}
                </motion.button>
              </div>
            </motion.form>
          )}

          <p className="text-center text-sm text-gray-500 mt-5">
            Already have an account?{' '}
            <Link to="/login" className="text-echo-600 font-semibold hover:underline">Sign in</Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}
