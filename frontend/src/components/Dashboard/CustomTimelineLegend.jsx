import React from 'react'

export function CustomTimelineLegend({ items }) {
    if (!items || items.length === 0) return null

    return (
        <div className="flex flex-col gap-2 pl-4 overflow-y-auto max-h-[400px] scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-neutral-800 scrollbar-track-transparent">
            {items.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs group">
                    <div className="flex items-center gap-2 overflow-hidden">
                        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }}></span>
                        <span className="text-slate-500 dark:text-neutral-400 truncate group-hover:text-slate-900 dark:group-hover:text-neutral-200 transition-colors" title={item.label}>{item.label}</span>
                    </div>
                    <span className="text-slate-400 dark:text-neutral-600 font-mono ml-2">{item.value}</span>
                </div>
            ))}
        </div>
    )
}
