import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { CheckCircle, AlertCircle, X, Info } from 'lucide-react'

const ToastContext = createContext()

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const addToast = useCallback(({ message, type = 'info', duration = 4000 }) => {
    const id = Math.random().toString(36).substr(2, 9)
    setToasts((prev) => [...prev, { id, message, type, duration }])
  }, [])

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

function ToastItem({ toast, onRemove }) {
  // Auto-remove effect
  useEffect(() => {
    const timer = setTimeout(() => {
      onRemove(toast.id)
    }, toast.duration)

    return () => clearTimeout(timer)
  }, [toast.id, toast.duration, onRemove])

  const styles = {
    success: {
      border: 'border-emerald-500/50 shadow-emerald-500/20',
      bgIcon: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400',
      textTitle: 'text-emerald-700 dark:text-emerald-400',
      icon: CheckCircle,
      title: 'Sucesso'
    },
    error: {
      border: 'border-red-500/50 shadow-red-500/20',
      bgIcon: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
      textTitle: 'text-red-700 dark:text-red-400',
      icon: AlertCircle,
      title: 'Erro'
    },
    info: {
      border: 'border-blue-500/50 shadow-blue-500/20',
      bgIcon: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
      textTitle: 'text-blue-700 dark:text-blue-400',
      icon: Info,
      title: 'Informação'
    }
  }

  const style = styles[toast.type] || styles.info
  const Icon = style.icon

  return (
    <div className={`pointer-events-auto flex items-center gap-3 px-6 py-4 rounded-xl shadow-2xl animate-slide-up bg-white dark:bg-neutral-900 border ${style.border} min-w-[300px] max-w-md`}>
      <div className={`p-2 rounded-full flex-shrink-0 ${style.bgIcon}`}>
        <Icon size={24} />
      </div>
      <div className="flex-1">
        <h4 className={`font-bold text-sm ${style.textTitle}`}>
          {style.title}
        </h4>
        <p className="text-sm text-slate-600 dark:text-slate-300 font-medium leading-tight mt-0.5">
          {toast.message}
        </p>
      </div>
      <button 
        onClick={() => onRemove(toast.id)}
        className="ml-2 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-neutral-800 text-slate-400 dark:text-slate-500 transition-colors"
      >
        <X size={18} />
      </button>
    </div>
  )
}
