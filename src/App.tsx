import type { ReactNode } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from '@/hooks/useAuth'
import { ToastProvider } from '@/hooks/useToast'
import { SimulacaoProvider } from '@/hooks/useSimulacao'
import { AppLayout } from '@/components/layout/AppLayout'
import { LoginPage } from '@/pages/LoginPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { BaremaPage } from '@/pages/BaremaPage'
import { AcoesPage } from '@/pages/AcoesPage'
import { AreasPage } from '@/pages/AreasPage'
import { HistoricoPage } from '@/pages/HistoricoPage'

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-paper font-mono text-sm text-ink/60">
        Carregando…
      </div>
    )
  }

  if (!session) {
    return <Navigate to="/login" replace />
  }

  return <AppLayout>{children}</AppLayout>
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/barema"
        element={
          <ProtectedRoute>
            <BaremaPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/acoes"
        element={
          <ProtectedRoute>
            <AcoesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/areas"
        element={
          <ProtectedRoute>
            <AreasPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/historico"
        element={
          <ProtectedRoute>
            <HistoricoPage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

function App() {
  return (
    // BASE_URL casa com o `base` do vite.config.ts ("/" em dev,
    // "/sistema_concurso_docente/" no build de produção pro GitHub Pages).
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <AuthProvider>
        <ToastProvider>
          <SimulacaoProvider>
            <AppRoutes />
          </SimulacaoProvider>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
