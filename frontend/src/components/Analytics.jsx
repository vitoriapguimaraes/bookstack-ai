import { useState } from 'react'
import { Book, Star, BookOpen, Library, Activity } from 'lucide-react'
import { KpiCard } from './analytics/KpiCard'
import { DistributionChart } from './analytics/DistributionChart'
import { TimelineChart } from './analytics/TimelineChart'
import { InsightsGrid } from './analytics/InsightsGrid'
import { useAnalyticsData } from './analytics/useAnalyticsData'
import { getClassBaseHSL, hslToString } from './analytics/analyticsUtils'

export default function Analytics({ books }) {
  const [timelineType, setTimelineType] = useState('total')
  const [timelinePeriod, setTimelinePeriod] = useState('yearly') // 'monthly' | 'yearly'

  const stats = useAnalyticsData(books)

  if (!books) return <div className="p-10 text-center animate-pulse text-neutral-500">Carregando dados...</div>
  if (!stats) return <div className="p-10 text-center text-neutral-500">Nenhum livro encontrado para análise.</div>

  return (
    <div className="space-y-6 pb-32 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
         <div>
           <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Análise da Biblioteca</h1>
           <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Visualize indicadores e tendências do seu histórico de leitura.</p>
         </div>
      </div>
      
      {/* KPI Cards - Grid of 5 */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
         <KpiCard title="Total" value={stats.kpi.total} icon={Library} color="text-pastel-blue" />
         <KpiCard title="Lidos" value={stats.kpi.lidos} icon={BookOpen} color="text-pastel-green" />
         <KpiCard title="Na Fila" value={stats.kpi.aLer} icon={Book} color="text-pastel-orange" />
         <KpiCard title="Nota Média" value={stats.kpi.avgRating.toFixed(1)} icon={Star} color="text-pastel-red" />
         <KpiCard title="Índice Médio" value={stats.kpi.avgScore.toFixed(0)} icon={Activity} color="text-pastel-purple" />
      </div>
      
      {/* Historical Insights Section */}
      <InsightsGrid insights={stats.insights} />

      {/* Timeline Section */}
      <div className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 p-6 rounded-xl h-[500px] flex flex-col shadow-sm">
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
             <div className="flex bg-slate-100 dark:bg-neutral-800 rounded p-1 gap-1">
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
      <DistributionChart 
          title="Por Tipo" 
          dataLidos={stats.dist.lidos.type} 
          dataNaoLidos={stats.dist.naoLidos.type} 
          chartType="bar"
          getColor={(entry) => entry.name === 'Técnico' ? '#d8b4fe' : '#fca5a5'} // pastel-purple : pastel-pink
      />

      <DistributionChart 
          title="Por Classe" 
          dataLidos={stats.dist.lidos.class} 
          dataNaoLidos={stats.dist.naoLidos.class} 
          chartType="bar"
          getColor={(entry) => hslToString(getClassBaseHSL(entry.name))}
      />

      <DistributionChart 
          title="Por Categoria (Top 10)" 
          dataLidos={stats.dist.lidos.category.slice(0, 10)} 
          dataNaoLidos={stats.dist.naoLidos.category.slice(0, 10)} 
          chartType="bar"
          getColor={(entry) => stats.meta.categoryColors[entry.name]}
      />
    </div>
  )
}
