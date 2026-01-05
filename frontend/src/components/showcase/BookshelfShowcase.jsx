import { useState, useMemo } from 'react'
import { Camera, Filter, Library, Star } from 'lucide-react'
import ShowcaseExporter from './ShowcaseExporter'

export default function BookshelfShowcase({ books }) {
  // Get unique years first to set default
  const years = useMemo(() => {
    const readBooks = books.filter(b => b.status === 'Lido' && b.date_read)
    const uniqueYears = [...new Set(readBooks.map(b => new Date(b.date_read).getFullYear()))].sort((a, b) => b - a)
    return uniqueYears
  }, [books])

  const [filterYear, setFilterYear] = useState(years[0] || new Date().getFullYear())
  const [filterClass, setFilterClass] = useState('all')
  const [showExporter, setShowExporter] = useState(false)

  const classes = useMemo(() => {
    const readBooks = books.filter(b => b.status === 'Lido')
    const uniqueClasses = [...new Set(readBooks.filter(b => b.book_class).map(b => b.book_class))].sort()
    return ['all', ...uniqueClasses]
  }, [books])

  // Filter books
  const filteredBooks = useMemo(() => {
    let result = books.filter(b => b.status === 'Lido')

    // Year filter is always active (no 'all' option)
    result = result.filter(b => {
      if (!b.date_read) return false
      const readYear = new Date(b.date_read).getFullYear()
      return readYear === parseInt(filterYear)
    })

    if (filterClass !== 'all') {
      result = result.filter(b => b.book_class === filterClass)
    }

    console.log('Final filtered books:', result.length)

    return result
  }, [books, filterYear, filterClass])

  return (
    <div className="flex flex-col h-full">
      {/* Header com Filtros */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            Minha Estante Virtual
          </h2>
          <p className="text-sm text-slate-500 dark:text-neutral-400 mt-1">
            {filteredBooks.length} livros selecionados
          </p>
        </div>

        <button
          onClick={() => setShowExporter(true)}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
          title="Exportar para LinkedIn"
        >
          <Camera size={16} />
          Compartilhar
        </button>
      </div>

      {/* Filtros */}
      <div className="flex gap-3 mb-4">
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-slate-500" />
          <select
            value={filterYear}
            onChange={(e) => setFilterYear(e.target.value)}
            className="px-4 py-2 bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-lg text-sm text-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 min-w-[160px]"
          >
            {years.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>

        <select
          value={filterClass}
          onChange={(e) => setFilterClass(e.target.value)}
          className="px-4 py-2 bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-lg text-sm text-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 min-w-[200px]"
        >
          <option value="all">Todas as classes</option>
          {classes.filter(c => c !== 'all').map(cls => (
            <option key={cls} value={cls}>{cls}</option>
          ))}
        </select>
      </div>

      {/* Grid de Capas */}
      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-4 gap-4 transition-opacity duration-300">
          {filteredBooks.map((book) => (
            <div
              key={book.id}
              className="group relative aspect-[2/3] rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-all hover:scale-105"
            >
              {book.cover_url ? (
                <img
                  src={book.cover_url}
                  alt={book.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center">
                  <span className="text-white text-xs font-bold text-center px-2">
                    {book.title}
                  </span>
                </div>
              )}

              {/* Overlay com info ao hover */}
              <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                <h4 className="text-white text-xs font-bold line-clamp-2 mb-1">
                  {book.title}
                </h4>
                <p className="text-white/80 text-[10px] line-clamp-1">
                  {book.author}
                </p>
                {book.rating && (
                  <div className="flex items-center gap-1 mt-1">
                    <Star className="text-yellow-400 fill-yellow-400" size={12} />
                    <span className="text-white text-xs">{book.rating}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {filteredBooks.length === 0 && (
          <div className="flex items-center justify-center h-full text-slate-400 dark:text-neutral-500">
            <p>Nenhum livro encontrado com os filtros selecionados</p>
          </div>
        )}
      </div>

      {/* Export Modal */}
      {showExporter && (
        <ShowcaseExporter 
          books={books} 
          onClose={() => setShowExporter(false)} 
        />
      )}
    </div>
  )
}
