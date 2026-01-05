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
      <div className="flex items-center justify-between mb-8">
         <div>
           <h1 className="text-3xl font-bold text-white">Análise da Biblioteca</h1>
           <p className="text-slate-400 text-sm mt-1">Visualize indicadores e tendências do seu histórico de leitura.</p>
         </div>
      </div>
      
      {/* KPI Cards - Grid of 5 */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
         <KpiCard title="Total" value={stats.kpi.total} icon={Library} color="text-blue-500" />
         <KpiCard title="Lidos" value={stats.kpi.lidos} icon={BookOpen} color="text-emerald-500" />
         <KpiCard title="Na Fila" value={stats.kpi.aLer} icon={Book} color="text-amber-500" />
         <KpiCard title="Nota Média" value={stats.kpi.avgRating.toFixed(1)} icon={Star} color="text-rose-500" />
         <KpiCard title="Índice Médio" value={stats.kpi.avgScore.toFixed(0)} icon={Activity} color="text-violet-500" />
      </div>
      
      {/* Historical Insights Section */}
      <InsightsGrid insights={stats.insights} />

      {/* Timeline Section */}
      <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-xl h-[500px] flex flex-col">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4 flex-shrink-0">
             <div className="flex items-center gap-4">
                <h3 className="text-lg font-light text-neutral-200">Histórico de Leitura</h3>
                <div className="flex bg-neutral-800 rounded p-0.5">
                    {['yearly', 'monthly'].map(p => (
                       <button
                         key={p}
                         onClick={() => setTimelinePeriod(p)}
                         className={`px-3 py-1 text-[10px] uppercase tracking-wider transition-all rounded ${
                            timelinePeriod === p
                            ? 'bg-neutral-600 text-white font-medium shadow-sm'
                            : 'text-neutral-500 hover:text-neutral-300'
                         }`}
                       >
                         {p === 'monthly' ? 'Ano/Mês' : 'Ano'}
                       </button>
                    ))}
                </div>
             </div>
             <div className="flex bg-neutral-800 rounded p-1 gap-1">
                {['total', 'type', 'class', 'category'].map(t => (
                  <button
                    key={t}
                    onClick={() => setTimelineType(t)}
                    className={`px-3 py-1.5 text-xs font-medium rounded transition-all ${
                      timelineType === t
                        ? 'bg-neutral-700 text-white shadow-sm'
                        : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-700/50'
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
          getColor={(entry) => entry.name === 'Técnico' ? '#06b6d4' : '#f43f5e'}
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
