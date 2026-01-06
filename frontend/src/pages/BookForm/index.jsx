import { useState } from 'react'
import { ArrowLeft, Save, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import BookForm from '../../components/BookForm'

export default function FormView({ editingBook, onFormSuccess, onCancel }) {
  const navigate = useNavigate()
  const [isSaving, setIsSaving] = useState(false)

  const handleCancel = onCancel || (() => navigate(-1))

  return (
    <div className="w-full max-w-[1600px] mx-auto p-4 md:p-8 animate-fade-in pb-20">
      {/* Page Header with Actions */}
      <div className="mb-6 md:mb-8 flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div className="hidden md:block">
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
            {editingBook ? `Editar: ${editingBook.title}` : 'Adicionar Novo Livro'}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm">
            {editingBook 
              ? 'Atualize as informações, status e avaliações desta obra.' 
              : 'Preencha os dados abaixo para cadastrar uma nova obra na sua estante.'}
          </p>
        </div>

        {/* Action Buttons - Moved to Header */}
        <div className="flex items-center gap-3 mt-2 md:mt-0 w-full md:w-auto">
            <button 
                type="button" 
                onClick={handleCancel} 
                className="flex-1 md:flex-none justify-center flex items-center gap-2 px-4 py-2 bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 text-slate-600 dark:text-neutral-400 rounded-lg hover:bg-slate-50 dark:hover:bg-neutral-700 hover:text-slate-900 dark:hover:text-white transition-colors text-sm font-bold"
            >
                <X size={18} /> Cancelar
            </button>
            <button 
                type="submit" 
                form="book-form-main"
                disabled={isSaving} 
                className="flex-1 md:flex-none justify-center flex items-center gap-2 px-6 py-2 bg-emerald-600 dark:bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 dark:hover:bg-emerald-500 disabled:opacity-50 transition-all text-sm font-bold shadow-lg shadow-emerald-500/20"
            >
                <Save size={18} /> {isSaving ? 'Salvando...' : 'Salvar Alterações'}
            </button>
        </div>
      </div>

      <BookForm 
        bookToEdit={editingBook}
        onSuccess={onFormSuccess}
        onCancel={onCancel}
        onLoadingChange={setIsSaving}
      />
    </div>
  )
}
