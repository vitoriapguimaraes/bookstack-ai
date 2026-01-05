import React, { useMemo } from 'react'
import { ResponsiveContainer, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts'
import { CustomTimelineLegend } from './CustomTimelineLegend'
import { getClassBaseHSL, hslToString, COLORS } from './analyticsUtils'

export function TimelineChart({ stats, timelineType, timelinePeriod }) {
    // Config for Category grouping and coloring
    const categoryConfig = useMemo(() => {
        if (timelineType !== 'category') return null

        // 1. Get all categories and their totals (from dist)
        const allCats = [...stats.dist.lidos.category].sort((a, b) => b.value - a.value)

        // REMOVED SLICE TO INCLUDE ALL CATEGORIES AS REQUESTED
        // const topCats = allCats.slice(0, 10) 
        const topCats = allCats

        // 3. Group by Class
        const grouped = {}
        topCats.forEach(cat => {
            const cls = stats.meta.categoryToClass[cat.name] || 'Outros'
            if (!grouped[cls]) grouped[cls] = []
            grouped[cls].push(cat)
        })

        // 4. Flatten back to list, but sorted by class
        const sortedClasses = Object.keys(grouped).sort()

        let sortedKeys = []
        const colorMap = {}

        sortedClasses.forEach(cls => {
            const catsInClass = grouped[cls]
            // Calculate color variations for this class
            const baseHSL = getClassBaseHSL(cls)

            catsInClass.forEach((cat, idx) => {
                sortedKeys.push(cat.name)

                // Vary Lightness
                const lightnessStep = 7
                const offset = (idx - (catsInClass.length - 1) / 2) * lightnessStep
                const newL = Math.max(20, Math.min(90, baseHSL.l + offset))

                colorMap[cat.name] = hslToString({ ...baseHSL, l: newL })
            })
        })

        return { keys: sortedKeys, colorMap }
    }, [stats, timelineType])


    let keys = []
    let legendItems = []

    if (timelineType === 'total') {
        keys = ['total']
    } else if (timelineType === 'type') {
        keys = ['Técnico', 'Não Técnico']
        legendItems = [
            { label: 'Técnico', color: '#06b6d4', value: stats.dist.lidos.type.find(x => x.name === 'Técnico')?.value || 0 },
            { label: 'Não Técnico', color: '#f43f5e', value: stats.dist.lidos.type.find(x => x.name === 'Não Técnico')?.value || 0 }
        ]
    } else if (timelineType === 'class') {
        keys = stats.timelineMeta.classes
        legendItems = stats.dist.lidos.class.map((c) => ({
            label: c.name,
            color: hslToString(getClassBaseHSL(c.name)),
            value: c.value
        }))
    } else if (timelineType === 'category') {
        if (categoryConfig) {
            keys = categoryConfig.keys
            legendItems = keys.map(k => ({
                label: k,
                color: categoryConfig.colorMap[k],
                value: stats.dist.lidos.category.find(c => c.name === k)?.value || 0
            }))
        }
    }

    const getColor = (key, index) => {
        if (timelineType === 'total') return '#8b5cf6'
        if (timelineType === 'type') return key === 'Técnico' ? '#06b6d4' : '#f43f5e'
        if (timelineType === 'class') return hslToString(getClassBaseHSL(key))
        if (timelineType === 'category') return categoryConfig?.colorMap[key] || COLORS[index % COLORS.length]
        return COLORS[index % COLORS.length]
    }

    const currentData = stats.timeline[timelinePeriod]
    const isYearly = timelinePeriod === 'yearly'

    return (
        <div className="flex flex-col md:flex-row w-full h-full">
            <div className="flex-1 min-w-0">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={currentData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#262626" />
                        <XAxis
                            dataKey="date"
                            tick={{
                                fontSize: 12,
                                fill: '#737373',
                                angle: isYearly ? 0 : -35,
                                textAnchor: isYearly ? 'middle' : 'end'
                            }}
                            axisLine={false}
                            tickLine={false}
                            height={isYearly ? 30 : 60}
                            dy={10}
                            dx={isYearly ? 0 : -5}
                            tickFormatter={(val) => {
                                if (isYearly) return val
                                const [y, m] = val.split('-')
                                return `${y}/${m}`
                            }}
                        />
                        <YAxis tick={{ fontSize: 12, fill: '#737373' }} axisLine={false} tickLine={false} />
                        <Tooltip
                            contentStyle={{ backgroundColor: '#171717', border: '1px solid #262626', color: '#fff' }}
                            cursor={{ fill: '#262626' }}
                            itemStyle={{ color: '#d4d4d4' }}
                            labelFormatter={(label) => {
                                if (isYearly) return label
                                const [y, m] = label.split('-')
                                return `${m}/${y}`
                            }}
                            isAnimationActive={false}
                        />
                        {keys.map((key, index) => (
                            <Bar
                                key={key}
                                dataKey={key}
                                stackId="a"
                                fill={getColor(key, index)}
                                isAnimationActive={false}
                                barSize={isYearly ? 60 : 32}
                                radius={[0, 0, 0, 0]}
                            />
                        ))}
                    </BarChart>
                </ResponsiveContainer>
            </div>

            {timelineType !== 'total' && (
                <div className="w-full md:w-56 flex-shrink-0 pt-4 md:pt-0 md:border-l border-neutral-800">
                    <CustomTimelineLegend items={legendItems} />
                </div>
            )}
        </div>
    )
}
