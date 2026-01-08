import { Outlet, NavLink, useLocation, useNavigate } from "react-router-dom";
import { createPortal } from "react-dom";
import {
  Brain,
  Calculator,
  List,
  Settings,
  Info,
  User,
  Sparkles,
  LayoutDashboard,
  Sliders,
  LogOut,
  Shield,
  AlertTriangle,
  Layers,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useState } from "react";

export default function SettingsLayout({ onEdit }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut, isAdmin } = useAuth();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleLogout = async () => {
    setShowLogoutModal(false);
    await signOut();
    navigate("/login");
  };

  const getCurrentSection = () => {
    const path = location.pathname.split("/").pop();
    const map = {
      overview: "Visão Geral",
      ai: "IA & Prompts",
      formula: "Fórmula de Score",
      lists: "Listas e Opções",
      availability: "Disponibilidade",
      audit: "Auditoria de Dados",
      preferences: "Preferências",
      administrador: "Painel do Administrador",
    };
    return map[path] || "Configurações";
  };

  return (
    <div className="flex flex-col md:flex-row w-full h-full animate-fade-in min-h-[calc(100vh-6rem)]">
      {/* Sidebar Navigation (Desktop) */}
      <aside className="hidden md:flex flex-col w-72 flex-shrink-0 border-r border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/30 p-4 md:pl-8 md:pt-8 md:pr-6 sticky top-0 h-screen overflow-y-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-2">
            Configurações
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2">
            Gerencie regras, IA e preferências.
          </p>
        </div>

        <nav className="flex flex-col gap-1 space-y-0.5">
          <SidebarItem
            to="overview"
            title="Visão Geral"
            subtitle="Status do sistema"
            icon={LayoutDashboard}
          />

          <div className="h-px bg-slate-100 dark:bg-neutral-800 my-1 mx-2" />

          <SidebarItem
            to="ai"
            title="IA & Inteligência"
            subtitle="Prompts e modelos"
            icon={Sparkles}
          />
          <SidebarItem
            to="formula"
            title="Fórmula de Score"
            subtitle="Pesos e ordenação"
            icon={Calculator}
          />
          <SidebarItem
            to="lists"
            title="Listas e Campos"
            subtitle="Classes e categorias"
            icon={List}
          />
          <SidebarItem
            to="availability"
            title="Disponibilidade"
            subtitle="Opções de Status"
            icon={Layers}
          />
          <SidebarItem
            to="audit"
            title="Auditoria"
            subtitle="Consistência de dados"
            icon={Shield}
          />

          <div className="h-px bg-slate-100 dark:bg-neutral-800 my-1 mx-2" />

          {isAdmin && (
            <SidebarItem
              to="administrador"
              title="Painel do Administrador"
              subtitle="Gestão de Usuários"
              icon={Shield}
            />
          )}

          <SidebarItem
            to="preferences"
            title="Preferências"
            subtitle="Aparência e perfil"
            icon={User}
          />

          <button
            onClick={() => setShowLogoutModal(true)}
            className="group flex w-full items-center gap-3 p-2.5 rounded-lg transition-all duration-200 hover:bg-red-50 dark:hover:bg-red-900/20 border border-transparent text-left mt-2"
          >
            <div className="p-1.5 rounded-lg transition-colors bg-slate-100 dark:bg-neutral-800 text-slate-500 dark:text-slate-400 group-hover:bg-red-100 dark:group-hover:bg-red-900/30 group-hover:text-red-500 dark:group-hover:text-red-400">
              <LogOut size={16} />
            </div>
            <div>
              <h3 className="text-xs font-semibold transition-colors text-slate-600 dark:text-slate-400 group-hover:text-red-600 dark:group-hover:text-red-300">
                Sair da Conta
              </h3>
            </div>
          </button>
        </nav>
      </aside>

      {/* Mobile Navigation (Tabs) */}
      <div className="md:hidden flex overflow-x-auto bg-white dark:bg-neutral-900 border-b border-slate-200 dark:border-neutral-800 p-2 gap-2 sticky top-0 z-30">
        <MobileTab to="overview" label="Visão" icon={LayoutDashboard} />
        <MobileTab to="ai" label="IA" icon={Sparkles} />
        <MobileTab to="formula" label="Score" icon={Calculator} />
        <MobileTab to="lists" label="Listas" icon={List} />
        <MobileTab to="availability" label="Disp." icon={Layers} />
        <MobileTab to="audit" label="Audit" icon={Shield} />

        <MobileTab to="preferences" label="Pref." icon={User} />
        <button
          onClick={() => setShowLogoutModal(true)}
          className="flex items-center justify-center p-2.5 flex-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all text-slate-500 dark:text-neutral-500 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 dark:hover:text-red-400"
          title="Sair"
        >
          <LogOut size={20} />
        </button>
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

          <Outlet context={{ onEdit }} />
        </div>
      </main>

      {/* Logout Confirmation Modal - Portal to Body */}
      {showLogoutModal &&
        createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
            <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200 dark:border-neutral-800 animate-scale-in">
              <div className="flex flex-col items-center text-center gap-4">
                <div className="p-3 rounded-full bg-red-100 dark:bg-red-900/30">
                  <AlertTriangle
                    size={32}
                    className="text-red-600 dark:text-red-400"
                  />
                </div>

                <div>
                  <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">
                    Sair da Conta?
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Tem certeza que deseja sair da sua conta? Você precisará
                    fazer login novamente para acessar o sistema.
                  </p>
                </div>

                <div className="flex gap-3 w-full mt-2">
                  <button
                    onClick={() => setShowLogoutModal(false)}
                    className="flex-1 px-4 py-2.5 rounded-lg font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-neutral-800 hover:bg-slate-200 dark:hover:bg-neutral-700 transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleLogout}
                    className="flex-1 px-4 py-2.5 rounded-lg font-semibold text-white bg-red-600 hover:bg-red-700 transition-all shadow-lg shadow-red-500/30"
                  >
                    Sair
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}

function SidebarItem({ to, title, subtitle, icon: Icon }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) => `
                group flex items-center gap-3 p-2.5 rounded-lg transition-all duration-200
                ${
                  isActive
                    ? "bg-white dark:bg-neutral-800 shadow-sm border border-slate-200 dark:border-neutral-700"
                    : "hover:bg-slate-50 dark:hover:bg-neutral-800/50 border border-transparent"
                }
            `}
    >
      {({ isActive }) => (
        <>
          <div
            className={`p-1.5 rounded-lg transition-colors flex-shrink-0 ${
              isActive
                ? "bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400"
                : "bg-slate-100 dark:bg-neutral-800 text-slate-500 dark:text-slate-400 group-hover:bg-white dark:group-hover:bg-neutral-700 group-hover:text-purple-500 dark:group-hover:text-purple-300"
            }`}
          >
            <Icon size={18} />
          </div>
          <div>
            <h3
              className={`text-xs font-semibold transition-colors ${
                isActive
                  ? "text-slate-900 dark:text-white"
                  : "text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-200"
              }`}
            >
              {title}
            </h3>
            <p className="text-[10px] text-slate-500 dark:text-slate-500 font-medium truncate max-w-[140px]">
              {subtitle}
            </p>
          </div>
          {isActive && (
            <div className="ml-auto w-1.5 h-1.5 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.5)]" />
          )}
        </>
      )}
    </NavLink>
  );
}

function MobileTab({ to, label, icon: Icon }) {
  return (
    <NavLink
      to={to}
      title={label}
      className={({ isActive }) => `
                flex items-center justify-center p-2.5 flex-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all
                ${
                  isActive
                    ? "bg-white dark:bg-neutral-800 text-purple-600 dark:text-purple-400 shadow-sm border border-slate-200 dark:border-neutral-700"
                    : "text-slate-500 dark:text-neutral-500 hover:bg-slate-100 dark:hover:bg-neutral-800"
                }
            `}
    >
      <Icon size={20} />
      <span className="sr-only">{label}</span>
    </NavLink>
  );
}
