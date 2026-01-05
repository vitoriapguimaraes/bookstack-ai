import React from 'react'

export function KpiCard({ title, value, icon: Icon, color, subValue }) {
    return (
        <div className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 p-5 rounded-xl group hover:border-purple-300 dark:hover:border-neutral-700 transition-all shadow-sm flex items-center gap-4">
            <div className={`p-3 rounded-lg ${color.replace('text-', 'bg-')} bg-opacity-20 ${color}`}>
                <Icon size={24} />
            </div>
            <div>
                <p className="text-slate-500 dark:text-neutral-400 text-xs uppercase tracking-wider font-medium">{title}</p>
                <p className="text-2xl font-light text-slate-800 dark:text-white">{value}</p>
                {subValue && <p className="text-xs text-slate-400 dark:text-neutral-500 mt-0.5">{subValue}</p>}
            </div>
        </div>
    )
}
