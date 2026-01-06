import { Menu, PlusCircle, Sun, Moon } from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'
import { useLocation } from 'react-router-dom'
import { useMemo } from 'react'

export default function MobileHeader({ onMenuClick, onAddBook }) {
  const { theme, toggleTheme } = useTheme()
  const location = useLocation()

  const pageTitle = useMemo(() => {
     const path = location.pathname
     if (path === '/') return 'Minha Estante Virtual'
     if (path.startsWith('/mural')) return 'Mural de Livros'
     if (path === '/table') return 'Tabela'
     if (path === '/analytics') return 'Análises'
     if (path === '/create') return 'Adicionar Novo Livro'
     if (path === '/edit') return 'Editar Livro'
     if (path.startsWith('/settings')) return 'Configurações'
     return 'BookStack'
  }, [location.pathname])

  return (
    <header className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white dark:bg-neutral-950 border-b border-slate-200 dark:border-neutral-800 z-40 flex items-center justify-between px-4 transition-colors duration-300">
      <div className="flex items-center gap-3">
        <button 
          onClick={onMenuClick}
          className="p-2 -ml-2 text-slate-600 dark:text-neutral-400 hover:bg-slate-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
        >
          <Menu size={24} />
        </button>
        <div className="h-8 w-px bg-slate-200 dark:bg-neutral-800 mx-1"></div>
        <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-slate-800 dark:text-white">
                {pageTitle}
            </h1>
        </div>
      </div>

      <div className="flex items-center gap-2">
         <button 
            onClick={toggleTheme}
            className="p-2 text-slate-500 dark:text-neutral-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
         >
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
         </button>
         
         <button 
            onClick={onAddBook}
            className="flex items-center gap-1 bg-purple-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-md shadow-purple-500/20 active:scale-95 transition-all"
         >
            <PlusCircle size={16} />
            <span>Novo</span>
         </button>
      </div>
    </header>
  )
}
