import { useState, useEffect } from 'react'
import { BookOpen, Layers, CheckCircle, ArrowUp, ArrowDown, Download, Upload, Info, X, Loader2 } from 'lucide-react'
import Sidebar from './components/Sidebar'
import BookCard from './components/BookCard'
import BooksTable from './components/BooksTable'
import BookForm from './components/BookForm'
import Analytics from './components/Analytics'
import axios from 'axios'

// Configura o Axios (sem baseURL fixa para usar o proxy do Vite)
const api = axios.create()

function App() {
  const [books, setBooks] = useState([])
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [error, setError] = useState(null)
  const [tab, setTab] = useState('mural')
  const [editingBook, setEditingBook] = useState(null)
  const [showCsvInfo, setShowCsvInfo] = useState(false)
  
  // Scroll States
  /* Scroll States */
  const [isAtTop, setIsAtTop] = useState(true)
  const [isAtBottom, setIsAtBottom] = useState(false)
  const [returnTab, setReturnTab] = useState('mural')

  // Table Persistence State
  const [tableState, setTableState] = useState({
      sortConfig: { key: 'order', direction: 'asc' },
      searchTerm: '',
      selectedClasses: [],
      selectedCategories: [],
      selectedStatuses: [],
      selectedPriorities: [],
      yearRange: null 
  })
  
  // States for Sidebar Filters
  const [searchTerm, setSearchTerm] = useState('')
  const [activeStatuses, setActiveStatuses] = useState(['Lendo', 'A Ler', 'Lido'])

  useEffect(() => {
    fetchBooks()
  }, [])

  // Scroll to top when tab changes
  useEffect(() => {
    window.scrollTo(0, 0)
    const mainElement = document.querySelector('main')
    if (mainElement) mainElement.scrollTo(0, 0)
  }, [tab])

  const fetchBooks = async () => {
    try {
      console.log("Fetching books from /api/books/...")
      const res = await api.get('/api/books/')
      setBooks(res.data)
      setError(null)
    } catch (err) {
      console.error("Erro ao buscar livros:", err)
      setError("Não foi possível conectar ao backend python. Detalhes no console.")
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (book) => {
    setEditingBook(book)
    setReturnTab(tab)
    setTab('admin')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDelete = (id) => {
    setBooks(prev => prev.filter(b => b.id !== id))
  }

  const handleFormSuccess = () => {
    setEditingBook(null)
    fetchBooks()
    setTab(returnTab) 
  }

  const handleFilterChange = (type, value, checked) => {
      if (type === 'search') {
          setSearchTerm(value.toLowerCase())
      }
      if (type === 'status') {
          setActiveStatuses(prev => 
            checked ? [...prev, value] : prev.filter(s => s !== value)
          )
      }
  }

  // Filter Logic
  const filteredBooks = books.filter(book => {
      // 1. Search (Title or Author)
      const matchesSearch = book.title.toLowerCase().includes(searchTerm) || 
                            book.author.toLowerCase().includes(searchTerm)
      // 2. Status
      // Note: 'status' in DB might differ slightly ('A Ler' vs 'A ler'), normalize if needed.
      // But we mapped strictly in migration.
      const matchesStatus = activeStatuses.includes(book.status)
      
      return matchesSearch && matchesStatus
  })

  // Derived lists for Mural
  const reading = filteredBooks.filter(b => b.status === 'Lendo')
  const toRead = filteredBooks.filter(b => b.status === 'A Ler')
  const read = filteredBooks.filter(b => b.status === 'Lido')


  // Scroll to Top Logic


  useEffect(() => {
    const handleScroll = () => {
        const scrolled = window.scrollY
        setIsAtTop(scrolled < 100)
        
        // Detect bottom
        const isBottom = window.innerHeight + scrolled >= document.documentElement.scrollHeight - 50
        setIsAtBottom(isBottom)
    }

    // Adiciona listener no window e no main (caso o scroll seja interno)
    window.addEventListener('scroll', handleScroll)
    const mainElement = document.querySelector('main')
    if (mainElement) mainElement.addEventListener('scroll', handleScroll)

    return () => {
        window.removeEventListener('scroll', handleScroll)
        if (mainElement) mainElement.removeEventListener('scroll', handleScroll)
    }
  }, [])

  const scrollToTop = () => {
      window.scrollTo({ top: 0, behavior: 'smooth' })
      const mainElement = document.querySelector('main')
      if (mainElement) mainElement.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Export/Import Handlers
  const handleExport = async () => {
      try {
          setExporting(true)
          const response = await api.get('/api/books_export/', { responseType: 'blob' })
          
          // Create download link
          const url = window.URL.createObjectURL(new Blob([response.data]))
          const link = document.createElement('a')
          link.href = url
          link.setAttribute('download', 'biblioteca_backup.csv')
          document.body.appendChild(link)
          link.click()
          
          // Cleanup
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
          setLoading(true)
          await api.post('/api/books_import/', formData, {
              headers: { 'Content-Type': 'multipart/form-data' }
          })
          alert('Livros importados com sucesso!')
          fetchBooks()
      } catch (err) {
          console.error(err)
          alert('Erro ao importar livros. Verifique se o arquivo segue o padrão.')
      } finally {
          setLoading(false)
          e.target.value = null // reset input
      }
  }

  return (
    <div className="min-h-screen bg-black text-slate-100 font-sans flex">
      {/* Sidebar Navigation */}
      <Sidebar 
          currentTab={tab === 'admin' ? 'table' : tab}
          setTab={setTab} 
          onAddBook={() => { setEditingBook(null); setReturnTab(tab); setTab('admin'); }}
          filters={{ searchTerm, activeStatuses }}
          onFilterChange={handleFilterChange}
      />
      
      {/* Main Content Area */}
      <main className="flex-1 ml-20 p-8 transition-all duration-300">
        <div className="w-full">
            {error && (
                <div className="bg-red-900/20 border border-red-500/30 text-red-300 px-4 py-3 rounded-lg mb-6">
                    <p>⚠️ {error}</p>
                    <p className="text-sm">Dica: Rode `uvicorn main:app --reload` na pasta backend.</p>
                </div>
            )}

            {loading && <p className="text-center mt-20 text-lg animate-pulse text-neutral-500">Carregando biblioteca...</p>}
            
            {!loading && tab === 'mural' && (
            <div className="space-y-12 pb-20 animate-fade-in">
                {/* Lendo Agora */}
                {reading.length > 0 && (
                    <section>
                        <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-white">
                           Lendo Agora
                           <span className="bg-purple-500/20 text-purple-400 text-xs font-medium px-2 py-0.5 rounded border border-purple-500/30">
                               {reading.length}
                           </span>
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {reading.map(book => <BookCard key={book.id} book={book} onEdit={handleEdit} onDelete={handleDelete} />)}
                </div>
              </section>
                )}

                {/* A Ler (Fila) */}
                {toRead.length > 0 && (
                    <section>
                         <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-white">
                           Próximos da Fila
                           <span className="bg-amber-500/20 text-amber-400 text-xs font-medium px-2 py-0.5 rounded border border-amber-500/30">
                               {toRead.length}
                           </span>
                         </h2>
                         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                           {toRead
                              .sort((a,b) => (a.order||999) - (b.order||999))
                              .map(book => (
                                <BookCard key={book.id} book={book} onEdit={handleEdit} onDelete={handleDelete} />
                           ))}
                         </div>
                    </section>
                )}
                
                {/* Lidos */}
                {read.length > 0 && (
                    <section>
                         <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-white">
                           Já Lidos
                           <span className="bg-emerald-500/20 text-emerald-400 text-xs font-medium px-2 py-0.5 rounded border border-emerald-500/30">
                               {read.length}
                           </span>
                         </h2>
                         <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                           {read.map(book => (
                             <BookCard key={book.id} book={book} compact onEdit={handleEdit} onDelete={handleDelete} />
                           ))}
                         </div>
                    </section>
                )}

                {filteredBooks.length === 0 && (
                    <div className="text-center py-20">
                        <p className="text-neutral-500">Nenhum livro encontrado com os filtros atuais.</p>
                    </div>
                )}
            </div>
            )}

            {!loading && tab === 'table' && (
            <div className="pb-20 animate-fade-in">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h2 className="text-3xl font-bold text-white">Gerenciar Biblioteca</h2>
                        <p className="text-slate-400 text-sm mt-1">Visualize e gerencie todos os seus livros em formato de lista.</p>
                    </div>
                    
                    <div className="flex gap-3">
                        <button 
                            onClick={() => setShowCsvInfo(true)}
                            className="flex items-center justify-center w-10 h-10 bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white rounded-lg transition-colors border border-neutral-700"
                            title="Ajuda sobre formato CSV"
                        >
                            <Info size={20} />
                        </button>

                        <input type="file" id="csvInput" accept=".csv" className="hidden" onChange={handleFileChange} />
                        
                        <button 
                            onClick={handleImportClick}
                            className="flex items-center gap-2 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg text-sm font-medium transition-colors border border-neutral-700"
                            title="Importar lista de livros via CSV (Obrigatório: Title)"
                        >
                            <Upload size={16} />
                            Importar CSV
                        </button>
                        
                        <button 
                            onClick={handleExport}
                            disabled={exporting}
                            className={`flex items-center gap-2 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg text-sm font-medium transition-colors border border-neutral-700 ${exporting ? 'opacity-70 cursor-wait' : ''}`}
                            title="Baixar backup da biblioteca (CSV)"
                        >
                            {exporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                            {exporting ? 'Carregando...' : 'Exportar CSV'}
                        </button>
                    </div>
                </div>
                <BooksTable 
                    books={filteredBooks} 
                    onDelete={handleDelete} 
                    onEdit={handleEdit} 
                    tableState={tableState}
                    setTableState={setTableState}
                />
            </div>
            )}
            
            {!loading && tab === 'analytics' && (
               <div className="mx-auto">
                  <Analytics />
               </div>
            )}

            {!loading && tab === 'admin' && (
            <div className="max-w-7xl mx-auto pb-5 animate-fade-in">
                <BookForm 
                    bookToEdit={editingBook} 
                    onSuccess={handleFormSuccess} 
                    onCancel={() => { setEditingBook(null); setTab(returnTab); }}
                />
            </div>
            )}
        </div>
      </main>

      {/* Button Scroll to Top */}
      {/* Button Scroll to Top */}
      <button
        onClick={isAtTop ? undefined : scrollToTop}
        disabled={isAtTop}
        className={`fixed bottom-20 right-8 p-3 rounded-full transition-all duration-300 z-50 ${
          isAtTop 
            ? 'bg-neutral-800 text-neutral-600 cursor-not-allowed shadow-none' 
            : 'bg-purple-600 hover:bg-purple-500 text-white shadow-lg'
        }`}
        title="Voltar ao topo"
      >
        <ArrowUp size={20} />
      </button>

      {/* Button Scroll to Bottom */}
      <button
        onClick={isAtBottom ? undefined : () => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' })}
        disabled={isAtBottom}
        className={`fixed bottom-8 right-8 p-3 rounded-full transition-all duration-300 z-50 ${
           isAtBottom 
            ? 'bg-neutral-800 text-neutral-600 cursor-not-allowed shadow-none' 
            : 'bg-purple-600 hover:bg-purple-500 text-white shadow-lg'
        }`}
        title="Ir para o final"
      >
        <ArrowDown size={20} />
      </button>

      {/* CSV Info Modal */}
      {showCsvInfo && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
           <div className="bg-neutral-900 border border-neutral-700 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-fade-in">
              <div className="flex justify-between items-center p-6 border-b border-neutral-800">
                 <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <Info size={24} className="text-purple-500" />
                    Guia de Importação CSV
                 </h3>
                 <button onClick={() => setShowCsvInfo(false)} className="text-neutral-400 hover:text-white transition-colors">
                    <X size={24} />
                 </button>
              </div>
              
              <div className="p-6 space-y-6 text-sm text-neutral-300">
                 <p>
                    Para importar seus livros, crie um arquivo <strong>.csv</strong> (separado por vírgulas) com as colunas abaixo. 
                    A ordem das colunas não importa, mas os nomes do cabeçalho devem ser <strong>exatos</strong>.
                 </p>

                 <div className="bg-neutral-800/50 rounded-lg overflow-hidden border border-neutral-700">
                    <table className="w-full text-left">
                       <thead className="bg-neutral-800 text-neutral-400 font-medium">
                          <tr>
                             <th className="p-3 text-xs uppercase tracking-wider">Coluna</th>
                             <th className="p-3 text-xs uppercase tracking-wider">Obrigatório?</th>
                             <th className="p-3 text-xs uppercase tracking-wider">Descrição / Exemplos</th>
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-neutral-800 text-xs md:text-sm">
                          <tr className="bg-purple-900/10">
                             <td className="p-3 font-mono text-purple-300 font-bold">title</td>
                             <td className="p-3 text-emerald-400 font-bold">SIM</td>
                             <td className="p-3">O título do livro.</td>
                          </tr>
                          <tr>
                             <td className="p-3 font-mono text-neutral-400">author</td>
                             <td className="p-3 text-neutral-500">Não</td>
                             <td className="p-3">Nome do autor. Default: "Desconhecido".</td>
                          </tr>
                          <tr>
                             <td className="p-3 font-mono text-neutral-400">status</td>
                             <td className="p-3 text-neutral-500">Não</td>
                             <td className="p-3">"A Ler" (default), "Lendo", "Lido".</td>
                          </tr>
                          <tr>
                             <td className="p-3 font-mono text-neutral-400">book_class</td>
                             <td className="p-3 text-neutral-500">Não</td>
                             <td className="p-3">Ex: "Tecnologia & IA", "Negócios".</td>
                          </tr>
                          <tr>
                             <td className="p-3 font-mono text-neutral-400">original_title</td>
                             <td className="p-3 text-neutral-500">Não</td>
                             <td className="p-3">Para melhor match de ratings.</td>
                          </tr>
                       </tbody>
                    </table>
                 </div>

                 <div className="bg-amber-900/20 border border-amber-900/50 p-4 rounded text-amber-200/80 text-xs">
                    <p className="font-bold mb-1 flex items-center gap-2"><Download size={14}/> Dica Pro:</p>
                    Utilize o botão <strong>Exportar CSV</strong> criar um backup da sua biblioteca. Esse arquivo serve como um modelo perfeito para adicionar novos livros em massa (apenas apague as linhas e mantenha o cabeçalho).
                 </div>
              </div>
              
              <div className="p-6 border-t border-neutral-800 flex justify-end">
                 <button 
                    onClick={() => setShowCsvInfo(false)}
                    className="px-4 py-2 bg-neutral-100 hover:bg-white text-black font-semibold rounded-lg text-sm transition-colors"
                 >
                    Entendi, fechar
                 </button>
              </div>
           </div>
        </div>
      )}

    </div>
  )
}

export default App
