import { Outlet, NavLink, useLocation } from 'react-router-dom'
import { Brain, Calculator, List, Settings, Info, User, Sparkles, LayoutDashboard, Sliders } from 'lucide-react'

export default function SettingsLayout() {
  const location = useLocation()
  
  // Helper to get current section name for mobile header
  const getCurrentSection = () => {
    const path = location.pathname.split('/').pop()
    const map = {
        'overview': 'Visão Geral',
        'ai': 'IA & Prompts',
        'formula': 'Fórmula de Score',
        'lists': 'Listas e Opções',
        'preferences': 'Preferências'
    }
    return map[path] || 'Configurações'
  }

  return (
    <div className="flex flex-col md:flex-row w-full h-full animate-fade-in min-h-[calc(100vh-6rem)]">
      {/* Sidebar Navigation (Desktop) */}
      <aside className="hidden md:flex flex-col w-80 flex-shrink-0 border-r border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/30 p-6 lg:p-8">
         <div className="mb-8">
             <div className="flex items-center gap-3 text-slate-800 dark:text-white mb-2">
                <div className="p-2 bg-purple-100 dark:bg-purple-500/20 rounded-lg text-purple-600 dark:text-purple-400">
                    <Settings size={24} />
                </div>
                <h1 className="text-xl font-bold tracking-tight">Configurações</h1>
             </div>
             <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                 Gerencie as regras de automação, inteligência artificial e preferências da sua biblioteca.
             </p>
         </div>
         
         <nav className="flex flex-col gap-2 space-y-1">
            <SidebarItem 
                to="overview" 
                title="Visão Geral" 
                subtitle="Status do sistema e auditoria"
                icon={LayoutDashboard} 
            />
            <div className="h-px bg-slate-100 dark:bg-neutral-800 my-2 mx-2" />
            
            <SidebarItem 
                to="ai" 
                title="IA & Inteligência" 
                subtitle="Prompts e configuração de modelos"
                icon={Sparkles} 
            />
            <SidebarItem 
                to="formula" 
                title="Fórmula de Score" 
                subtitle="Pesos e critérios de ordenação"
                icon={Calculator} 
            />
            <SidebarItem 
                to="lists" 
                title="Listas e Campos" 
                subtitle="Gerencie classes e categorias"
                icon={List} 
            />
            
            <div className="h-px bg-slate-100 dark:bg-neutral-800 my-2 mx-2" />
            
            <SidebarItem 
                to="preferences" 
                title="Preferências" 
                subtitle="Aparência e perfil de uso"
                icon={User} 
            />
         </nav>
      </aside>

      {/* Mobile Navigation (Tabs) */}
      <div className="md:hidden flex overflow-x-auto bg-white dark:bg-neutral-900 border-b border-slate-200 dark:border-neutral-800 p-2 gap-2 sticky top-[60px] z-30">
        <MobileTab to="overview" label="Visão" icon={LayoutDashboard} />
        <MobileTab to="ai" label="IA" icon={Sparkles} />
        <MobileTab to="formula" label="Score" icon={Calculator} />
        <MobileTab to="lists" label="Listas" icon={List} />
        <MobileTab to="preferences" label="Pref." icon={User} />
      </div>

      {/* Child Content */}
      <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto bg-slate-50/50 dark:bg-neutral-950/30">
        <div className="w-full max-w-[1600px] mx-auto animate-slide-up">
            {/* Contextual Header for Mobile/Desktop Content Area */}
            <header className="mb-6 md:hidden">
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white">
                    {getCurrentSection()}
                </h2>
            </header>
            
            <Outlet />
        </div>
      </main>
    </div>
  )
}

function SidebarItem({ to, title, subtitle, icon: Icon }) {
    return (
        <NavLink
            to={to}
            className={({ isActive }) => `
                group flex items-start gap-4 p-3 rounded-xl transition-all duration-200
                ${isActive 
                    ? 'bg-white dark:bg-neutral-800 shadow-sm border border-slate-200 dark:border-neutral-700' 
                    : 'hover:bg-slate-50 dark:hover:bg-neutral-800/50 border border-transparent'}
            `}
        >
            {({ isActive }) => (
                <>
                    <div className={`mt-0.5 p-1.5 rounded-lg transition-colors ${
                        isActive 
                            ? 'bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400' 
                            : 'bg-slate-100 dark:bg-neutral-800 text-slate-500 dark:text-slate-400 group-hover:bg-white dark:group-hover:bg-neutral-700 group-hover:text-purple-500 dark:group-hover:text-purple-300'
                    }`}>
                        <Icon size={18} />
                    </div>
                    <div>
                        <h3 className={`text-sm font-semibold transition-colors ${
                            isActive 
                                ? 'text-slate-900 dark:text-white' 
                                : 'text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-200'
                        }`}>
                            {title}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-500 mt-0.5 font-medium">
                            {subtitle}
                        </p>
                    </div>
                    {isActive && (
                        <div className="ml-auto self-center w-1.5 h-1.5 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.5)]" />
                    )}
                </>
            )}
        </NavLink>
    )
}

function MobileTab({ to, label, icon: Icon }) {
    return (
        <NavLink
            to={to}
            title={label}
            className={({ isActive }) => `
                flex items-center justify-center p-2.5 flex-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all
                ${isActive
                    ? 'bg-white dark:bg-neutral-800 text-purple-600 dark:text-purple-400 shadow-sm border border-slate-200 dark:border-neutral-700'
                    : 'text-slate-500 dark:text-neutral-500 hover:bg-slate-100 dark:hover:bg-neutral-800'}
            `}
        >
            <Icon size={20} />
            <span className="sr-only">{label}</span>
        </NavLink>
    )
}
