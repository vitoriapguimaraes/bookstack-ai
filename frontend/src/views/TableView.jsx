import { useState } from 'react'
import { Download, Upload, Info, Loader2 } from 'lucide-react'
import BooksTable from '../components/BooksTable'
import axios from 'axios'
import ScrollToTopBottom from '../components/ScrollToTopBottom'

const api = axios.create()

export default function TableView({ books, onUpdate, onDelete, onEdit, tableState, setTableState }) {
  const [exporting, setExporting] = useState(false)
  const [showCsvInfo, setShowCsvInfo] = useState(false)
  
  const handleExport = async () => {
    try {
      setExporting(true)
      const response = await api.get('/api/books_export/', { responseType: 'blob' })
      
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', 'biblioteca_backup.csv')
      document.body.appendChild(link)
      link.click()
      
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      console.error("Erro no export:", err)
      alert("Falha ao exportar arquivo.")
    } finally {
      setExporting(false)
    }
  }

  const handleImportClick = () => {
    document.getElementById('csvInput').click()
  }

  const handleFileChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    const formData = new FormData()
    formData.append('file', file)

    try {
      await api.post('/api/books_import/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      alert('Livros importados com sucesso!')
      onUpdate()
    } catch (err) {
      console.error(err)
      alert('Erro ao importar livros. Verifique se o arquivo segue o padrão.')
    } finally {
      e.target.value = null
    }
  }
  
  return (
    <div className="pb-20 animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 dark:text-white">Gerenciar Biblioteca</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Visualize e gerencie todos os seus livros em formato de lista.</p>
        </div>
        
        <div className="flex gap-3">
          <button 
            onClick={() => setShowCsvInfo(true)}
            className="flex items-center justify-center w-10 h-10 bg-white dark:bg-neutral-800 hover:bg-slate-100 dark:hover:bg-neutral-700 text-slate-500 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white rounded-lg transition-colors border border-slate-200 dark:border-neutral-700 shadow-sm"
            title="Ajuda sobre formato CSV"
          >
            <Info size={20} />
          </button>

          <input type="file" id="csvInput" accept=".csv" className="hidden" onChange={handleFileChange} />
          
          <button 
            onClick={handleImportClick}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-neutral-800 hover:bg-slate-100 dark:hover:bg-neutral-700 text-slate-700 dark:text-white rounded-lg text-sm font-medium transition-colors border border-slate-200 dark:border-neutral-700 shadow-sm"
            title="Importar lista de livros via CSV (Obrigatório: Title)"
          >
            <Upload size={16} />
            Importar CSV
          </button>
          
          <button 
            onClick={handleExport}
            disabled={exporting}
            className={`flex items-center gap-2 px-4 py-2 bg-white dark:bg-neutral-800 hover:bg-slate-100 dark:hover:bg-neutral-700 text-slate-700 dark:text-white rounded-lg text-sm font-medium transition-colors border border-slate-200 dark:border-neutral-700 shadow-sm ${exporting ? 'opacity-70 cursor-wait' : ''}`}
            title="Baixar backup da biblioteca (CSV)"
          >
            {exporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
            {exporting ? 'Carregando...' : 'Exportar CSV'}
          </button>
        </div>
      </div>
      
      <BooksTable 
        books={books}
        onUpdate={onUpdate}
        onDelete={onDelete}
        onEdit={onEdit}
        tableState={tableState}
        setTableState={setTableState}
      />
      
      {/* CSV Info Modal */}
      {showCsvInfo && (
        <div className="fixed inset-0 bg-slate-900/40 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white dark:bg-neutral-900 rounded-xl max-w-2xl w-full border border-slate-200 dark:border-neutral-800 shadow-2xl transition-all">
            <div className="p-6 border-b border-slate-100 dark:border-neutral-800">
              <h3 className="text-xl font-bold text-slate-800 dark:text-white">Formato CSV para Importação</h3>
            </div>
            
            <div className="p-6 space-y-4 max-h-96 overflow-y-auto">
              <p className="text-slate-600 dark:text-neutral-300">O arquivo CSV deve conter as seguintes colunas (separadas por vírgula):</p>
              
              <div className="bg-slate-100 dark:bg-neutral-950 p-4 rounded-lg font-mono text-sm text-slate-600 dark:text-neutral-400 border border-slate-200 dark:border-transparent">
                Title,Author,Status,Class,Category,Score,Rating,Google Rating,Order,Priority,Date Read,Motivation,Availability,Original Title
              </div>
              
              <div className="space-y-2">
                <p className="text-sm text-slate-600 dark:text-neutral-400"><strong className="text-slate-800 dark:text-white">Title:</strong> Nome do livro (obrigatório)</p>
                <p className="text-sm text-slate-600 dark:text-neutral-400"><strong className="text-slate-800 dark:text-white">Status:</strong> Lendo, A Ler, ou Lido</p>
                <p className="text-sm text-slate-600 dark:text-neutral-400"><strong className="text-slate-800 dark:text-white">Order:</strong> Número para ordenação (opcional)</p>
                <p className="text-sm text-slate-600 dark:text-neutral-400"><strong className="text-slate-800 dark:text-white">Date Read:</strong> Data de conclusão no formato YYYY-MM-DD</p>
              </div>
            </div>
            
            <div className="p-6 border-t border-slate-100 dark:border-neutral-800 flex justify-end">
              <button 
                onClick={() => setShowCsvInfo(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-white dark:hover:bg-slate-200 text-slate-900 font-semibold rounded-lg text-sm transition-colors"
              >
                Entendi, fechar
              </button>
            </div>
          </div>
        </div>
      )}
      
      <ScrollToTopBottom />
    </div>
  )
}
