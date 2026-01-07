import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { useNavigate, useLocation } from 'react-router-dom'
import { Lock, Mail, Loader2, ArrowRight, Eye, EyeOff } from 'lucide-react'

export default function Login() {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false) // Added showPassword state

  const { signIn, signUp } = useAuth()
  const { addToast } = useToast()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (isLogin) {
        const { error } = await signIn({ email, password })
        if (error) throw error
        navigate('/')
      } else {
        const { error } = await signUp({ email, password })
        if (error) throw error
        addToast({ type: 'success', message: 'Cadastro realizado! Verifique seu email ou tente logar.' })
        setIsLogin(true) // Switch to login view
      }
    } catch (err) {
      setError(err.message || "Erro na autenticação")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-neutral-950 p-4">
      <div className="w-full max-w-md bg-white dark:bg-neutral-900 rounded-2xl shadow-xl border border-slate-200 dark:border-neutral-800 overflow-hidden animate-fade-in">
        
        {/* Header */}
        <div className="bg-slate-900 dark:bg-black p-8 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 to-blue-600/20 z-0"></div>
            <div className="relative z-10">
                <div className="flex justify-center mb-6">
                    <img src="/logo_bookstack-ai.png" alt="Logo" className="h-20 object-contain drop-shadow-md" />
                </div>
                <h1 className="text-2xl font-bold text-white mb-2">
                    {isLogin ? 'Bem-vindo de volta' : 'Criar Conta'}
                </h1>
                <p className="text-slate-400 text-sm">
                    {isLogin ? 'Entre para acessar sua estante' : 'Comece sua jornada literária'}
                </p>
            </div>
        </div>

        {/* Form */}
        <div className="p-8">
            {error && (
                <div className="mb-6 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-300 text-sm flex items-center gap-2">
                    <span>⚠️</span> {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-neutral-300 mb-1">Email</label>
                    <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input 
                            type="email" 
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all dark:text-white"
                            placeholder="seu@email.com"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-neutral-300 mb-1">Senha</label>
                    <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input 
                            type={showPassword ? "text" : "password"} 
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full pl-10 pr-12 py-2.5 bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all dark:text-white"
                            placeholder="••••••••"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-purple-500 transition-colors focus:outline-none"
                        >
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>
                </div>

                <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-lg shadow-lg shadow-purple-500/20 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-4"
                >
                    {loading ? (
                        <Loader2 className="animate-spin" size={20} />
                    ) : (
                        <>
                            {isLogin ? 'Entrar' : 'Cadastrar'}
                            <ArrowRight size={18} />
                        </>
                    )}
                </button>
            </form>

            <div className="mt-6 text-center">
                <p className="text-sm text-slate-500 dark:text-neutral-400">
                    {isLogin ? 'Não tem uma conta?' : 'Já tem uma conta?'}
                    <button 
                        onClick={() => setIsLogin(!isLogin)}
                        className="ml-1 text-purple-600 dark:text-purple-400 font-bold hover:underline"
                    >
                        {isLogin ? 'Cadastre-se' : 'Faça Login'}
                    </button>
                </p>
            </div>
        </div>
      </div>
    </div>
  )
}
