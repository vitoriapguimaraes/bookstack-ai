import { useState, useRef } from 'react'
import { X, Download, Loader2, BookOpen, Star } from 'lucide-react'
import html2canvas from 'html2canvas'

export default function ShowcaseExporter({ books, selectedYears, filterClass, stats, activeBook, onClose }) {
  const [isExporting, setIsExporting] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [previewUrl, setPreviewUrl] = useState(null)
  const exportRef = useRef(null)

  const handleExport = async () => {
    if (!exportRef.current) return

    setIsExporting(true)

    // Wait for layout to settle
    await new Promise(resolve => setTimeout(resolve, 300))

    try {
      const canvas = await html2canvas(exportRef.current, {
        scale: 2,
        backgroundColor: null, // Use element's background (gradient)
        useCORS: true,
        allowTaint: true,
        logging: false,
        height: exportRef.current.scrollHeight, 
        windowHeight: exportRef.current.scrollHeight 
      })

      const dataUrl = canvas.toDataURL('image/png')
      setPreviewUrl(dataUrl)
      setShowPreview(true)
    } catch (err) {
      console.error('Export failed:', err)
      alert('Erro ao gerar imagem.')
    } finally {
      setIsExporting(false)
    }
  }

  const handleDownload = () => {
    if (!previewUrl) return

    const link = document.createElement('a')
    link.download = `bookstack-showcase-${new Date().toISOString().slice(0, 10)}.png`
    link.href = previewUrl
    link.click()
  }

  // Get books with covers for display - NO LIMIT
  const displayBooks = books.filter(b => b.cover_image)

  // Dynamic Grid Configuration
  const getGridConfig = () => {
      const count = displayBooks.length
      if (count > 24) return "grid-cols-8 gap-2"
      if (count > 12) return "grid-cols-7 gap-3"
      return "grid-cols-6 gap-4"
  }

  // Generate filter summary
  const filterSummary = () => {
    const parts = []
    if (selectedYears && selectedYears.length > 0) {
      if (selectedYears.length > 3) {
        // Sort numerically to find min and max even if array is unordered
        const sortedYears = [...selectedYears].sort((a, b) => a - b)
        const min = sortedYears[0]
        const max = sortedYears[sortedYears.length - 1]
        parts.push(`${min} - ${max}`)
      } else {
        parts.push(selectedYears.join(', '))
      }
    }
    if (filterClass && filterClass !== 'all') {
      parts.push(filterClass)
    }
    return parts.length > 0 ? parts.join(' • ') : 'Todos os livros lidos'
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-neutral-800">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white">
              Exportar
            </h2>
            <p className="text-sm text-slate-500 dark:text-neutral-400 mt-1">
              Gere uma imagem otimizada para compartilhar
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Preview Area */}
        <div className="p-6">
          {!showPreview ? (
            <>
              {/* Template Preview Wrapper */}
              <div className="bg-slate-100 dark:bg-neutral-800 rounded-lg p-4 mb-6 flex justify-center overflow-auto max-h-[60vh]">
                <div
                  ref={exportRef}
                  className="bg-gradient-to-br from-purple-50 to-blue-50 relative flex-shrink-0"
                  style={{ width: '1200px', minHeight: '630px', height: 'auto' }}
                >
                  {/* Template Content */}
                  <div className="w-full min-h-full p-8 pb-12 flex flex-col">
                    
                    {/* Header */}
                    <div className="mb-6 flex items-center justify-between border-b border-slate-200/60 pb-4">
                      <div className="flex items-baseline gap-3">
                        <h1 className="text-4xl font-black text-slate-800 tracking-tight">
                          Minha Estante Virtual
                        </h1>
                        <span className="text-2xl font-light text-slate-400">
                          {filterSummary()}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-3 bg-white px-6 py-3 rounded-full shadow-sm border border-slate-100">
                        <BookOpen size={22} className="text-purple-600" />
                        <div className="flex items-center gap-2">
                          <span className="text-2xl font-black text-slate-800 leading-tight">
                            {stats?.kpi?.total || books.length}
                          </span>
                          <span className="text-sm font-semibold text-slate-400">livros</span>
                        </div>
                      </div>
                    </div>

                    {/* Books Grid */}
                    <div className={`flex-1 grid ${getGridConfig()}`}>
                      {displayBooks.map((book, idx) => {
                        const coverUrl = book.cover_image 
                          ? `/api/proxy/image?url=${encodeURIComponent(book.cover_image)}`
                          : null
                        
                        return (
                          <div
                            key={idx}
                            className="aspect-[2/3] rounded-md overflow-hidden shadow-md bg-white"
                          >
                            {coverUrl ? (
                              <img
                                src={coverUrl}
                                alt={book.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-purple-100 to-purple-200 flex items-center justify-center p-2">
                                <span className="text-purple-900 text-[10px] font-bold text-center line-clamp-3 leading-tight">
                                  {book.title}
                                </span>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>

                    {/* Footer */}
                    <div className="mt-6 pt-4 border-t border-slate-200/50 flex items-center justify-between">
                      <div className="text-xl font-bold text-slate-700">
                        bookstack-ai
                      </div>
                      <div className="text-sm font-medium text-slate-400">
                        Gerado em {new Date().toLocaleDateString('pt-BR')}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Export Button */}
              <div className="flex justify-end gap-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-slate-600 dark:text-neutral-400 hover:text-slate-800 dark:hover:text-white transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleExport}
                  disabled={isExporting}
                  className={`flex items-center gap-2 px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors ${isExporting ? 'opacity-70 cursor-wait' : ''}`}
                >
                  {isExporting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Gerando...
                    </>
                  ) : (
                    <>
                      <Download size={16} />
                      Gerar Imagem
                    </>
                  )}
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Preview Image */}
              <div className="mb-6 bg-slate-100 dark:bg-neutral-800 p-4 rounded-lg flex justify-center">
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="max-w-full h-auto rounded-lg shadow-lg border border-slate-200"
                />
              </div>

              {/* Download Button */}
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowPreview(false)}
                  className="px-4 py-2 text-slate-600 dark:text-neutral-400 hover:text-slate-800 dark:hover:text-white transition-colors"
                >
                  Voltar
                </button>
                <button
                  onClick={handleDownload}
                  className="flex items-center gap-2 px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors"
                >
                  <Download size={16} />
                  Baixar Imagem
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
