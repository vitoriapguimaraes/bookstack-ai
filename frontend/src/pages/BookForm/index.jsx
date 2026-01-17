import { useState } from "react";
import { ArrowLeft, Save, X, Trash2 } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import BookForm from "../../components/BookForm";
import { api } from "../../services/api";
import { useToast } from "../../context/ToastContext";
import { useConfirm } from "../../context/ConfirmationContext";

export default function FormView({
  editingBook,
  books,
  onFormSuccess,
  onCancel,
}) {
  const navigate = useNavigate();
  const { id } = useParams();
  const [isSaving, setIsSaving] = useState(false);
  const { addToast } = useToast();
  const { confirm } = useConfirm();

  // Resolve target book
  const targetBook =
    editingBook || (books && id ? books.find((b) => b.id === id) : null);

  const handleCancel = onCancel || (() => navigate(-1));

  const handleDelete = () => {
    confirm({
      title: "Confirmar Exclusão",
      description: `Tem certeza que deseja excluir "${targetBook.title}"? Esta ação não pode ser desfeita.`,
      confirmText: "Sim, Excluir",
      isDanger: true,
      onConfirm: async () => {
        setIsSaving(true);
        try {
          await api.delete(`/books/${targetBook.id}`);
          addToast({ type: "success", message: "Livro excluído com sucesso!" });
          if (onFormSuccess) onFormSuccess();
          else navigate("/");
        } catch (err) {
          console.error(err);
          addToast({ type: "error", message: "Erro ao excluir livro." });
          setIsSaving(false);
        }
      },
    });
  };

  return (
    <div className="w-full max-w-[1600px] mx-auto p-4 md:p-8 animate-fade-in pb-20">
      {/* Page Header with Actions */}
      <div className="mb-6 md:mb-8 flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div className="hidden md:block">
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
            {targetBook
              ? `Editar: ${targetBook.title}`
              : "Adicionar Livro"}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm">
            {editingBook
              ? "Atualize as informações, status e avaliações desta obra."
              : "Preencha os dados abaixo para cadastrar uma nova obra na sua estante."}
          </p>
        </div>

        {/* Action Buttons - Moved to Header */}
        <div className="flex items-center gap-3 mt-2 md:mt-0 w-full md:w-auto">
          <button
            type="button"
            onClick={handleCancel}
            className="flex-none justify-center flex items-center gap-2 px-3 md:px-4 py-2 bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 text-slate-600 dark:text-neutral-400 rounded-lg hover:bg-slate-50 dark:hover:bg-neutral-700 hover:text-slate-900 dark:hover:text-white transition-colors text-sm font-bold"
            title="Cancelar"
          >
            <X size={18} /> <span className="hidden md:inline">Cancelar</span>
          </button>

          {editingBook && (
            <button
              type="button"
              onClick={handleDelete}
              className="flex-none justify-center flex items-center gap-2 px-3 md:px-4 py-2 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors text-sm font-bold"
              title="Excluir"
            >
              <Trash2 size={18} />{" "}
              <span className="hidden md:inline">Excluir</span>
            </button>
          )}
          <button
            type="submit"
            form="book-form-main"
            disabled={isSaving}
            className="flex-1 md:flex-none justify-center flex items-center gap-2 px-4 md:px-6 py-2 bg-emerald-600 dark:bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 dark:hover:bg-emerald-500 disabled:opacity-50 transition-all text-sm font-bold shadow-lg shadow-emerald-500/20"
          >
            <Save size={18} />
            <span>
              {isSaving ? (
                "Salvando..."
              ) : (
                <span className="flex items-center gap-1">
                  Salvar <span className="hidden md:inline">Alterações</span>
                </span>
              )}
            </span>
          </button>
        </div>
      </div>

      <BookForm
        bookToEdit={targetBook}
        onSuccess={onFormSuccess}
        onCancel={onCancel}
        onLoadingChange={setIsSaving}
      />
    </div>
  );
}
