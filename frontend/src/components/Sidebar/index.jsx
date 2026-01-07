import {
  BookOpen,
  Layers,
  LayoutGrid,
  BarChart2,
  PlusCircle,
  Sun,
  Moon,
  Library,
  CheckCircle2,
  Home,
  X,
  Shield,
  Info,
} from "lucide-react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";

export default function Sidebar({ onAddBook, isOpen, onClose }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const { isAdmin } = useAuth();

  const menuItems = [
    {
      id: "home",
      label: "Início",
      icon: Home,
      path: "/",
      color: "bg-pastel-blue",
    },
    {
      id: "reading",
      label: "Lendo",
      icon: BookOpen,
      path: "/mural/reading",
      color: "bg-pastel-purple",
    },
    {
      id: "to-read",
      label: "Fila",
      icon: Library,
      path: "/mural/to-read",
      color: "bg-pastel-orange",
    },
    {
      id: "read",
      label: "Lidos",
      icon: CheckCircle2,
      path: "/mural/read",
      color: "bg-pastel-green",
    },
    {
      id: "table",
      label: "Tabela",
      icon: Layers,
      path: "/table",
      color: "bg-pastel-purple",
    },
    {
      id: "analytics",
      label: "Análises",
      icon: BarChart2,
      path: "/analytics",
      color: "bg-pastel-purple",
    },
    {
      id: "guide",
      label: "Guia",
      icon: Info,
      path: "/guide",
      color: "bg-pastel-blue",
    },
  ];

  const handleLinkClick = () => {
    // Close sidebar on mobile when a link is clicked
    if (window.innerWidth < 768 && onClose) {
      onClose();
    }
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden animate-fade-in"
          onClick={onClose}
        ></div>
      )}

      <aside
        className={`w-64 md:w-20 bg-white dark:bg-neutral-950 border-r border-slate-200 dark:border-neutral-900 h-screen fixed left-0 top-0 flex flex-col items-center py-6 z-50 transition-all duration-300 shadow-2xl md:shadow-none
            ${isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        `}
      >
        {/* Mobile Close Button */}
        <div className="md:hidden w-full flex justify-end px-4 mb-4">
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-neutral-200"
          >
            <X size={24} />
          </button>
        </div>

        {/* Mobile Brand Title */}
        <div className="md:hidden w-full px-6 mb-6 mt-2">
          <h2 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-500 bg-clip-text text-transparent">
            bookstack-ai
          </h2>
        </div>

        {/* Main Navigation */}
        <nav className="flex-1 flex flex-col gap-2 w-full px-3 overflow-y-auto md:overflow-visible">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isHome = item.id === "home";
            return (
              <NavLink
                key={item.id}
                to={item.path}
                onClick={handleLinkClick}
                className={({ isActive }) =>
                  isHome
                    ? `w-full md:aspect-square flex md:flex-col flex-row items-center md:justify-center justify-start gap-4 md:gap-0 px-4 md:px-0 py-3 md:py-0 rounded-lg transition-all group relative ${
                        isActive
                          ? "bg-slate-100 dark:bg-neutral-800 shadow-sm md:shadow-lg"
                          : "hover:bg-slate-50 dark:hover:bg-neutral-800"
                      }`
                    : `w-full md:aspect-square flex md:flex-col flex-row items-center md:justify-center justify-start gap-4 md:gap-0 px-4 md:px-0 py-3 md:py-0 rounded-lg transition-all group relative ${
                        isActive
                          ? `${item.color} text-slate-900 shadow-sm md:shadow-md`
                          : "text-slate-500 dark:text-neutral-400 hover:bg-slate-100 dark:hover:bg-neutral-900 hover:text-slate-700 dark:hover:text-white"
                      }`
                }
                title={item.label}
              >
                {isHome ? (
                  <>
                    <div className="w-8 h-8 md:w-full md:h-full md:p-2 flex items-center justify-center shrink-0">
                      <img
                        src="/logo_bookstack-ai.png"
                        alt="Home"
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <span className="md:hidden font-bold text-slate-700 dark:text-neutral-200">
                      Início
                    </span>
                  </>
                ) : (
                  <>
                    <Icon
                      size={24}
                      className="md:w-[20px] md:h-[20px] shrink-0"
                    />
                    <span className="md:hidden font-medium">{item.label}</span>
                  </>
                )}

                {/* Tooltip (Desktop Only) */}
                <span className="hidden md:block absolute left-full ml-3 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-opacity z-50">
                  {item.label}
                </span>
              </NavLink>
            );
          })}
        </nav>

        {/* Theme Toggle & Add */}
        <div className="w-full px-3 flex flex-col gap-4 mb-6 mt-auto">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="w-full md:aspect-square flex md:flex-col flex-row items-center md:justify-center justify-start gap-4 md:gap-0 px-4 md:px-0 py-3 md:py-0 bg-slate-100 dark:bg-neutral-900 text-slate-600 dark:text-neutral-400 rounded-lg hover:bg-slate-200 dark:hover:bg-neutral-800 transition-colors"
          >
            {theme === "dark" ? (
              <Sun size={24} className="md:w-[20px] md:h-[20px]" />
            ) : (
              <Moon size={24} className="md:w-[20px] md:h-[20px]" />
            )}
            <span className="md:hidden font-medium">Alternar Tema</span>
          </button>

          {/* Add Button */}
          <button
            onClick={() => {
              onAddBook();
              if (window.innerWidth < 768 && onClose) onClose();
            }}
            className="w-full md:aspect-square flex md:flex-col flex-row items-center md:justify-center justify-start gap-4 md:gap-0 px-4 md:px-0 py-3 md:py-0 bg-pastel-purple hover:bg-purple-400 text-slate-900 hover:text-white rounded-lg transition-all shadow-md shadow-purple-500/20 hover:shadow-lg hover:shadow-purple-500/40 group relative"
          >
            <PlusCircle size={24} className="md:w-[20px] md:h-[20px]" />
            <span className="md:hidden font-bold">Novo Livro</span>
            <span className="hidden md:block absolute left-full ml-3 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-opacity z-50">
              Novo Livro
            </span>
          </button>
        </div>

        {/* User Avatar - Settings Link */}
        <div className="w-full px-3 flex flex-col gap-2">
          <div
            onClick={() => {
              navigate("/settings");
              if (window.innerWidth < 768 && onClose) onClose();
            }}
            className="w-full md:aspect-square flex md:flex-col flex-row items-center md:justify-center justify-start gap-4 md:gap-0 px-4 md:px-0 py-3 md:py-2 rounded-full md:rounded-full bg-slate-200 dark:bg-neutral-800 text-slate-700 dark:text-neutral-400 text-sm font-bold cursor-pointer hover:bg-slate-300 dark:hover:bg-neutral-700 transition-all border border-slate-300 dark:border-neutral-700 relative group"
          >
            <div className="w-8 h-8 rounded-full bg-slate-300 dark:bg-neutral-700 flex items-center justify-center shrink-0">
              VF
            </div>
            <span className="md:hidden font-medium">Configurações</span>

            <span className="hidden md:block absolute left-full ml-3 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-opacity z-50">
              Configurações
            </span>
          </div>
        </div>
      </aside>
    </>
  );
}
