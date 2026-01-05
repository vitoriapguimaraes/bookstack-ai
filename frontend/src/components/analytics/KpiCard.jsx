import React from 'react'

export function KpiCard({ title, value, icon: Icon, color, subValue }) {
    return (
        <div className="bg-neutral-900 border border-neutral-800 p-5 rounded-xl group hover:border-neutral-700 transition-colors flex items-center gap-4">
            <div className={`p-3 rounded-lg bg-opacity-10 ${color.replace('text-', 'bg-')} ${color}`}>
                <Icon size={24} />
            </div>
            <div>
                <p className="text-neutral-400 text-xs uppercase tracking-wider font-medium">{title}</p>
                <p className="text-2xl font-light text-white">{value}</p>
                {subValue && <p className="text-xs text-neutral-500 mt-0.5">{subValue}</p>}
            </div>
        </div>
    )
}
