import { useState, useEffect } from "react";
import { Target, Save, User, Copy, ShieldAlert, Smile } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../services/api";
import { useToast } from "../../context/ToastContext";
import {
  AVATAR_ICONS,
  AVATAR_COLORS,
  AVATAR_BACKGROUNDS,
} from "../../utils/avatarIcons";
import ProfileSelectionModal from "../../components/ProfileSelectionModal";

export default function PreferencesSettings() {
  const { user, userAvatar, userAvatarColor, userAvatarBg } = useAuth();
  const { addToast } = useToast();
  const [yearlyGoal, setYearlyGoal] = useState(20);
  const [isSaved, setIsSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const CurrentAvatar = AVATAR_ICONS[userAvatar] || AVATAR_ICONS["User"];
  const currentColorObj =
    AVATAR_COLORS.find((c) => c.id === userAvatarColor) || AVATAR_COLORS[0];
  const currentBgObj =
    AVATAR_BACKGROUNDS.find((b) => b.id === userAvatarBg) ||
    AVATAR_BACKGROUNDS[0];

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    try {
      const res = await api.get("/preferences/");
      if (res.data?.yearly_goal) {
        setYearlyGoal(res.data.yearly_goal);
      }
    } catch (err) {
      console.error("Erro ao carregar preferências:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      await api.put("/preferences/", { yearly_goal: yearlyGoal });
      localStorage.setItem("yearlyReadingGoal", yearlyGoal.toString()); // Keep sync for now
      setIsSaved(true);
      addToast({
        type: "success",
        message: "Preferências salvas com sucesso!",
      });
      setTimeout(() => setIsSaved(false), 2000);
    } catch (err) {
      console.error("Erro ao salvar:", err);
      addToast({
        type: "error",
        message: "Erro ao salvar preferências no servidor.",
      });
    }
  };

  const handleCopyId = () => {
    if (user?.id) {
      navigator.clipboard.writeText(user.id);
      setCopied(true);
      addToast({
        type: "success",
        message: "ID copiado para a área de transferência",
        duration: 2000,
      });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="w-full animate-fade-in space-y-6">
      <div className="hidden md:block">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">
          Preferências
        </h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
          Configure suas preferências pessoais e gerencie sua conta
        </p>
      </div>

      {/* Identity Card (Avatar) */}
      <div className="bg-white dark:bg-neutral-900 rounded-lg border border-slate-200 dark:border-neutral-800 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
            <Smile className="text-purple-600 dark:text-purple-400" size={20} />
          </div>
          <div>
            <h3 className="text-base md:text-lg font-semibold text-slate-800 dark:text-white leading-tight">
              Identidade Visual
            </h3>
            <p className="text-sm text-slate-500 dark:text-neutral-400">
              Como você aparece no sistema
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div
            className="relative group cursor-pointer"
            onClick={() => setIsProfileModalOpen(true)}
          >
            <div
              className={`w-24 h-24 rounded-full border-4 border-white dark:border-neutral-700 shadow-lg flex items-center justify-center overflow-hidden transition-transform group-hover:scale-105 ${currentBgObj.class}`}
            >
              <CurrentAvatar
                size={48}
                className={currentColorObj.class}
                strokeWidth={1.5}
              />
            </div>
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="text-white text-xs font-bold uppercase tracking-wider">
                Alterar
              </span>
            </div>
          </div>

          <div className="flex-1 text-center sm:text-left space-y-3">
            <button
              onClick={() => setIsProfileModalOpen(true)}
              className="px-4 py-2 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 rounded-lg text-sm font-bold border border-purple-200 dark:border-purple-800 hover:bg-purple-100 dark:hover:bg-purple-900/40 transition-colors"
            >
              Escolher Novo Ícone
            </button>
          </div>
        </div>
      </div>

      {/* User Account Card */}
      <div className="bg-white dark:bg-neutral-900 rounded-lg border border-slate-200 dark:border-neutral-800 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <User className="text-blue-600 dark:text-blue-400" size={20} />
          </div>
          <div>
            <h3 className="text-base md:text-lg font-semibold text-slate-800 dark:text-white leading-tight">
              Conta do Usuário
            </h3>
            <p className="text-sm text-slate-500 dark:text-neutral-400">
              Informações de identificação da sua conta
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-neutral-400 mb-1 uppercase tracking-wider">
              Email
            </label>
            <div className="px-4 py-3 bg-slate-50 dark:bg-neutral-800 rounded-lg border border-slate-200 dark:border-neutral-700 text-slate-800 dark:text-white font-medium">
              {user?.email || "Email não disponível"}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-neutral-400 mb-1 uppercase tracking-wider">
              User ID (UUID)
            </label>
            <div className="flex gap-2">
              <div className="flex-1 px-4 py-3 bg-slate-50 dark:bg-neutral-800 rounded-lg border border-slate-200 dark:border-neutral-700 text-slate-600 dark:text-neutral-400 font-mono text-sm truncate">
                {user?.id || "ID não disponível"}
              </div>
              <button
                onClick={handleCopyId}
                className="px-4 py-2 bg-slate-100 dark:bg-neutral-800 hover:bg-slate-200 dark:hover:bg-neutral-700 rounded-lg border border-slate-200 dark:border-neutral-700 transition-colors flex items-center justify-center text-slate-600 dark:text-slate-300"
                title="Copiar ID"
              >
                {copied ? (
                  <span className="text-emerald-600 font-bold text-xs">
                    Copiado!
                  </span>
                ) : (
                  <Copy size={18} />
                )}
              </button>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Necessário para suporte ou migração de dados.
            </p>
          </div>
        </div>
      </div>

      {/* Reading Goal Card */}
      <div className="bg-white dark:bg-neutral-900 rounded-lg border border-slate-200 dark:border-neutral-800 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <Target
              className="text-purple-600 dark:text-purple-400"
              size={20}
            />
          </div>
          <div>
            <h3 className="text-base md:text-lg font-semibold text-slate-800 dark:text-white leading-tight">
              Meta Anual de Leitura
            </h3>
            <p className="text-sm text-slate-500 dark:text-neutral-400">
              Defina quantos livros você deseja ler por ano.
            </p>
          </div>
        </div>

        <div className="flex flex-col md:grid md:grid-cols-12 gap-6">
          <div className="md:col-span-6">
            <div className="text-center p-4 bg-slate-50 dark:bg-neutral-800/50 rounded-lg border border-slate-200 dark:border-neutral-700">
              <p className="text-xs text-slate-500 dark:text-neutral-400 mb-1">
                Meta Atual
              </p>
              <p className="text-2xl font-bold text-slate-800 dark:text-white">
                {yearlyGoal}
              </p>
              <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1">
                {yearlyGoal === 1 ? "livro" : "livros"} por ano
              </p>
            </div>
          </div>

          <div className="md:col-span-6">
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-slate-700 dark:text-neutral-300 whitespace-nowrap">
                  Nova meta
                </label>
                <input
                  type="number"
                  min="1"
                  max="365"
                  value={yearlyGoal}
                  onChange={(e) => setYearlyGoal(parseInt(e.target.value) || 1)}
                  className="flex-1 px-4 py-2 bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-lg text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <button
                onClick={handleSave}
                className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isSaved
                    ? "bg-emerald-600 text-white"
                    : "bg-purple-600 hover:bg-purple-700 text-white"
                }`}
              >
                <Save size={16} />
                {isSaved ? "Salvo!" : "Salvar"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-red-50 dark:bg-red-900/10 rounded-lg border border-red-200 dark:border-red-900/30 p-6 opacity-75 hover:opacity-100 transition-opacity">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
            <ShieldAlert className="text-red-600 dark:text-red-400" size={20} />
          </div>
          <h3 className="text-lg font-semibold text-red-700 dark:text-red-400">
            Zona de Perigo
          </h3>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-red-600 dark:text-red-300 font-medium">
              Resetar Conta
            </p>
            <p className="text-xs text-red-500 dark:text-red-400">
              Apagar todos os livros e começar do zero.
            </p>
          </div>
          <button className="px-4 py-2 bg-white dark:bg-neutral-900 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm font-bold rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors uppercase tracking-wider">
            Em Breve
          </button>
        </div>
      </div>

      <ProfileSelectionModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />
    </div>
  );
}
