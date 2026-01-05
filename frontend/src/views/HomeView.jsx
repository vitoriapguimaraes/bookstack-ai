import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { BookOpen, Star, Activity, Layers, Library, Camera } from 'lucide-react'
import { useAnalyticsData } from '../components/analytics/useAnalyticsData'
import BookshelfShowcase from '../components/showcase/BookshelfShowcase'
import ShowcaseExporter from '../components/showcase/ShowcaseExporter'

export default function HomeView({ books }) {
  const navigate = useNavigate()
  const [yearlyGoal, setYearlyGoal] = useState(20)
  const [selectedYears, setSelectedYears] = useState([])
  const [filterClass, setFilterClass] = useState('all')
  const [showExporter, setShowExporter] = useState(false)

  useEffect(() => {
    const savedGoal = localStorage.getItem('yearlyReadingGoal')
    if (savedGoal) {
      setYearlyGoal(parseInt(savedGoal))
    }
  }, [])

  // Get available years from read books
  const availableYears = useMemo(() => {
    const readBooks = books.filter(b => b.status === 'Lido' && b.date_read)
    const uniqueYears = [...new Set(readBooks.map(b => new Date(b.date_read).getFullYear()))].sort((a, b) => b - a)
    return uniqueYears
  }, [books])

  // Initialize with most recent year
  useEffect(() => {
    if (availableYears.length > 0 && selectedYears.length === 0) {
      setSelectedYears([availableYears[0]])
    }
  }, [availableYears])

  // Get available classes
  const availableClasses = useMemo(() => {
    const readBooks = books.filter(b => b.status === 'Lido')
    const uniqueClasses = [...new Set(readBooks.filter(b => b.book_class).map(b => b.book_class))].sort()
    return uniqueClasses
  }, [books])

  // Filter books based on selected filters
  const filteredBooks = useMemo(() => {
    let result = books.filter(b => b.status === 'Lido')

    // Year filter (multiple selection)
    if (selectedYears.length > 0) {
      result = result.filter(b => {
        if (!b.date_read) return false
        const readYear = new Date(b.date_read).getFullYear()
        return selectedYears.includes(readYear)
      })
    }

    // Class filter
    if (filterClass !== 'all') {
      result = result.filter(b => b.book_class === filterClass)
    }

    return result
  }, [books, selectedYears, filterClass])

  // Use filtered books for stats
  const stats = useAnalyticsData(filteredBooks)

  // Calculate most recent read book from filtered books
  const mostRecentBook = useMemo(() => {
    const readBooks = filteredBooks.filter(b => b.date_read)
    if (readBooks.length === 0) return null
    
    return readBooks.sort((a, b) => {
      const dateA = new Date(a.date_read)
      const dateB = new Date(b.date_read)
      return dateB - dateA
    })[0]
  }, [filteredBooks])

  // Toggle year selection
  const toggleYear = (year) => {
    setSelectedYears(prev => 
      prev.includes(year) 
        ? prev.filter(y => y !== year)
        : [...prev, year]
    )
  }

  // Select all years
  const selectAllYears = () => {
    setSelectedYears(availableYears)
  }

  // Clear all years
  const clearAllYears = () => {
    setSelectedYears([])
  }

  if (!books || !stats) {
    return <div className="flex items-center justify-center h-screen text-neutral-500">Carregando...</div>
  }

  return (
    <div className="animate-fade-in h-[calc(100vh-4rem)]">
      <div className="grid grid-cols-12 gap-6 h-full">
        {/* Left Column - Metrics Cards (25% - col-span-3) */}
        <div className="col-span-3 flex flex-col gap-4">
          {/* Header with dynamic title */}
          <div className="mb-2">
            <h1 className="text-3xl font-bold text-slate-800 dark:text-white">
              Minha Estante Virtual
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
              Explore sua coleção por ano e categoria
            </p>
          </div>

          {/* Filters */}
          <div className="flex flex-col gap-2 pb-3 border-b border-slate-200 dark:border-neutral-800">
            {/* Year Filter - Multi-select */}
            <div className="relative">
              <label className="block text-xs font-medium text-slate-600 dark:text-neutral-400 mb-1">
                Anos
              </label>
              <div className="flex flex-wrap gap-1">
                {availableYears.map(year => (
                  <button
                    key={year}
                    onClick={() => toggleYear(year)}
                    className={`px-2 py-1 text-xs rounded transition-colors ${
                      selectedYears.includes(year)
                        ? 'bg-purple-600 text-white'
                        : 'bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-neutral-400 hover:bg-slate-200 dark:hover:bg-neutral-700'
                    }`}
                  >
                    {year}
                  </button>
                ))}
              </div>
              <div className="flex gap-1 mt-1">
                <button
                  onClick={selectAllYears}
                  className="text-[10px] text-purple-600 dark:text-purple-400 hover:underline"
                >
                  Todos
                </button>
                <span className="text-[10px] text-slate-400">•</span>
                <button
                  onClick={clearAllYears}
                  className="text-[10px] text-slate-500 dark:text-neutral-500 hover:underline"
                >
                  Limpar
                </button>
              </div>
            </div>

            {/* Class Filter */}
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-neutral-400 mb-1">
                Classe
              </label>
              <select
                value={filterClass}
                onChange={(e) => setFilterClass(e.target.value)}
                className="w-full px-2 py-1.5 bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded text-xs text-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="all">Todas as classes</option>
                {availableClasses.map(cls => (
                  <option key={cls} value={cls}>{cls}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Metrics Grid with independent scroll */}
          <div className="grid grid-cols-2 gap-2 flex-1 overflow-y-auto pr-2">
            {/* Total de Livros */}
            <div className="bg-white dark:bg-neutral-800 rounded-lg p-2.5 border border-slate-200 dark:border-neutral-700 transition-all duration-200 hover:shadow-md hover:border-slate-300 dark:hover:border-neutral-600 h-32 flex flex-col">
              <div className="flex items-center gap-2 mb-2">
                <Library size={16} className="text-blue-600 dark:text-blue-400" />
                <span className="text-sm font-medium text-slate-600 dark:text-neutral-400">Total</span>
              </div>
              <div className="text-3xl font-bold text-slate-800 dark:text-white">
                {stats.kpi.total}
              </div>
            </div>

            {/* Nota Média */}
            <div className="bg-white dark:bg-neutral-800 rounded-lg p-2.5 border border-slate-200 dark:border-neutral-700 transition-all duration-200 hover:shadow-md hover:border-slate-300 dark:hover:border-neutral-600 h-32 flex flex-col">
              <div className="flex items-center gap-2 mb-2">
                <Star size={16} className="text-red-600 dark:text-red-400" />
                <span className="text-sm font-medium text-slate-600 dark:text-neutral-400">Nota Média</span>
              </div>
              <div className="text-3xl font-bold text-slate-800 dark:text-white">
                {stats.kpi.avgRating.toFixed(1)}
              </div>
            </div>

            {/* Lendo Agora */}
            <div className="bg-white dark:bg-neutral-800 rounded-lg p-2.5 border border-slate-200 dark:border-neutral-700 transition-all duration-200 hover:shadow-md hover:border-slate-300 dark:hover:border-neutral-600 h-44 flex flex-col">
              <div className="flex items-center gap-2 mb-2">
                <BookOpen size={16} className="text-purple-600 dark:text-purple-400" />
                <span className="text-sm font-medium text-slate-600 dark:text-neutral-400">Lendo Agora</span>
              </div>
              {books.find(b => b.status === 'Lendo') ? (
                <>
                  <div className="text-base font-semibold text-slate-800 dark:text-white line-clamp-2 flex-1">
                    {books.find(b => b.status === 'Lendo')?.title}
                  </div>
                  <div className="text-sm text-slate-500 dark:text-neutral-500 mt-auto">
                    {books.find(b => b.status === 'Lendo')?.author || 'Autor desconhecido'}
                  </div>
                </>
              ) : (
                <div className="text-sm text-slate-500 dark:text-neutral-500 flex-1 flex items-center">
                  Nenhum livro em leitura
                </div>
              )}
            </div>

            {/* Último Lido */}
            <div className="bg-white dark:bg-neutral-800 rounded-lg p-2.5 border border-slate-200 dark:border-neutral-700 transition-all duration-200 hover:shadow-md hover:border-slate-300 dark:hover:border-neutral-600 h-44 flex flex-col">
              <div className="flex items-center gap-2 mb-2">
                <BookOpen size={16} className="text-emerald-600 dark:text-emerald-400" />
                <span className="text-sm font-medium text-slate-600 dark:text-neutral-400">Último Lido</span>
              </div>
              {mostRecentBook ? (
                <>
                  <div className="text-base font-semibold text-slate-800 dark:text-white line-clamp-2 flex-1">
                    {mostRecentBook.title}
                  </div>
                  <div className="text-sm text-slate-500 dark:text-neutral-500 mt-auto">
                    {mostRecentBook.author || 'Autor desconhecido'}
                  </div>
                </>
              ) : (
                <div className="text-sm text-slate-500 dark:text-neutral-500 flex-1 flex items-center">
                  Nenhum livro lido
                </div>
              )}
            </div>
          </div>

          {/* Share Button */}
          <button
            onClick={() => setShowExporter(true)}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm mt-3"
            title="Compartilhar Estante"
          >
            <Camera size={16} />
            Compartilhar Estante
          </button>
        </div>

        {/* Right Column - Bookshelf (75% - col-span-9) */}
        <div className="col-span-9 flex flex-col overflow-hidden">
          <BookshelfShowcase books={filteredBooks} />
        </div>
      </div>

      {/* Export Modal */}
      {showExporter && (
        <ShowcaseExporter 
          books={filteredBooks}
          selectedYears={selectedYears}
          filterClass={filterClass}
          stats={stats}
          activeBook={books.find(b => b.status === 'Lendo')}
          onClose={() => setShowExporter(false)} 
        />
      )}
    </div>
  )
}
