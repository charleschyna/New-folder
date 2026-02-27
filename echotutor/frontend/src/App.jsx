import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './context/AuthContext'
import { AccessibilityProvider } from './context/AccessibilityContext'
import { LessonProvider } from './context/LessonContext'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import DashboardPage from './pages/DashboardPage'
import ClassroomPage from './pages/ClassroomPage'
import ProtectedRoute from './components/Auth/ProtectedRoute'

export default function App() {
  return (
    <AccessibilityProvider>
      <AuthProvider>
        <LessonProvider>
          <BrowserRouter>
            <Toaster
              position="top-center"
              toastOptions={{
                duration: 3500,
                style: {
                  background: '#1e1b4b',
                  color: '#fff',
                  borderRadius: '12px',
                  padding: '12px 20px',
                  fontSize: '14px',
                },
                success: {
                  iconTheme: { primary: '#6C63FF', secondary: '#fff' },
                },
              }}
            />
            <Routes>
              <Route path="/login"   element={<LoginPage />} />
              <Route path="/signup"  element={<SignupPage />} />
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              } />
              <Route path="/classroom" element={
                <ProtectedRoute>
                  <ClassroomPage />
                </ProtectedRoute>
              } />
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </BrowserRouter>
        </LessonProvider>
      </AuthProvider>
    </AccessibilityProvider>
  )
}
