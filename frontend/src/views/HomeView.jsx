import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { BookOpen, Star, Activity, Layers, Library } from 'lucide-react'
import { useAnalyticsData } from '../components/analytics/useAnalyticsData'
import BookshelfShowcase from '../components/showcase/BookshelfShowcase'

export default function HomeView({ books }) {
  const navigate = useNavigate()
  const stats = useAnalyticsData(books)
  const [yearlyGoal, setYearlyGoal] = useState(20)

  useEffect(() => {
    const savedGoal = localStorage.getItem('yearlyReadingGoal')
    if (savedGoal) {
      setYearlyGoal(parseInt(savedGoal))
    }
  }, [])

  // Calculate most recent read book
  const mostRecentBook = useMemo(() => {
    const readBooks = books.filter(b => b.status === 'Lido' && b.date_read)
    if (readBooks.length === 0) return null
    
    return readBooks.sort((a, b) => {
      const dateA = new Date(a.date_read)
      const dateB = new Date(b.date_read)
      return dateB - dateA
    })[0]
  }, [books])

  if (!books || !stats) {
    return <div className="flex items-center justify-center h-screen text-neutral-500">Carregando...</div>
  }

  return (
    <div className="space-y-6 pb-10 animate-fade-in">
      <div className="grid grid-cols-12 gap-6 h-[calc(100vh-8rem)]">
        {/* Left Column - Metrics Cards */}
        <div className="col-span-4 flex flex-col gap-4">
          <div className="mb-2">
            <h1 className="text-3xl font-bold text-slate-800 dark:text-white">
              Dashboard
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
              Visão geral da sua jornada de leitura
            </p>
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

            {/* Livros Lidos */}
            <div className="bg-white dark:bg-neutral-800 rounded-lg p-2.5 border border-slate-200 dark:border-neutral-700 transition-all duration-200 hover:shadow-md hover:border-slate-300 dark:hover:border-neutral-600 h-32 flex flex-col">
              <div className="flex items-center gap-2 mb-2">
                <BookOpen size={16} className="text-green-600 dark:text-green-400" />
                <span className="text-sm font-medium text-slate-600 dark:text-neutral-400">Lidos</span>
              </div>
              <div className="text-3xl font-bold text-slate-800 dark:text-white">
                {stats.kpi.lidos}
              </div>
            </div>

            {/* Meta do Ano */}
            <div className="bg-white dark:bg-neutral-800 rounded-lg p-2.5 border border-slate-200 dark:border-neutral-700 transition-all duration-200 hover:shadow-md hover:border-slate-300 dark:hover:border-neutral-600 h-32 flex flex-col">
              <div className="flex items-center gap-2 mb-2">
                <Layers size={16} className="text-orange-600 dark:text-orange-400" />
                <span className="text-sm font-medium text-slate-600 dark:text-neutral-400">Meta {new Date().getFullYear()}</span>
              </div>
              <div className="text-3xl font-bold text-slate-800 dark:text-white">
                {books.filter(b => b.status === 'Lido' && b.year === new Date().getFullYear()).length}/{yearlyGoal}
              </div>
              <div className="mt-auto">
                <div className="w-full bg-slate-200 dark:bg-neutral-700 rounded-full h-1">
                  <div
                    className="bg-purple-600 h-1 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min((books.filter(b => b.status === 'Lido' && b.year === new Date().getFullYear()).length / yearlyGoal) * 100, 100)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Na Fila */}
            <div className="bg-white dark:bg-neutral-800 rounded-lg p-2.5 border border-slate-200 dark:border-neutral-700 transition-all duration-200 hover:shadow-md hover:border-slate-300 dark:hover:border-neutral-600 h-32 flex flex-col">
              <div className="flex items-center gap-2 mb-2">
                <Layers size={16} className="text-orange-600 dark:text-orange-400" />
                <span className="text-sm font-medium text-slate-600 dark:text-neutral-400">Na Fila</span>
              </div>
              <div className="text-3xl font-bold text-slate-800 dark:text-white">
                {stats.kpi.aLer}
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

            {/* Índice Médio */}
            <div className="bg-white dark:bg-neutral-800 rounded-lg p-2.5 border border-slate-200 dark:border-neutral-700 transition-all duration-200 hover:shadow-md hover:border-slate-300 dark:hover:border-neutral-600 h-32 flex flex-col">
              <div className="flex items-center gap-2 mb-2">
                <Activity size={16} className="text-purple-600 dark:text-purple-400" />
                <span className="text-sm font-medium text-slate-600 dark:text-neutral-400">Índice Médio</span>
              </div>
              <div className="text-3xl font-bold text-slate-800 dark:text-white">
                {stats.kpi.avgScore.toFixed(0)}
              </div>
            </div>

            {/* Lendo Agora */}
            <div className="bg-white dark:bg-neutral-800 rounded-lg p-2.5 border border-slate-200 dark:border-neutral-700 transition-all duration-200 hover:shadow-md hover:border-slate-300 dark:hover:border-neutral-600 h-36 flex flex-col">
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
            <div className="bg-white dark:bg-neutral-800 rounded-lg p-2.5 border border-slate-200 dark:border-neutral-700 transition-all duration-200 hover:shadow-md hover:border-slate-300 dark:hover:border-neutral-600 h-36 flex flex-col">
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
        </div>

        {/* Right Column - Bookshelf */}
        <div className="col-span-8 flex flex-col overflow-hidden">
          <BookshelfShowcase books={books} />
        </div>
      </div>
    </div>
  )
}
