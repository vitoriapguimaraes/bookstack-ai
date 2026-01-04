import { useState, useEffect } from 'react'
import { BookOpen, Layers, CheckCircle, ArrowUp } from 'lucide-react'
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
  const [error, setError] = useState(null)
  const [tab, setTab] = useState('mural') // 'mural', 'table', 'analytics'
  const [editingBook, setEditingBook] = useState(null)
  
  // States for Sidebar Filters
  const [searchTerm, setSearchTerm] = useState('')
  const [activeStatuses, setActiveStatuses] = useState(['Lendo', 'A Ler', 'Lido'])

  useEffect(() => {
    fetchBooks()
  }, [])

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
    setTab('admin')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDelete = (id) => {
    setBooks(prev => prev.filter(b => b.id !== id))
  }

  const handleFormSuccess = () => {
    setEditingBook(null)
    fetchBooks()
    setTab('mural') 
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
  const [showScrollTop, setShowScrollTop] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
        // Tenta pegar o elemento principal de scroll (pode ser window ou o main)
        const mainElement = document.querySelector('main')
        if (mainElement && mainElement.scrollTop > 300) {
            setShowScrollTop(true)
        } else if (window.scrollY > 300) {
             setShowScrollTop(true)
        } else {
            setShowScrollTop(false)
        }
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

  return (
    <div className="min-h-screen bg-black text-slate-100 font-sans flex">
      {/* Sidebar Navigation */}
      <Sidebar 
          currentTab={tab === 'admin' ? 'table' : tab}
          setTab={setTab} 
          onAddBook={() => { setEditingBook(null); setTab('admin'); }}
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
                </div>
                <BooksTable books={filteredBooks} onDelete={handleDelete} onEdit={handleEdit} />
            </div>
            )}
            
            {!loading && tab === 'analytics' && (
               <div className="mx-auto">
                  <Analytics />
               </div>
            )}

            {!loading && tab === 'admin' && (
            <div className="max-w-2xl mx-auto pb-20 animate-fade-in">
                <BookForm 
                    bookToEdit={editingBook} 
                    onSuccess={handleFormSuccess} 
                    onCancel={() => { setEditingBook(null); setTab('mural'); }}
                />
            </div>
            )}
        </div>
      </main>

      {/* Button Scroll to Top */}
      <button
        onClick={scrollToTop}
        className={`fixed bottom-8 right-8 bg-purple-600 hover:bg-purple-500 text-white p-3 rounded-full shadow-lg transition-all duration-300 z-50 ${
          showScrollTop ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'
        }`}
        title="Voltar ao topo"
      >
        <ArrowUp size={20} />
      </button>
    </div>
  )
}

export default App
