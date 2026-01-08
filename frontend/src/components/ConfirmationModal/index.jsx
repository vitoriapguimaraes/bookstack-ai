import { createPortal } from "react-dom";
import { AlertTriangle } from "lucide-react";

export default function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title = "Tem certeza?",
  description = "Essa ação não pode ser desfeita.",
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  isDanger = false,
  isLoading = false,
}) {
  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200 dark:border-neutral-800 animate-scale-in">
        <div className="flex flex-col items-center text-center gap-4">
          <div
            className={`p-3 rounded-full ${
              isDanger
                ? "bg-red-100 dark:bg-red-900/30 text-red-600"
                : "bg-purple-100 dark:bg-purple-900/30 text-purple-600"
            }`}
          >
            <AlertTriangle size={32} />
          </div>

          <div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">
              {title}
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {description}
            </p>
          </div>

          <div className="flex gap-3 w-full mt-4">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 rounded-lg font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-neutral-800 hover:bg-slate-200 dark:hover:bg-neutral-700 transition-all"
              disabled={isLoading}
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              disabled={isLoading}
              className={`flex-1 px-4 py-3 rounded-lg font-bold text-white transition-all shadow-lg flex items-center justify-center ${
                isDanger
                  ? "bg-red-600 hover:bg-red-700 shadow-red-500/30"
                  : "bg-purple-600 hover:bg-purple-700 shadow-purple-500/30"
              }`}
            >
              {isLoading ? "Processando..." : confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
