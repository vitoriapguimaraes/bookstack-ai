import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { BookOpen, Library, CheckCircle2, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Layers } from 'lucide-react'
import BookCard from '../components/BookCard'
import ScrollToTopBottom from '../components/ScrollToTopBottom'

const ITEMS_PER_PAGE_ACTIVE = 12
const ITEMS_PER_PAGE_COMPLETED = 24

export default function MuralView({ books, onEdit, onDelete }) {
  const navigate = useNavigate()
  const { status } = useParams()
  const [yearlyGoal, setYearlyGoal] = useState(20)
  const scrollContainerRef = useRef(null)
  
  // Default to 'reading' if no status in URL
  const activeStatus = status || 'reading'
  
  const [currentPage, setCurrentPage] = useState(1)

  // Load yearly goal from localStorage
  useEffect(() => {
    const savedGoal = localStorage.getItem('yearlyReadingGoal')
    if (savedGoal) {
      setYearlyGoal(parseInt(savedGoal))
    }
  }, [])

  // Reset pagination when status changes
  useEffect(() => {
    setCurrentPage(1)
  }, [activeStatus])
  
  // Filter books by status
  const getFilteredBooks = () => {
      switch(activeStatus) {
          case 'reading': return books.filter(b => b.status === 'Lendo')
          case 'to-read': return books.filter(b => b.status === 'A Ler')
          case 'read': return books.filter(b => b.status === 'Lido')
          default: return []
      }
  }

  const filteredBooks = getFilteredBooks().sort((a,b) => (a.order||999) - (b.order||999))
  
  // Dynamic Items Per Page
  const itemsPerPage = activeStatus === 'read' ? ITEMS_PER_PAGE_COMPLETED : ITEMS_PER_PAGE_ACTIVE

  // Pagination Logic
  const totalPages = Math.ceil(filteredBooks.length / itemsPerPage)
  const paginatedBooks = filteredBooks.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage
  )
  
  const handleStatusChange = (newStatus) => {
    navigate(`/mural/${newStatus}`)
  }
  
  const getStatusLabel = (s) => {
      switch(s) {
          case 'reading': return 'Lendo Agora'
          case 'to-read': return 'Próximos da Fila'
          case 'read': return 'Já Lidos'
          default: return ''
      }
  }

  // Calculate current year progress
  const currentYearBooks = books.filter(b => b.status === 'Lido' && b.year === new Date().getFullYear()).length
  const progressPercentage = Math.min((currentYearBooks / yearlyGoal) * 100, 100)

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] animate-fade-in">
      {/* Header with Integrated Status Filter */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4 flex-shrink-0">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
             Mural de Livros
             <span className="text-2xl font-normal text-slate-300 dark:text-neutral-600">|</span>
             <span className={`text-3xl ${
                 activeStatus === 'reading' ? 'text-purple-600 dark:text-purple-400' :
                 activeStatus === 'to-read' ? 'text-amber-600 dark:text-amber-500' :
                 'text-emerald-600 dark:text-emerald-500'
             }`}>
                 {getStatusLabel(activeStatus)}
             </span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Visualização em grade da sua biblioteca.</p>
        </div>

        {/* Right-aligned Status Options */}
        <div className="flex gap-2 bg-slate-100 dark:bg-neutral-900 p-1 rounded-lg border border-slate-200 dark:border-neutral-800">
          <button
            onClick={() => handleStatusChange('reading')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeStatus === 'reading'
                ? 'bg-white dark:bg-neutral-800 text-purple-600 dark:text-purple-400 shadow-sm border border-slate-200 dark:border-neutral-700'
                : 'text-slate-500 dark:text-neutral-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <BookOpen size={14} /> Lendo
          </button>
          <button
            onClick={() => handleStatusChange('to-read')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeStatus === 'to-read'
                ? 'bg-white dark:bg-neutral-800 text-amber-600 dark:text-amber-500 shadow-sm border border-slate-200 dark:border-neutral-700'
                : 'text-slate-500 dark:text-neutral-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Library size={14} /> Fila
          </button>
          <button
            onClick={() => handleStatusChange('read')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeStatus === 'read'
                ? 'bg-white dark:bg-neutral-800 text-emerald-600 dark:text-emerald-500 shadow-sm border border-slate-200 dark:border-neutral-700'
                : 'text-slate-500 dark:text-neutral-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <CheckCircle2 size={14} /> Concluídos
          </button>
        </div>
      </div>

      {/* Meta 2026 Card - Only show on 'reading' tab */}
      {activeStatus === 'reading' && (
        <div className="bg-white dark:bg-neutral-800 rounded-lg p-4 border border-slate-200 dark:border-neutral-700 mb-4 flex-shrink-0">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Layers size={18} className="text-orange-600 dark:text-orange-400" />
              <span className="text-base font-semibold text-slate-800 dark:text-white">Meta {new Date().getFullYear()}</span>
            </div>
            <div className="text-2xl font-bold text-slate-800 dark:text-white">
              {currentYearBooks}/{yearlyGoal}
            </div>
          </div>
          <div className="w-full bg-slate-200 dark:bg-neutral-700 rounded-full h-2">
            <div
              className="bg-purple-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          <p className="text-xs text-slate-500 dark:text-neutral-400 mt-2">
            {progressPercentage.toFixed(0)}% da meta anual concluída
          </p>
        </div>
      )}

      {/* Content Grid - Flex Grow to take available space */}
      <section ref={scrollContainerRef} className="flex-1 overflow-y-auto min-h-0 pr-2">
        {paginatedBooks.length > 0 ? (
           <div className={`grid gap-4 ${
                  activeStatus === 'read' 
                  ? 'grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6' 
                  : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
              }`}>
                {paginatedBooks.map(book => (
                    <BookCard key={book.id} book={book} compact={activeStatus === 'read'} onEdit={onEdit} onDelete={onDelete} />
                ))}
            </div>
        ) : (
          <div className="h-full flex flex-col justify-center items-center text-slate-400 dark:text-neutral-600">
            <p className="text-lg">Nenhum livro encontrado nesta categoria.</p>
          </div>
        )}
      </section>

      {/* Fixed Pagination Controls at Bottom */}
      {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-0 pt-0 border-t border-slate-100 dark:border-neutral-800 flex-shrink-0">
              <button 
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-neutral-800 text-slate-600 dark:text-neutral-400 disabled:opacity-30 transition-colors"
                  title="Primeira página"
              >
                  <ChevronsLeft size={18} />
              </button>

              <button 
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-neutral-800 text-slate-600 dark:text-neutral-400 disabled:opacity-30 transition-colors"
                  title="Página anterior"
              >
                  <ChevronLeft size={20} />
              </button>
              
              <span className="text-sm font-bold text-slate-500 dark:text-neutral-500 px-4">
                  Página {currentPage} de {totalPages}
              </span>

              <button 
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-neutral-800 text-slate-600 dark:text-neutral-400 disabled:opacity-30 transition-colors"
                  title="Próxima página"
              >
                  <ChevronRight size={20} />
              </button>

              <button 
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-neutral-800 text-slate-600 dark:text-neutral-400 disabled:opacity-30 transition-colors"
                  title="Última página"
              >
                  <ChevronsRight size={20} />
              </button>
          </div>
      )}
      <ScrollToTopBottom containerRef={scrollContainerRef} />
    </div>
  )
}
