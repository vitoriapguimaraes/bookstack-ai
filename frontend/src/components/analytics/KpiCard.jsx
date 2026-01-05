import React from 'react'

export function KpiCard({ title, value, icon: Icon, color, subValue }) {
    // color prop is expected to be 'text-pastel-blue' etc.
    // We will extract the color name to form the bg class separately 
    // OR just use a hardcoded map if dynamic classes are failing.
    // For now, let's keep it simple and assume the color prop is safe TO USE IN TEXT.
    // And we try to replace 'text-' with 'bg-' for the background.
    
    const bgClass = color.replace('text-', 'bg-')

    return (
        <div className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 p-5 rounded-xl group hover:border-purple-300 dark:hover:border-neutral-700 transition-all shadow-sm flex items-center gap-4">
            <div className={`p-3 rounded-lg bg-slate-50 dark:bg-neutral-800 border border-slate-100 dark:border-neutral-700 flex items-center justify-center shrink-0`}>
                <Icon size={24} className={color} />
            </div>
            <div>
                <p className="text-slate-500 dark:text-neutral-400 text-xs uppercase tracking-wider font-medium">{title}</p>
                <p className="text-2xl font-light text-slate-800 dark:text-white">{value}</p>
                {subValue && <p className="text-xs text-slate-400 dark:text-neutral-500 mt-0.5">{subValue}</p>}
            </div>
        </div>
    )
}
