import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { useTheme } from "../../context/ThemeContext"; // Import ThemeContext
import { useNavigate, useLocation } from "react-router-dom";
import {
  Lock,
  Mail,
  Loader2,
  ArrowRight,
  Eye,
  EyeOff,
  Sparkles,
  Calculator,
  Shield,
  BookOpen,
  CheckCircle2,
  Moon,
  Sun,
} from "lucide-react";

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const { signIn, signUp } = useAuth();
  const { addToast } = useToast();
  const { theme, toggleTheme } = useTheme(); // Use Theme Hook
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await signIn({ email, password });
        if (error) throw error;
        navigate("/");
      } else {
        const { error } = await signUp({ email, password });
        if (error) throw error;
        addToast({
          type: "success",
          message: "Cadastro realizado! Verifique seu email ou tente logar.",
        });
        setIsLogin(true);
      }
    } catch (err) {
      setError(err.message || "Erro na autenticação");
    } finally {
      setLoading(false);
    }
  };

  const features = [
    {
      icon: Sparkles,
      color: "text-purple-600 dark:text-purple-400",
      bg: "bg-purple-100 dark:bg-purple-400/10",
      title: "Inteligência Artificial",
      desc: "Preenchimento automático de metadados e sugestões inteligentes baseadas no seu perfil.",
    },
    {
      icon: Calculator,
      color: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-100 dark:bg-amber-400/10",
      title: "Score de Prioridade",
      desc: "Algoritmo dinâmico que calcula o próximo livro ideal para sua leitura.",
    },
    {
      icon: Shield,
      color: "text-rose-600 dark:text-rose-400",
      bg: "bg-rose-100 dark:bg-rose-400/10",
      title: "Auditoria de Dados",
      desc: "Ferramentas automáticas para manter sua biblioteca organizada e consistente.",
    },
    {
      icon: BookOpen,
      color: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-100 dark:bg-blue-400/10",
      title: "Mural Dinâmico",
      desc: "Visualize sua estante de forma fluida e acompanhe seu progresso de leitura.",
    },
  ];

  return (
    <div className="min-h-screen lg:h-screen flex bg-slate-50 dark:bg-neutral-950 relative overflow-y-auto lg:overflow-hidden transition-colors duration-500">
      {/* Global Background Effects */}
      <div className="fixed inset-0 bg-gradient-to-br from-indigo-100/40 via-purple-100/40 to-pink-100/40 dark:from-purple-900/20 dark:via-black/40 dark:to-blue-900/20 z-0 transition-colors duration-500"></div>
      <div className="fixed top-0 left-0 w-full h-full opacity-60 dark:opacity-20 pointer-events-none">
        <div className="absolute top-10 left-10 w-96 h-96 bg-purple-300 dark:bg-purple-600 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl animate-blob transition-colors duration-500"></div>
        <div className="absolute top-10 right-10 w-96 h-96 bg-blue-300 dark:bg-blue-600 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl animate-blob animation-delay-2000 transition-colors duration-500"></div>
        <div className="absolute -bottom-8 left-1/2 w-96 h-96 bg-indigo-300 dark:bg-indigo-600 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl animate-blob animation-delay-4000 transition-colors duration-500"></div>
      </div>

      {/* Theme Toggle Button */}
      <button
        onClick={toggleTheme}
        className="absolute top-4 right-4 z-50 p-2 rounded-full bg-white/40 dark:bg-white/10 backdrop-blur-md border border-white/50 dark:border-white/10 text-slate-700 dark:text-white hover:bg-white/60 dark:hover:bg-white/20 transition-all shadow-sm"
        title="Alternar Tema"
      >
        {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
      </button>

      {/* Left Column: Feature Showcase (Desktop Only) */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-center p-8 xl:p-12 z-10">
        <div className="relative max-w-xl mx-auto flex flex-col h-full justify-center">
          <div className="flex items-center gap-3 mb-6 shrink-0">
            <img
              src="/logo_bookstack-ai.png"
              alt="Logo"
              className="h-14 object-contain drop-shadow-sm"
            />
            <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-white transition-colors">
              BookStack AI
            </h1>
          </div>

          <h2 className="text-3xl font-bold mb-8 leading-tight shrink-0 text-slate-800 dark:text-slate-100 transition-colors">
            Sua biblioteca pessoal,
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600 dark:from-purple-400 dark:to-blue-400">
              potencializada por Inteligência.
            </span>
          </h2>

          <div className="grid grid-cols-1 gap-5 shrink-0">
            {features.map((feature, idx) => (
              <div
                key={idx}
                className="flex items-start gap-4 p-4 rounded-xl bg-white/60 dark:bg-black/20 border border-slate-200/50 dark:border-white/10 hover:bg-white/80 dark:hover:bg-black/30 transition-all backdrop-blur-md shadow-sm dark:shadow-none"
              >
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${feature.bg} ${feature.color}`}
                >
                  <feature.icon size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-1 text-slate-800 dark:text-white">
                    {feature.title}
                  </h3>
                  <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
                    {feature.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-4 lg:p-8 relative z-10 min-h-screen lg:min-h-0">
        {/* Mobile Logo View */}
        <div className="lg:hidden text-center mb-6 mt-8">
          <img
            src="/logo_bookstack-ai.png"
            alt="Logo"
            className="h-12 object-contain mx-auto mb-3"
          />
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">
            BookStack AI
          </h1>
        </div>

        {/* Mobile Features List (Visible only on mobile, moved to top) */}
        <div className="lg:hidden w-full max-w-md space-y-4 mb-8">
          <div className="flex items-center gap-3 opacity-80">
            <div className="h-px bg-slate-400 dark:bg-slate-600 flex-1"></div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Conheça a Plataforma
            </span>
            <div className="h-px bg-slate-400 dark:bg-slate-600 flex-1"></div>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {features.map((feature, idx) => (
              <div
                key={idx}
                className="flex items-center gap-3 p-3 rounded-lg bg-white/40 dark:bg-black/40 border border-white/20 dark:border-white/5 backdrop-blur-sm"
              >
                <div
                  className={`w-8 h-8 rounded-md flex items-center justify-center shrink-0 ${feature.bg} ${feature.color}`}
                >
                  <feature.icon size={16} />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-800 dark:text-white leading-tight">
                    {feature.title}
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400 text-xs leading-tight mt-0.5">
                    {feature.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Login Card */}
        <div className="w-full max-w-md bg-white/80 dark:bg-black/60 backdrop-blur-2xl rounded-2xl shadow-xl hover:shadow-2xl transition-all border border-white/50 dark:border-white/10 p-8 md:p-10 animate-fade-in relative mb-8 lg:mb-0">
          <div className="text-center lg:text-left mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-2">
              {isLogin ? "Bem-vindo de volta" : "Crie sua conta"}
            </h2>
            <p className="text-slate-600 dark:text-slate-400">
              {isLogin
                ? "Entre com suas credenciais para acessar."
                : "Preencha seus dados para começar."}
            </p>
          </div>

          {error && (
            <div className="mb-6 p-3 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 rounded-r-lg text-red-700 dark:text-red-300 text-sm flex items-start gap-2">
              <span className="text-lg">⚠️</span>
              <p>{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label
                className="text-sm font-semibold text-slate-700 dark:text-neutral-300 ml-1"
                htmlFor="email"
              >
                Email
              </label>
              <div className="relative group">
                <Mail
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-purple-600 transition-colors"
                  size={20}
                />
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-slate-50/50 dark:bg-neutral-900/50 border-2 border-slate-200 dark:border-neutral-700 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all text-slate-900 dark:text-white placeholder:text-slate-400 font-medium"
                  placeholder="seu@email.com"
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label
                className="text-sm font-semibold text-slate-700 dark:text-neutral-300 ml-1"
                htmlFor="password"
              >
                Senha
              </label>
              <div className="relative group">
                <Lock
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-purple-600 transition-colors"
                  size={20}
                />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-12 py-3 bg-slate-50/50 dark:bg-neutral-900/50 border-2 border-slate-200 dark:border-neutral-700 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all text-slate-900 dark:text-white placeholder:text-slate-400 font-medium"
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-purple-600 transition-colors focus:outline-none p-1 rounded-md hover:bg-slate-100 dark:hover:bg-neutral-700"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-purple-600/20 hover:shadow-purple-600/40 hover:-translate-y-0.5 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-lg mt-2"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={24} />
              ) : (
                <>
                  {isLogin ? "Entrar" : "Criar Conta"}
                  <ArrowRight size={20} strokeWidth={2.5} />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-200 dark:border-neutral-800 text-center">
            <p className="text-sm text-slate-600 dark:text-neutral-400">
              {isLogin ? "Ainda não tem uma conta?" : "Já possui cadastro?"}
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="ml-2 text-purple-600 dark:text-purple-400 font-bold hover:text-purple-700 hover:underline transition-all"
              >
                {isLogin ? "Cadastre-se" : "Faça login"}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
