import { useState, useMemo } from 'react'
import { ArrowUpDown, Pencil, Trash2, Search, X } from 'lucide-react'
import axios from 'axios'

const api = axios.create()

export default function BooksTable({ books, onUpdate, onDelete, onEdit }) {
  const [sortConfig, setSortConfig] = useState({ key: 'order', direction: 'asc' })
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedClasses, setSelectedClasses] = useState([])
  const [selectedCategories, setSelectedCategories] = useState([])
  const [selectedStatuses, setSelectedStatuses] = useState([])
  const [selectedPriorities, setSelectedPriorities] = useState([])
  const [yearRange, setYearRange] = useState([1800, 2030])

  // Get unique values for filters
  const uniqueClasses = useMemo(() => {
    return [...new Set(books.map(b => b.book_class).filter(Boolean))].sort()
  }, [books])

  const uniqueCategories = useMemo(() => {
    return [...new Set(books.map(b => b.category).filter(Boolean))].sort()
  }, [books])

  const uniqueStatuses = useMemo(() => {
    return [...new Set(books.map(b => b.status).filter(Boolean))].sort()
  }, [books])

  const uniquePriorities = useMemo(() => {
    return [...new Set(books.map(b => b.priority).filter(Boolean))].sort()
  }, [books])

  const yearBounds = useMemo(() => {
    const years = books.map(b => b.year).filter(y => y && y > 0)
    if (years.length === 0) return [1800, 2030]
    return [Math.min(...years), Math.max(...years)]
  }, [books])

  // Apply filters
  const filteredBooks = useMemo(() => {
    return books.filter(book => {
      // Search filter
      if (searchTerm) {
        const search = searchTerm.toLowerCase()
        const matchTitle = book.title?.toLowerCase().includes(search)
        const matchAuthor = book.author?.toLowerCase().includes(search)
        if (!matchTitle && !matchAuthor) return false
      }

      // Class filter
      if (selectedClasses.length > 0 && !selectedClasses.includes(book.book_class)) {
        return false
      }

      // Category filter
      if (selectedCategories.length > 0 && !selectedCategories.includes(book.category)) {
        return false
      }

      // Status filter
      if (selectedStatuses.length > 0 && !selectedStatuses.includes(book.status)) {
        return false
      }

      // Priority filter
      if (selectedPriorities.length > 0 && !selectedPriorities.includes(book.priority)) {
        return false
      }

      // Year range filter
      if (book.year && (book.year < yearRange[0] || book.year > yearRange[1])) {
        return false
      }

      return true
    })
  }, [books, searchTerm, selectedClasses, selectedCategories, selectedStatuses, selectedPriorities, yearRange])

  const sortedBooks = useMemo(() => {
    return [...filteredBooks].sort((a, b) => {
      let aVal = a[sortConfig.key]
      let bVal = b[sortConfig.key]
      
      // For 'order' column, treat 0, null, undefined, and empty string as "no order"
      if (sortConfig.key === 'order') {
        const isAEmpty = aVal == null || aVal === 0 || aVal === '' || aVal === '-'
        const isBEmpty = bVal == null || bVal === 0 || bVal === '' || bVal === '-'
        
        if (isAEmpty && isBEmpty) return 0
        if (isAEmpty) return 1  // a goes to end
        if (isBEmpty) return -1 // b goes to end
      } else {
        // For other columns, only check null/undefined
        if (aVal == null && bVal == null) return 0
        if (aVal == null) return 1
        if (bVal == null) return -1
      }
      
      // Normal comparison for non-null values
      if (aVal < bVal) {
        return sortConfig.direction === 'asc' ? -1 : 1
      }
      if (aVal > bVal) {
        return sortConfig.direction === 'asc' ? 1 : -1
      }
      return 0
    })
  }, [filteredBooks, sortConfig])

  const requestSort = (key) => {
    let direction = 'asc'
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc'
    }
    setSortConfig({ key, direction })
  }

  const handleDelete = async (id) => {
      if (window.confirm("Tem certeza que deseja apagar este livro?")) {
          try {
              await api.delete(`/api/books/${id}`)
              onDelete(id)
          } catch (err) {
              alert("Erro ao deletar livro.")
              console.error(err)
          }
      }
  }

  const toggleFilter = (value, selected, setSelected) => {
    if (selected.includes(value)) {
      setSelected(selected.filter(v => v !== value))
    } else {
      setSelected([...selected, value])
    }
  }

  const clearAllFilters = () => {
    setSearchTerm('')
    setSelectedClasses([])
    setSelectedCategories([])
    setSelectedStatuses([])
    setSelectedPriorities([])
    setYearRange(yearBounds)
  }

  const hasActiveFilters = searchTerm || selectedClasses.length > 0 || selectedCategories.length > 0 || 
    selectedStatuses.length > 0 || selectedPriorities.length > 0 ||
    yearRange[0] !== yearBounds[0] || yearRange[1] !== yearBounds[1]

  const columns = [
    { key: 'order', label: '#', width: 'w-12' },
    { key: 'title', label: 'Título', width: 'w-64' },
    { key: 'author', label: 'Autor', width: 'w-40' },
    { key: 'year', label: 'Ano', width: 'w-16' },
    { key: 'type', label: 'Tipo', width: 'w-24' },
    { key: 'priority', label: 'Prior.', width: 'w-28' },
    { key: 'score', label: 'Score', width: 'w-16' },
    { key: 'status', label: 'Status', width: 'w-24' },
    { key: 'book_class', label: 'Classe', width: 'w-40' },
    { key: 'category', label: 'Categoria', width: 'w-32' },
    { key: 'availability', label: 'Disp.', width: 'w-20' },
    { key: 'rating', label: '★', width: 'w-12' },
    { key: 'date_read', label: 'Lido', width: 'w-20' },
  ]

  return (
    <div className="space-y-4">
      {/* Filters Bar */}
      <div className="bg-neutral-900 rounded-lg p-4 border border-neutral-800">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-white">📋 Filtros</h3>
          {hasActiveFilters && (
            <button 
              onClick={clearAllFilters}
              className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1"
            >
              <X size={14} /> Limpar Filtros
            </button>
          )}
        </div>

        <div className="space-y-3">
          {/* Search - Full Width */}
          <div>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 text-neutral-500 w-4 h-4" />
              <input
                type="text"
                placeholder="🔍 Buscar por Título ou Autor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          {/* Classes - Full Width Row */}
          <div>
            <label className="block text-xs text-neutral-400 mb-1.5">Classes</label>
            <div className="flex flex-wrap gap-1.5 bg-neutral-800 border border-neutral-700 rounded p-2">
              {uniqueClasses.map(cls => (
                <button
                  key={cls}
                  onClick={() => toggleFilter(cls, selectedClasses, setSelectedClasses)}
                  className={`text-xs px-2 py-1 rounded transition-colors ${
                    selectedClasses.includes(cls)
                      ? 'bg-purple-600 text-white'
                      : 'bg-neutral-700 text-neutral-300 hover:bg-neutral-600'
                  }`}
                >
                  {cls}
                </button>
              ))}
            </div>
          </div>

          {/* Categories - Full Width Row */}
          <div>
            <label className="block text-xs text-neutral-400 mb-1.5">Categorias</label>
            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto bg-neutral-800 border border-neutral-700 rounded p-2">
              {uniqueCategories.map(cat => (
                <button
                  key={cat}
                  onClick={() => toggleFilter(cat, selectedCategories, setSelectedCategories)}
                  className={`text-xs px-2 py-1 rounded transition-colors ${
                    selectedCategories.includes(cat)
                      ? 'bg-purple-600 text-white'
                      : 'bg-neutral-700 text-neutral-300 hover:bg-neutral-600'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Status, Priority, Year - Single Row */}
          <div className="grid grid-cols-3 gap-4">
            {/* Status */}
            <div>
              <label className="block text-xs text-neutral-400 mb-1.5">Status</label>
              <div className="flex gap-1.5 flex-wrap">
                {uniqueStatuses.map(status => (
                  <button
                    key={status}
                    onClick={() => toggleFilter(status, selectedStatuses, setSelectedStatuses)}
                    className={`text-xs px-3 py-1.5 rounded transition-colors ${
                      selectedStatuses.includes(status)
                        ? 'bg-purple-600 text-white'
                        : 'bg-neutral-700 text-neutral-300 hover:bg-neutral-600'
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>

            {/* Priority */}
            <div>
              <label className="block text-xs text-neutral-400 mb-1.5">Prioridade</label>
              <div className="flex gap-1.5 flex-wrap">
                {uniquePriorities.map(prio => (
                  <button
                    key={prio}
                    onClick={() => toggleFilter(prio, selectedPriorities, setSelectedPriorities)}
                    className={`text-xs px-2 py-1 rounded transition-colors ${
                      selectedPriorities.includes(prio)
                        ? 'bg-purple-600 text-white'
                        : 'bg-neutral-700 text-neutral-300 hover:bg-neutral-600'
                    }`}
                  >
                    {prio}
                  </button>
                ))}
              </div>
            </div>

            {/* Year Range - Dual Thumb Slider */}
            <div>
              <label className="block text-xs text-neutral-400 mb-1.5">
                Ano: {yearRange[0]} - {yearRange[1]}
              </label>
              <div className="relative pt-2 pb-1">
                {/* Track background */}
                <div className="absolute top-1/2 left-0 right-0 h-1 bg-neutral-700 rounded-full -translate-y-1/2"></div>
                
                {/* Active range */}
                <div 
                  className="absolute top-1/2 h-1 bg-purple-600 rounded-full -translate-y-1/2"
                  style={{
                    left: `${((yearRange[0] - yearBounds[0]) / (yearBounds[1] - yearBounds[0])) * 100}%`,
                    right: `${100 - ((yearRange[1] - yearBounds[0]) / (yearBounds[1] - yearBounds[0])) * 100}%`
                  }}
                ></div>
                
                {/* Min slider */}
                <input
                  type="range"
                  min={yearBounds[0]}
                  max={yearBounds[1]}
                  value={yearRange[0]}
                  onChange={(e) => {
                    const newMin = parseInt(e.target.value)
                    if (newMin <= yearRange[1]) {
                      setYearRange([newMin, yearRange[1]])
                    }
                  }}
                  className="absolute w-full appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-purple-600 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-purple-600 [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white"
                  style={{ zIndex: yearRange[0] > yearBounds[0] + (yearBounds[1] - yearBounds[0]) * 0.5 ? 5 : 3 }}
                />
                
                {/* Max slider */}
                <input
                  type="range"
                  min={yearBounds[0]}
                  max={yearBounds[1]}
                  value={yearRange[1]}
                  onChange={(e) => {
                    const newMax = parseInt(e.target.value)
                    if (newMax >= yearRange[0]) {
                      setYearRange([yearRange[0], newMax])
                    }
                  }}
                  className="absolute w-full appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-purple-600 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-purple-600 [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white"
                  style={{ zIndex: yearRange[1] < yearBounds[0] + (yearBounds[1] - yearBounds[0]) * 0.5 ? 5 : 4 }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-3 text-xs text-neutral-500">
          Mostrando {sortedBooks.length} de {books.length} livros
        </div>
      </div>

      {/* Table */}
      <div className="bg-neutral-900 rounded-lg shadow border border-neutral-800 w-full">
        <div className="overflow-x-auto">
          <table className="w-full divide-y divide-neutral-800">
            <thead className="bg-neutral-950">
              <tr>
                {columns.map(({ key, label }) => (
                  <th
                    key={key}
                    onClick={() => requestSort(key)}
                    className="px-3 py-2.5 text-left text-[10px] font-bold text-neutral-400 uppercase tracking-wider cursor-pointer hover:bg-neutral-800 transition-colors whitespace-nowrap"
                  >
                    <div className="flex items-center gap-1">
                      {label}
                      <ArrowUpDown size={10} />
                    </div>
                  </th>
                ))}
                <th className="px-3 py-2.5 text-right text-[10px] font-medium text-neutral-400 uppercase tracking-wider whitespace-nowrap">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-neutral-900 divide-y divide-neutral-800">
              {sortedBooks.map((book) => (
                <tr key={book.id} className="hover:bg-neutral-800 transition-colors">
                  <td className="px-3 py-2 whitespace-nowrap text-xs font-mono text-neutral-400">
                      {book.order || '-'}
                  </td>
                  <td className="px-3 py-2 text-xs font-medium text-white max-w-[256px] truncate" title={book.title}>
                      {book.title}
                  </td>
                  <td className="px-3 py-2 text-xs text-neutral-300 max-w-[160px] truncate" title={book.author}>
                      {book.author}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-xs text-neutral-400">
                      {book.year || '-'}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-xs">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded ${book.type === 'Técnico' ? 'bg-purple-500/20 text-purple-300' : 'bg-blue-500/20 text-blue-300'}`}>
                        {book.type === 'Técnico' ? 'Téc' : 'N-Téc'}
                      </span>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-xs text-neutral-400">
                      {book.priority?.split(' - ')[0] || '-'}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-xs font-mono text-purple-400 text-center">
                     {book.score ? book.score.toFixed(0) : '-'}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-xs">
                     <span className={`px-1.5 inline-flex text-[10px] leading-4 font-semibold rounded-full 
                        ${book.status === 'Lendo' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : 
                          book.status === 'Lido' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 
                          'bg-amber-500/20 text-amber-300 border border-amber-500/30'}`}>
                        {book.status}
                     </span>
                  </td>
                  <td className="px-3 py-2 text-xs text-purple-300 max-w-[160px] truncate" title={book.book_class}>
                      {book.book_class || '-'}
                  </td>
                  <td className="px-3 py-2 text-xs text-neutral-400 max-w-[128px] truncate" title={book.category}>
                     {book.category}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-xs text-neutral-400 truncate max-w-[80px]" title={book.availability}>
                      {book.availability || '-'}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-xs text-amber-400 font-bold text-center">
                     {book.rating || '-'}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-xs text-neutral-400">
                     {book.date_read || '-'}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-right text-xs font-medium">
                    <div className="flex justify-end gap-1.5">
                      <button 
                          onClick={() => onEdit(book)}
                          className="text-purple-400 hover:text-purple-300 transition-colors p-1" 
                          title="Editar">
                          <Pencil size={14} />
                      </button>
                      <button 
                          onClick={() => handleDelete(book.id)}
                          className="text-red-400 hover:text-red-300 transition-colors p-1"
                          title="Excluir">
                          <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
