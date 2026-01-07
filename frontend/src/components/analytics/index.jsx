import { useState, useRef } from 'react'
import { Book, Star, BookOpen, Library, Activity, Download, Layers, Loader2 } from 'lucide-react'
import { KpiCard } from './KpiCard'
import { DistributionChart } from './DistributionChart'
import { TimelineChart } from './TimelineChart'
import { InsightsGrid } from './InsightsGrid'
import { useAnalyticsData } from './useAnalyticsData'
import { getClassBaseHSL, hslToString } from './analyticsUtils'
import html2canvas from 'html2canvas'
import { useToast } from '../../context/ToastContext'


export default function Analytics({ books }) {
  const { addToast } = useToast()
  const [timelineType, setTimelineType] = useState('total')
  const [timelinePeriod, setTimelinePeriod] = useState('yearly') // 'monthly' | 'yearly'
  const [isExporting, setIsExporting] = useState(false)
  
  const reportRef = useRef(null)


  const stats = useAnalyticsData(books)

  if (!books) return <div className="p-10 text-center animate-pulse text-neutral-500">Carregando dados...</div>
  if (!stats) return <div className="p-10 text-center text-neutral-500">Nenhum livro encontrado para análise.</div>

  const handleExportReport = async () => {
      if (!reportRef.current) return
      
      const isDarkMode = document.documentElement.classList.contains('dark')
      const bgColor = isDarkMode ? '#171717' : '#FAFAFA'

      setIsExporting(true)

      // Wait a moment for any robust layouts to settle if needed
      await new Promise(resolve => setTimeout(resolve, 100))

      try {
          const element = reportRef.current
          const canvas = await html2canvas(element, {
              scale: 2, 
              backgroundColor: bgColor, 
              useCORS: true,
              scrollX: 0,
              scrollY: 0, // Force capture from top-left logic
              width: element.scrollWidth, // Capture full width
              height: element.scrollHeight + 50, // Capture full height + branding padding
              windowWidth: element.scrollWidth + 50, // Ensure window context is large enough
              onclone: (clonedDoc) => {
                  const buttons = clonedDoc.querySelectorAll('button')
                  buttons.forEach(btn => btn.style.display = 'none')

                  const scrollControls = clonedDoc.querySelector('.fixed.bottom-8.right-8')
                  if (scrollControls) scrollControls.style.display = 'none'
                  
                  // Ensure container fits
                  const clonedElement = clonedDoc.body.querySelector('.space-y-6')
                  if (clonedElement) {
                      clonedElement.style.height = 'auto'
                      clonedElement.style.overflow = 'visible'
                  }
              }
          })
          const link = document.createElement('a')
          link.download = `relatorio-leitura-${new Date().toISOString().slice(0,10)}.png`
          link.href = canvas.toDataURL('image/png')
          link.click()
          addToast({ type: 'success', message: 'Relatório exportado com sucesso!' })
      } catch (err) {
          console.error("Export failed:", err)
          addToast({ type: 'error', message: 'Erro ao exportar relatório.' })
      } finally {
          setIsExporting(false)
      }
  }

  const handleExportChart = async (elementId, filename) => {
      const element = document.getElementById(elementId)
      if (!element) return
      
      const isDarkMode = document.documentElement.classList.contains('dark')
      const bgColor = isDarkMode ? '#171717' : '#FFFFFF'

      try {
          const canvas = await html2canvas(element, { 
              scale: 2, 
              backgroundColor: bgColor,
              windowWidth: 1000,
              onclone: (clonedDoc) => {
                  // Hide buttons inside the chart container (like the download button itself)
                  const buttons = clonedDoc.querySelectorAll('button')
                  buttons.forEach(btn => btn.style.display = 'none')
              }
          })
          const link = document.createElement('a')
          link.download = `${filename}.png`
          link.href = canvas.toDataURL('image/png')
          link.click()
      } catch (err) {
          console.error("Chart export failed", err)
      }
  }

  return (
    <div ref={reportRef} className="space-y-6 pb-10 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
         <div>
           <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Análise da Biblioteca</h1>
           <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Visualize indicadores e tendências do seu histórico de leitura.</p>
         </div>
         <button 
            onClick={handleExportReport}
            disabled={isExporting}
            className={`flex items-center gap-2 px-4 py-2 bg-white dark:bg-neutral-800 text-slate-700 dark:text-white border border-slate-200 dark:border-neutral-700 hover:bg-slate-50 dark:hover:bg-neutral-700 rounded-lg text-sm font-medium transition-colors shadow-sm ${isExporting ? 'opacity-70 cursor-wait' : ''}`}
         >
             {isExporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
             <span className="hidden md:inline">{isExporting ? 'Exportando...' : 'Exportar Relatório'}</span>
         </button>
      </div>

      {stats.meta.unmappedCategories && stats.meta.unmappedCategories.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/50 p-4 rounded-lg flex gap-3 text-sm text-amber-800 dark:text-amber-200">
            <Activity className="shrink-0 mt-0.5" size={16} />
            <div>
                <p className="font-bold mb-1">Categorias sem Classe definida detectadas:</p>
                <p className="opacity-90 mb-2">As seguintes categorias não possuem uma classe associada (ou estão como "Outros") e aparecerão em cinza nos gráficos. Edite os livros no Mural ou na Tabela para corrigir.</p>
                <div className="flex flex-wrap gap-2">
                    {stats.meta.unmappedCategories.map(cat => (
                        <span key={cat} className="px-2 py-1 bg-amber-100 dark:bg-amber-800/50 rounded text-xs font-mono">{cat}</span>
                    ))}
                </div>
            </div>
        </div>
      )}
      
      {/* KPI Cards - Grid of 5. Standardized icons. */}
      {/* Note: KpiCard component handles styling. We just pass clean icons/colors. */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
         <KpiCard title="Total" value={stats.kpi.total} icon={Library} color="text-pastel-blue" />
         <KpiCard title="Lidos" value={stats.kpi.lidos} icon={BookOpen} color="text-pastel-green" />
         <KpiCard title="Na Fila" value={stats.kpi.aLer} icon={Layers} color="text-pastel-orange" />
         <KpiCard title="Nota Média" value={stats.kpi.avgRating.toFixed(1)} icon={Star} color="text-pastel-red" />
         <KpiCard title="Índice Médio" value={stats.kpi.avgScore.toFixed(0)} icon={Activity} color="text-pastel-purple" />
      </div>
      
      {/* Historical Insights Section */}
      <InsightsGrid insights={stats.insights} />

      {/* Timeline Section */}
      <div id="chart-timeline" className="relative bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 p-6 rounded-xl min-h-[500px] h-auto flex flex-col shadow-sm group">
          <button 
                onClick={() => handleExportChart('chart-timeline', 'historico-leitura')}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 bg-white/50 hover:bg-white rounded-full opacity-0 group-hover:opacity-100 transition-all z-10"
                title="Salvar gráfico"
          >
              <Download size={16} />
          </button>

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4 flex-shrink-0">
             <div className="flex items-center gap-4">
                <h3 className="text-lg font-light text-slate-700 dark:text-neutral-200">Histórico de Leitura</h3>
                <div className="flex bg-slate-100 dark:bg-neutral-800 rounded p-0.5">
                    {['yearly', 'monthly'].map(p => (
                       <button
                         key={p}
                         onClick={() => setTimelinePeriod(p)}
                         className={`px-3 py-1 text-[10px] uppercase tracking-wider transition-all rounded ${
                            timelinePeriod === p
                            ? 'bg-white dark:bg-neutral-600 text-slate-800 dark:text-white font-medium shadow-sm'
                            : 'text-slate-500 dark:text-neutral-500 hover:text-slate-700 dark:hover:text-neutral-300'
                         }`}
                       >
                         {p === 'monthly' ? 'Ano/Mês' : 'Ano'}
                       </button>
                    ))}
                </div>
             </div>
             <div className="flex bg-slate-100 dark:bg-neutral-800 rounded p-1 gap-1 mr-12">
                {['total', 'type', 'class', 'category'].map(t => (
                  <button
                    key={t}
                    onClick={() => setTimelineType(t)}
                    className={`px-3 py-1.5 text-xs font-medium rounded transition-all ${
                      timelineType === t
                        ? 'bg-white dark:bg-neutral-700 text-slate-800 dark:text-white shadow-sm'
                        : 'text-slate-500 dark:text-neutral-400 hover:text-slate-700 dark:hover:text-neutral-200 hover:bg-slate-200 dark:hover:bg-neutral-700/50'
                    }`}
                  >
                    {t === 'total' ? 'Total' : t === 'type' ? 'Tipo' : t === 'class' ? 'Classe' : 'Categoria'}
                  </button>
                ))}
             </div>
          </div>
          
          <div className="flex-1 min-h-0 w-full">
             <TimelineChart stats={stats} timelineType={timelineType} timelinePeriod={timelinePeriod} />
          </div>
      </div>

      {/* Distributions (Charts) */}
      <div id="chart-types" className="relative group">
          <DistributionChart 
              title="Por Tipo" 
              dataLidos={stats.dist.lidos.type} 
              dataNaoLidos={stats.dist.naoLidos.type} 
              chartType="bar"
              getColor={(entry) => entry.name === 'Técnico' ? '#d8b4fe' : '#fca5a5'} 
          />
           <button 
                onClick={() => handleExportChart('chart-types', 'distribuicao-tipos')}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 bg-white/50 hover:bg-white rounded-full opacity-0 group-hover:opacity-100 transition-all z-10"
          >
              <Download size={16} />
          </button>
      </div>

      <div id="chart-classes" className="relative group">
          <DistributionChart 
              title="Por Classe" 
              dataLidos={stats.dist.lidos.class} 
              dataNaoLidos={stats.dist.naoLidos.class} 
              chartType="bar"
              getColor={(entry) => hslToString(getClassBaseHSL(entry.name))}
          />
          <button 
                onClick={() => handleExportChart('chart-classes', 'distribuicao-classes')}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 bg-white/50 hover:bg-white rounded-full opacity-0 group-hover:opacity-100 transition-all z-10"
          >
              <Download size={16} />
          </button>
      </div>

      <div id="chart-categories" className="relative group">
          <DistributionChart 
              title="Por Categoria (Top 10)" 
              dataLidos={stats.dist.lidos.category.slice(0, 10)} 
              dataNaoLidos={stats.dist.naoLidos.category.slice(0, 10)} 
              chartType="bar"
              getColor={(entry) => stats.meta.categoryColors[entry.name]}
          />
          <button 
                onClick={() => handleExportChart('chart-categories', 'distribuicao-categorias')}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 bg-white/50 hover:bg-white rounded-full opacity-0 group-hover:opacity-100 transition-all z-10"
          >
              <Download size={16} />
          </button>
      </div>


    </div>
  )
}
