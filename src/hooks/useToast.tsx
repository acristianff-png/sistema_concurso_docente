import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react'
import { cn } from '@/utils/cn'

type ToastTone = 'error' | 'success' | 'info'

interface Toast {
  id: number
  message: string
  tone: ToastTone
}

interface ToastContextValue {
  showError: (message: string) => void
  showSuccess: (message: string) => void
  showInfo: (message: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

const toneClasses: Record<ToastTone, string> = {
  error: 'bg-coral-dark text-paper',
  success: 'bg-teal-dark text-paper',
  info: 'bg-ink text-paper',
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const idRef = useRef(0)

  const push = useCallback((message: string, tone: ToastTone) => {
    const id = idRef.current++
    setToasts((prev) => [...prev, { id, message, tone }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 5000)
  }, [])

  const value: ToastContextValue = {
    showError: (message) => push(message, 'error'),
    showSuccess: (message) => push(message, 'success'),
    showInfo: (message) => push(message, 'info'),
  }

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 top-4 z-50 flex flex-col items-center gap-2 px-4">
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className={cn(
              'pointer-events-auto w-full max-w-sm animate-toast-in rounded-md px-4 py-3 text-sm font-medium shadow-lg',
              toneClasses[t.tone],
            )}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) {
    throw new Error('useToast deve ser usado dentro de <ToastProvider>')
  }
  return ctx
}
