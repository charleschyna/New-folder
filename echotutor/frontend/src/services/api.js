import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL || '/api'

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
})

// ── Request interceptor: attach JWT ──────────────────────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('echo_access_token')
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
  },
  (error) => Promise.reject(error),
)

// ── Response interceptor: auto-refresh on 401 ────────────────────────────────
let isRefreshing = false
let failedQueue  = []

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) prom.reject(error)
    else prom.resolve(token)
  })
  failedQueue = []
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config

    if (error.response?.status === 401 && !original._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then(token => {
          original.headers.Authorization = `Bearer ${token}`
          return api(original)
        })
      }

      original._retry = true
      isRefreshing    = true

      try {
        const refresh = localStorage.getItem('echo_refresh_token')
        if (!refresh) throw new Error('No refresh token')

        const { data } = await axios.post(`${BASE_URL}/auth/token/refresh/`, { refresh })
        const newToken = data.access

        localStorage.setItem('echo_access_token', newToken)
        api.defaults.headers.common.Authorization = `Bearer ${newToken}`
        processQueue(null, newToken)
        original.headers.Authorization = `Bearer ${newToken}`
        return api(original)
      } catch (err) {
        processQueue(err, null)
        localStorage.removeItem('echo_access_token')
        localStorage.removeItem('echo_refresh_token')
        window.location.href = '/login'
        return Promise.reject(err)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  },
)

// ── Auth API ──────────────────────────────────────────────────────────────────
export const authAPI = {
  register:            (data)    => api.post('/auth/register/', data),
  login:               (data)    => api.post('/auth/login/', data),
  logout:              (data)    => api.post('/auth/logout/', data),
  refreshToken:        (data)    => api.post('/auth/token/refresh/', data),
  getProfile:          ()        => api.get('/auth/profile/'),
  updateProfile:       (data)    => api.patch('/auth/profile/', data),
  updateAccessibility: (data)    => api.patch('/auth/accessibility/', data),
}

// ── Lessons API ───────────────────────────────────────────────────────────────
export const lessonsAPI = {
  getSubjects:  ()        => api.get('/lessons/subjects/'),
  getHistory:   ()        => api.get('/lessons/history/'),
  createSession: (data)   => api.post('/lessons/sessions/', data),
  getSession:   (id)      => api.get(`/lessons/sessions/${id}/`),
  endSession:   (id, data)=> api.post(`/lessons/sessions/${id}/end/`, data),
  getProgress:  ()        => api.get('/lessons/progress/'),
}

// ── AI Engine API ─────────────────────────────────────────────────────────────
export const aiAPI = {
  getGreeting: ()      => api.get('/ai/greeting/'),
  teach:       (data)  => api.post('/ai/teach/', data),
  interrupt:   (data)  => api.post('/ai/interrupt/', data),
  command:     (data)  => api.post('/ai/command/', data),
}

export default api
