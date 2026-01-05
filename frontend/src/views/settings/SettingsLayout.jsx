import { Outlet, NavLink } from 'react-router-dom'
import { Brain, Calculator, List, Settings, Info } from 'lucide-react'

export default function SettingsLayout() {
  return (
    <div className="flex flex-col w-full h-full animate-fade-in">
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
          Configurações do Sistema
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm">
           Auditoria e transparência das regras de negócio, prompts de IA e fórmulas de cálculo.
        </p>
      </header>

      {/* Navigation Tabs */}
      <nav className="flex gap-4 border-b border-slate-200 dark:border-neutral-800 mb-6">
        <TabLink to="overview" label="Visão Geral" icon={Info} />
        <TabLink to="ai" label="IA & Prompts" icon={Brain} />
        <TabLink to="formula" label="Fórmula de Score" icon={Calculator} />
        <TabLink to="lists" label="Listas de Referência" icon={List} />
      </nav>

      {/* Child Content */}
      <div className="flex-1">
        <Outlet />
      </div>
    </div>
  )
}

function TabLink({ to, label, icon: Icon }) {
    return (
        <NavLink
            to={to}
            className={({ isActive }) => `flex items-center gap-2 px-4 py-3 font-medium text-sm transition-all border-b-2 ${
                isActive
                    ? 'border-purple-500 text-purple-600 dark:border-pastel-purple dark:text-pastel-purple'
                    : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
        >
            <Icon size={16} />
            {label}
        </NavLink>
    )
}
