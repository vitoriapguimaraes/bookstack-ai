import React from 'react'
import { Library, Calendar, TrendingUp, Star } from 'lucide-react'

export function InsightsGrid({ insights }) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Start of Journey Card */}
            {insights.oldestRead && (
                <div className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 p-5 rounded-xl group hover:border-pastel-blue dark:hover:border-neutral-700 transition-all shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-pastel-blue/20 rounded-lg text-blue-600 dark:text-pastel-blue">
                        <Library size={24} />
                    </div>
                    <div className="min-w-0 flex-1">
                        <h4 className="text-slate-500 dark:text-neutral-400 text-xs uppercase tracking-wider font-medium">Desde</h4>
                        <p className="text-xl font-light text-slate-800 dark:text-white capitalize">
                            {new Date(insights.oldestRead.date_read).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }).replace('. de ', '/').replace('.', '/').replace(' de ', '/')}
                        </p>
                        <p className="text-xs text-slate-400 dark:text-neutral-500 mt-0.5 truncate" title={insights.oldestRead.title}>
                            <span className="text-slate-600 dark:text-neutral-300">{insights.oldestRead.title}</span>
                        </p>
                    </div>
                </div>
            )}

            {/* Latest Read Card */}
            {insights.newestRead && (
                <div className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 p-5 rounded-xl group hover:border-pastel-purple dark:hover:border-neutral-700 transition-all shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-pastel-purple/20 rounded-lg text-purple-600 dark:text-pastel-purple">
                        <Calendar size={24} />
                    </div>
                    <div className="min-w-0 flex-1">
                        <h4 className="text-slate-500 dark:text-neutral-400 text-xs uppercase tracking-wider font-medium">Última Leitura</h4>
                        <p className="text-xl font-light text-slate-800 dark:text-white capitalize">
                            {new Date(insights.newestRead.date_read).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }).replace('. de ', '/').replace('.', '/').replace(' de ', '/')}
                        </p>
                        <p className="text-xs text-slate-400 dark:text-neutral-500 mt-0.5 truncate" title={insights.newestRead.title}>
                            <span className="text-slate-600 dark:text-neutral-300">{insights.newestRead.title}</span>
                        </p>
                    </div>
                </div>
            )}

            {/* Busiest Year Card */}
            {insights.busiestYear && (
                <div className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 p-5 rounded-xl group hover:border-pastel-green dark:hover:border-neutral-700 transition-all shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-pastel-green/20 rounded-lg text-green-600 dark:text-pastel-green">
                        <TrendingUp size={24} />
                    </div>
                    <div className="min-w-0 flex-1">
                        <h4 className="text-slate-500 dark:text-neutral-400 text-xs uppercase tracking-wider font-medium">
                            {insights.busiestYear.years.length > 1 ? 'Anos de Ouro' : 'Ano de Ouro'}
                        </h4>
                        <p className="text-xl font-light text-slate-800 dark:text-white truncate" title={insights.busiestYear.years.join(', ')}>
                            {insights.busiestYear.years.join(', ')}
                        </p>
                        <p className="text-xs text-slate-400 dark:text-neutral-500 mt-0.5">
                            <span className="text-slate-600 dark:text-neutral-300">{insights.busiestYear.count} leituras</span>
                        </p>
                    </div>
                </div>
            )}

            {/* Top Author Card */}
            {insights.topAuthor && (
                <div className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 p-5 rounded-xl group hover:border-pastel-pink dark:hover:border-neutral-700 transition-all shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-pastel-pink/20 rounded-lg text-pink-600 dark:text-pastel-pink">
                        <Star size={24} />
                    </div>
                    <div className="min-w-0 flex-1">
                        <h4 className="text-slate-500 dark:text-neutral-400 text-xs uppercase tracking-wider font-medium">
                            {insights.topAuthor.names.length > 1 ? 'Autores Favoritos' : 'Autor Favorito'}
                        </h4>
                        <p className="text-xl font-light text-slate-800 dark:text-white truncate" title={insights.topAuthor.names.join(', ')}>
                            {insights.topAuthor.names.join(', ')}
                        </p>
                        <p className="text-xs text-slate-400 dark:text-neutral-500 mt-0.5">
                            <span className="text-slate-600 dark:text-neutral-300">{insights.topAuthor.count} obras</span>
                        </p>
                    </div>
                </div>
            )}
        </div>
    )
}
