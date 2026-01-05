import { BookOpen, Layers, LayoutGrid, BarChart2, PlusCircle, Sun, Moon, Library, CheckCircle2 } from 'lucide-react'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext'

export default function Sidebar({ onAddBook }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { theme, toggleTheme } = useTheme()
  
  const menuItems = [
    { id: 'reading', label: 'Lendo', icon: BookOpen, path: '/mural/reading', color: 'bg-pastel-purple' },
    { id: 'to-read', label: 'Fila', icon: Library, path: '/mural/to-read', color: 'bg-pastel-orange' },
    { id: 'read', label: 'Lidos', icon: CheckCircle2, path: '/mural/read', color: 'bg-pastel-green' },
    { id: 'table', label: 'Tabela', icon: Layers, path: '/table', color: 'bg-pastel-purple' },
    { id: 'analytics', label: 'Análises', icon: BarChart2, path: '/analytics', color: 'bg-pastel-purple' },
  ]

  return (
    <aside className="w-20 bg-white dark:bg-neutral-950 border-r border-slate-200 dark:border-neutral-900 h-screen fixed left-0 top-0 flex flex-col items-center py-6 z-10 transition-colors duration-300">
      {/* Brand Icon */}
      <div className="mb-8">
        <div className="w-14 h-14 bg-pastel-purple rounded-full flex items-center justify-center shadow-lg shadow-purple-500/20">
          <BookOpen className="text-slate-900 w-7 h-7" />
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 flex flex-col gap-2 w-full px-3">
        {menuItems.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.id}
              to={item.path}
              className={({ isActive }) =>
                `w-full aspect-square flex items-center justify-center rounded-lg transition-all group relative ${
                  isActive
                    ? `${item.color} text-slate-900 shadow-md`
                    : 'text-slate-400 dark:text-neutral-400 hover:bg-slate-100 dark:hover:bg-neutral-900 hover:text-slate-700 dark:hover:text-white'
                }`
              }
              title={item.label}
            >
              <Icon size={20} />
              {/* Tooltip */}
              <span className="absolute left-full ml-3 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-opacity z-50">
                {item.label}
              </span>
            </NavLink>
          )
        })}
      </nav>

       {/* Theme Toggle & Add */}
       <div className="w-full px-3 flex flex-col gap-4 mb-6">
         {/* Theme Toggle */}
         <button 
            onClick={toggleTheme}
            className="w-full aspect-square flex items-center justify-center bg-slate-100 dark:bg-neutral-900 text-slate-600 dark:text-neutral-400 rounded-lg hover:bg-slate-200 dark:hover:bg-neutral-800 transition-colors"
            title={theme === 'dark' ? 'Mudar para Claro' : 'Mudar para Escuro'}
         >
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
         </button>

         {/* Add Button */}
         <button 
            onClick={onAddBook}
            className="w-full aspect-square flex items-center justify-center bg-pastel-green hover:bg-green-300 text-slate-900 rounded-lg transition-all shadow-lg shadow-green-500/20 group relative"
            title="Novo Livro"
         >
            <PlusCircle size={20} />
            <span className="absolute left-full ml-3 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-opacity z-50">
              Novo Livro
            </span>
         </button>
      </div>

      {/* User Avatar - Settings Link */}
      <div className="w-full px-3">
        <div 
            onClick={() => navigate('/settings')}
            className="w-full aspect-square rounded-full bg-slate-200 dark:bg-neutral-800 flex items-center justify-center text-slate-700 dark:text-neutral-400 text-sm font-bold cursor-pointer hover:scale-105 hover:bg-slate-300 dark:hover:bg-neutral-700 transition-all border border-slate-300 dark:border-neutral-700 relative group" 
            title="Configurações"
        >
          VF
          <span className="absolute left-full ml-3 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-opacity z-50">
                Configurações
          </span>
        </div>
      </div>
    </aside>
  )
}
