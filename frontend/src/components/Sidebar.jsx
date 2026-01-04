import { BookOpen, Layers, LayoutGrid, BarChart2, PlusCircle } from 'lucide-react'
import { NavLink, useNavigate } from 'react-router-dom'

export default function Sidebar({ onAddBook }) {
  const navigate = useNavigate()
  
  const menuItems = [
    { id: 'mural', label: 'Mural', icon: LayoutGrid, path: '/mural/lendo' },
    { id: 'table', label: 'Tabela', icon: Layers, path: '/table' },
    { id: 'analytics', label: 'Análises', icon: BarChart2, path: '/analytics' },
  ]

  return (
    <aside className="w-20 bg-neutral-950 border-r border-neutral-900 h-screen fixed left-0 top-0 flex flex-col items-center py-6 z-10">
      {/* Brand Icon */}
      <div className="mb-8">
        <div className="w-14 h-14 bg-gradient-to-br from-purple-600 to-purple-500 rounded-full flex items-center justify-center shadow-lg shadow-purple-500/30">
          <BookOpen className="text-white w-7 h-7" />
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
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30'
                    : 'text-neutral-400 hover:bg-neutral-900 hover:text-white'
                }`
              }
              title={item.label}
            >
              <Icon size={20} />
              {/* Tooltip */}
              <span className="absolute left-full ml-3 px-2 py-1 bg-neutral-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-opacity">
                {item.label}
              </span>
            </NavLink>
          )
        })}
      </nav>

      {/* Add Button */}
      <div className="mb-6 w-full px-3">
         <button 
            onClick={onAddBook}
            className="w-full aspect-square flex items-center justify-center bg-gradient-to-br from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white rounded-lg transition-all shadow-lg shadow-purple-500/30 group relative"
            title="Novo Livro"
         >
            <PlusCircle size={20} />
            <span className="absolute left-full ml-3 px-2 py-1 bg-neutral-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-opacity">
              Novo Livro
            </span>
         </button>
      </div>

      {/* User Avatar */}
      <div className="w-full px-3">
        <div className="w-full aspect-square rounded-full bg-gradient-to-br from-purple-600 to-purple-500 flex items-center justify-center text-white text-sm font-bold shadow-lg cursor-pointer hover:scale-105 transition-transform" title="Vitória">
          VF
        </div>
      </div>
    </aside>
  )
}
