import { LayoutGrid, Table2, Settings } from 'lucide-react'

export default function Navbar({ currentTab, setTab }) {
  const tabs = [
    { id: 'mural', label: 'Mural', icon: LayoutGrid },
    { id: 'table', label: 'Tabela', icon: Table2 },
    { id: 'admin', label: 'Gestão', icon: Settings },
  ]

  return (
    <nav className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-10 w-full mb-6">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="font-bold text-xl bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
           Leitura Pro
        </div>
        
        <div className="flex gap-2">
          {tabs.map(t => {
            const Icon = t.icon
            const isActive = currentTab === t.id
            return (
               <button
                 key={t.id}
                 onClick={() => setTab(t.id)}
                 className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors
                    ${isActive 
                       ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 font-medium' 
                       : 'hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
               >
                 <Icon size={18} />
                 {t.label}
               </button>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
