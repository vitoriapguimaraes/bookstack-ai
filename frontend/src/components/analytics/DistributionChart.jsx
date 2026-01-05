import React from 'react'
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend, BarChart, XAxis, YAxis, Bar } from 'recharts'
import { COLORS } from './analyticsUtils'

export function DistributionChart({ title, dataLidos, dataNaoLidos, chartType = 'pie', getColor }) {
    const getDynamicHeight = (data) => {
        if (chartType === 'pie') return '16rem' // h-64
        const headerOffset = 40
        const itemHeight = 50
        return `${headerOffset + data.length * itemHeight}px`
    }

    const resolveColor = (entry, index) => {
        if (getColor) return getColor(entry, index)
        return COLORS[index % COLORS.length]
    }

    return (
        <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-xl">
            <h3 className="text-lg font-light text-neutral-200 mb-8 flex items-center gap-2">
                <span className="w-1 h-4 bg-purple-500 rounded-full"></span>
                {title}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="flex flex-col" style={{ height: getDynamicHeight(dataLidos) }}>
                    <p className="text-sm font-medium text-neutral-500 mb-4 flex justify-between uppercase tracking-widest flex-shrink-0">
                        <span>Lidos</span>
                        <span className="text-neutral-300">{dataLidos.reduce((a, b) => a + b.value, 0)}</span>
                    </p>
                    <div className="flex-1 min-h-0 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            {chartType === 'pie' ? (
                                <PieChart>
                                    <Pie
                                        data={dataLidos}
                                        cx="50%" cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        fill="#333"
                                        paddingAngle={2}
                                        dataKey="value"
                                        isAnimationActive={false}
                                        stroke="none"
                                    >
                                        {dataLidos.map((entry, index) => <Cell key={`cell-${index}`} fill={resolveColor(entry, index)} />)}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#171717', border: '1px solid #262626', borderRadius: '0px', color: '#fff' }}
                                        itemStyle={{ color: '#d4d4d4' }}
                                        isAnimationActive={false}
                                    />
                                    <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', color: '#999' }} />
                                </PieChart>
                            ) : (
                                <BarChart data={dataLidos} layout="vertical" margin={{ left: 20 }}>
                                    <XAxis type="number" hide />
                                    <YAxis dataKey="name" type="category" width={170} tick={{ fontSize: 11, fill: '#737373' }} axisLine={false} tickLine={false} />
                                    <Tooltip 
                                        cursor={{ fill: '#262626' }} 
                                        contentStyle={{ backgroundColor: '#171717', border: '1px solid #262626', color: '#fff' }} 
                                        itemStyle={{ color: '#fff' }}
                                        isAnimationActive={false}
                                        labelStyle={{ display: 'none' }}
                                        formatter={(value, name, props) => [value, props.payload.name]}
                                    />
                                    <Bar dataKey="value" radius={[2, 2, 2, 2]} isAnimationActive={false} barSize={32} background={{ fill: '#171717' }}>
                                        {dataLidos.map((entry, index) => <Cell key={index} fill={resolveColor(entry, index)} />)}
                                    </Bar>
                                </BarChart>
                            )}
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="relative flex flex-col" style={{ height: getDynamicHeight(dataNaoLidos) }}>
                    <div className="hidden md:block absolute left-0 top-4 bottom-4 w-px bg-neutral-800"></div>

                    <p className="text-sm font-medium text-neutral-500 mb-4 flex justify-between uppercase tracking-widest pl-0 md:pl-6 flex-shrink-0">
                        <span>Não Lidos</span>
                        <span className="text-neutral-300">{dataNaoLidos.reduce((a, b) => a + b.value, 0)}</span>
                    </p>
                    <div className="flex-1 min-h-0 w-full pl-0 md:pl-6">
                        <ResponsiveContainer width="100%" height="100%">
                            {chartType === 'pie' ? (
                                <PieChart>
                                    <Pie
                                        data={dataNaoLidos}
                                        cx="50%" cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        fill="#333"
                                        paddingAngle={2}
                                        dataKey="value"
                                        isAnimationActive={false}
                                        stroke="none"
                                    >
                                        {dataNaoLidos.map((entry, index) => <Cell key={`cell-${index}`} fill={resolveColor(entry, index)} />)}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#171717', border: '1px solid #262626', borderRadius: '0px', color: '#fff' }}
                                        itemStyle={{ color: '#d4d4d4' }}
                                        isAnimationActive={false}
                                    />
                                    <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', color: '#999' }} />
                                </PieChart>
                            ) : (
                                <BarChart data={dataNaoLidos} layout="vertical" margin={{ left: 20 }}>
                                    <XAxis type="number" hide />
                                    <YAxis dataKey="name" type="category" width={170} tick={{ fontSize: 11, fill: '#737373' }} axisLine={false} tickLine={false} />
                                    <Tooltip 
                                        cursor={{ fill: '#262626' }} 
                                        contentStyle={{ backgroundColor: '#171717', border: '1px solid #262626', color: '#fff' }} 
                                        itemStyle={{ color: '#fff' }}
                                        isAnimationActive={false}
                                        labelStyle={{ display: 'none' }}
                                        formatter={(value, name, props) => [value, props.payload.name]}
                                    />
                                    <Bar dataKey="value" radius={[2, 2, 2, 2]} isAnimationActive={false} barSize={32} background={{ fill: '#171717' }}>
                                        {dataNaoLidos.map((entry, index) => <Cell key={index} fill={resolveColor(entry, index)} />)}
                                    </Bar>
                                </BarChart>
                            )}
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    )
}
