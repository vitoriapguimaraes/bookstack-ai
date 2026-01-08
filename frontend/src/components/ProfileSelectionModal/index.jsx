import { X, Check, Sparkles } from "lucide-react";
import {
  AVATAR_ICONS,
  AVATAR_LABELS,
  AVATAR_COLORS,
  AVATAR_BACKGROUNDS,
} from "../../utils/avatarIcons";
import { useAuth } from "../../context/AuthContext";
import { createPortal } from "react-dom";

export default function ProfileSelectionModal({ isOpen, onClose }) {
  const {
    userAvatar,
    setUserAvatar,
    userAvatarColor,
    setUserAvatarColor,
    userAvatarBg,
    setUserAvatarBg,
  } = useAuth();

  if (!isOpen) return null;

  // Resolve current visual classes
  const CurrentIcon = AVATAR_ICONS[userAvatar] || AVATAR_ICONS["User"];
  const currentColorObj =
    AVATAR_COLORS.find((c) => c.id === userAvatarColor) || AVATAR_COLORS[0];
  const currentBgObj =
    AVATAR_BACKGROUNDS.find((b) => b.id === userAvatarBg) ||
    AVATAR_BACKGROUNDS[0];

  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl w-full max-w-6xl relative animate-scale-in border border-slate-200 dark:border-neutral-800 flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 dark:border-neutral-800 flex items-center justify-between shrink-0">
          <div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-white">
              Personalize seu Avatar
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Crie uma identidade única para seu perfil.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-neutral-800 rounded-full transition-colors text-slate-500"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content (3 Columns Layout) */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden divide-y lg:divide-y-0 lg:divide-x divide-slate-100 dark:divide-neutral-800">
          {/* COLUMN 1: PREVIEW */}
          <div className="w-full lg:w-1/4 bg-slate-50 dark:bg-neutral-800/30 p-6 flex flex-col items-center lg:justify-center shrink-0 border-b border-slate-100 dark:border-neutral-800 lg:border-b-0">
            <div className="flex flex-row lg:flex-col items-center justify-between lg:justify-center w-full sticky top-0 gap-4">
              {/* Details (Left on Mobile, Bottom on Desktop) */}
              <div className="text-left lg:text-center order-1 lg:order-2 lg:mt-8 flex-1 lg:flex-none">
                <label className="text-sm font-bold text-slate-700 dark:text-neutral-300 uppercase tracking-wider flex items-center justify-start lg:justify-center gap-2 mb-1 lg:mb-2">
                  Resultado
                </label>
                <p className="text-sm text-slate-500 mt-1 leading-tight">
                  {AVATAR_LABELS[userAvatar] || "Avatar Atual"}
                </p>
                <p className="text-sm text-slate-500 mt-1 leading-tight">
                  {currentColorObj.label} • {currentBgObj.label}
                </p>
              </div>

              {/* Icon (Right on Mobile, Top on Desktop) */}
              <div
                className={`order-2 lg:order-1 w-20 h-20 lg:w-48 lg:h-48 rounded-full border-4 lg:border-8 border-white dark:border-neutral-700 shadow-lg lg:shadow-2xl flex items-center justify-center transition-all duration-300 ${currentBgObj.class}`}
              >
                <CurrentIcon
                  className={`w-10 h-10 lg:w-24 lg:h-24 transition-all duration-300 ${currentColorObj.class}`}
                  strokeWidth={1.5}
                />
              </div>
            </div>
          </div>

          {/* WRAPPER FOR OPTIONS (Scrollable on Mobile, Columns on Desktop) */}
          <div className="flex-1 flex flex-col lg:flex-row w-full lg:w-3/4 overflow-y-auto lg:overflow-hidden divide-y lg:divide-y-0 lg:divide-x divide-slate-100 dark:divide-neutral-800">
            {/* COLUMN 2: ICONS */}
            <div className="w-full lg:w-[55%] lg:h-full p-6 lg:p-8 lg:overflow-y-auto bg-white dark:bg-neutral-900">
              <div className="space-y-4">
                <div className="flex items-center justify-between py-2">
                  <label className="text-sm font-bold text-slate-700 dark:text-neutral-300 uppercase tracking-wider flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-slate-100 dark:bg-neutral-800 flex items-center justify-center text-xs">
                      1
                    </span>
                    Escolha o Ícone
                  </label>
                  <span className="text-xs text-slate-400 bg-slate-100 dark:bg-neutral-800 px-2 py-1 rounded-full">
                    {Object.keys(AVATAR_ICONS).length} opções
                  </span>
                </div>

                <div className="grid grid-cols-4 sm:grid-cols-5 gap-3 pb-4">
                  {Object.keys(AVATAR_ICONS).map((iconKey) => {
                    const Icon = AVATAR_ICONS[iconKey];
                    const isSelected = userAvatar === iconKey;
                    return (
                      <button
                        key={iconKey}
                        onClick={() => setUserAvatar(iconKey)}
                        className={`group aspect-square rounded-xl flex flex-col items-center justify-center gap-1 border transition-all ${
                          isSelected
                            ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 shadow-sm ring-2 ring-purple-500/20"
                            : "border-slate-100 dark:border-neutral-800 bg-white dark:bg-neutral-800/50 text-slate-400 dark:text-neutral-500 hover:bg-slate-50 dark:hover:bg-neutral-800 hover:text-slate-700 dark:hover:text-neutral-300 hover:border-slate-300"
                        }`}
                        title={AVATAR_LABELS[iconKey]}
                      >
                        <Icon size={28} strokeWidth={1.5} />
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* COLUMN 3: COLORS */}
            <div className="w-full lg:w-[45%] lg:h-full p-6 lg:p-8 lg:overflow-y-auto bg-slate-50/50 dark:bg-neutral-900/50">
              <div className="space-y-6">
                {/* 2. ICON COLOR */}
                <div className="space-y-3">
                  <label className="text-sm font-bold text-slate-700 dark:text-neutral-300 uppercase tracking-wider flex items-center gap-2 py-2">
                    <span className="w-6 h-6 rounded-full bg-slate-200 dark:bg-neutral-700 flex items-center justify-center text-xs">
                      2
                    </span>
                    Cor do Ícone
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {AVATAR_COLORS.map((color) => {
                      const isSelected = userAvatarColor === color.id;
                      return (
                        <button
                          key={color.id}
                          onClick={() => setUserAvatarColor(color.id)}
                          className={`w-8 h-8 rounded-full flex items-center justify-center transition-transform hover:scale-110 ${
                            isSelected
                              ? "ring-2 ring-offset-2 ring-slate-400 dark:ring-neutral-500 scale-110 shadow-md"
                              : "hover:shadow-sm"
                          }`}
                          style={{ backgroundColor: color.hex }}
                          title={color.label}
                        >
                          {isSelected && (
                            <Check
                              size={14}
                              className="text-white drop-shadow-md"
                            />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 3. BACKGROUND COLOR */}
                <div className="space-y-3">
                  <label className="text-sm font-bold text-slate-700 dark:text-neutral-300 uppercase tracking-wider flex items-center gap-2 py-2">
                    <span className="w-6 h-6 rounded-full bg-slate-200 dark:bg-neutral-700 flex items-center justify-center text-xs">
                      3
                    </span>
                    Cor de Fundo
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {AVATAR_BACKGROUNDS.map((bg) => {
                      const isSelected = userAvatarBg === bg.id;
                      return (
                        <button
                          key={bg.id}
                          onClick={() => setUserAvatarBg(bg.id)}
                          className={`w-8 h-8 rounded-full flex items-center justify-center transition-transform hover:scale-110 border border-slate-200 dark:border-neutral-700 ${
                            isSelected
                              ? "ring-2 ring-offset-2 ring-slate-400 dark:ring-neutral-500 scale-110 shadow-md"
                              : "hover:shadow-sm"
                          }`}
                          style={{ backgroundColor: bg.hex }}
                          title={bg.label}
                        >
                          {isSelected && (
                            <Check
                              size={14}
                              className={
                                bg.id === "white" ||
                                bg.hex === "#ffffff" ||
                                bg.hex === "#f1f5f9"
                                  ? "text-slate-800"
                                  : "text-white drop-shadow-md"
                              }
                            />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-neutral-800 flex justify-end bg-white dark:bg-neutral-900 shrink-0">
          <button
            onClick={onClose}
            className="px-8 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold rounded-xl hover:opacity-90 transition-opacity shadow-lg"
          >
            Concluído
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
