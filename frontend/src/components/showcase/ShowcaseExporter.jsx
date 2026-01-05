import { useState, useRef } from 'react'
import { X, Download, Loader2 } from 'lucide-react'
import html2canvas from 'html2canvas'

export default function ShowcaseExporter({ books, onClose }) {
  const [isExporting, setIsExporting] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [previewUrl, setPreviewUrl] = useState(null)
  const exportRef = useRef(null)

  const handleExport = async () => {
    if (!exportRef.current) return

    setIsExporting(true)

    // Wait for layout to settle
    await new Promise(resolve => setTimeout(resolve, 100))

    try {
      const canvas = await html2canvas(exportRef.current, {
        scale: 2,
        backgroundColor: '#FAFAFA',
        useCORS: true,
        width: 1200,
        height: 630,
        windowWidth: 1200,
        windowHeight: 630,
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

  // Get top 12 books with covers
  const displayBooks = books
    .filter(b => b.status === 'Lido' && b.cover_url)
    .slice(0, 12)

  const totalRead = books.filter(b => b.status === 'Lido').length

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-neutral-800">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white">
              Exportar para LinkedIn
            </h2>
            <p className="text-sm text-slate-500 dark:text-neutral-400 mt-1">
              Gere uma imagem otimizada (1200x630px) para compartilhar
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
              {/* Template Preview */}
              <div className="bg-slate-100 dark:bg-neutral-800 rounded-lg p-4 mb-6">
                <div
                  ref={exportRef}
                  className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg overflow-hidden"
                  style={{ width: '1200px', height: '630px', transform: 'scale(0.5)', transformOrigin: 'top left' }}
                >
                  {/* Template Content */}
                  <div className="w-full h-full p-12 flex flex-col">
                    
                    {/* Header */}
                    <div className="mb-8">
                      <h1 className="text-6xl font-bold text-slate-800 mb-2">
                        Minha Jornada de Leitura
                      </h1>
                      <p className="text-3xl text-slate-600">
                        {totalRead} livros lidos • {new Date().getFullYear()}
                      </p>
                    </div>

                    {/* Books Grid */}
                    <div className="flex-1 grid grid-cols-6 gap-4">
                      {displayBooks.map((book, idx) => (
                        <div
                          key={idx}
                          className="aspect-[2/3] rounded-lg overflow-hidden shadow-lg"
                        >
                          {book.cover_url ? (
                            <img
                              src={book.cover_url}
                              alt={book.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center p-2">
                              <span className="text-white text-xs font-bold text-center line-clamp-3">
                                {book.title}
                              </span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Footer */}
                    <div className="mt-8 flex items-center justify-between">
                      <div className="text-2xl font-semibold text-slate-700">
                        bookstack-ai
                      </div>
                      <div className="text-xl text-slate-500">
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
              <div className="mb-6">
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-full rounded-lg shadow-lg"
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
