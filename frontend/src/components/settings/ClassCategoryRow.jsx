import { getClassBaseHSL, hslToString } from '../../components/Analytics/analyticsUtils'

export default function ClassCategoryRow({ cls, cats }) {
    const baseHSL = getClassBaseHSL(cls)
    const classColor = hslToString(baseHSL)

    return (
        <div className="border border-slate-200 dark:border-neutral-800 rounded-lg p-3 bg-white dark:bg-neutral-900 flex flex-col md:flex-row md:items-center gap-4">
            {/* Class Column */}
            <div className="w-full md:w-64 flex-shrink-0 flex items-center gap-2">
                <span 
                    className="w-3 h-3 rounded-full shadow-sm" 
                    style={{ backgroundColor: classColor }}
                ></span>
                <h3 className="font-semibold text-sm text-slate-800 dark:text-white">
                    {cls}
                </h3>
            </div>

            {/* Categories Column */}
            <div className="flex-1 flex flex-wrap gap-2">
                {cats.map((cat, idx) => {
                    // Generate category variation light
                    // Spread lightness around the base lightness
                    // If cats.length is 1, offset is 0.
                    // If cats.length is many, we spread from -(L/2) to +(L/2)
                    const lightnessStep = 6
                    const offset = (idx - (cats.length - 1) / 2) * lightnessStep
                    
                    // Adjust lightness for background (lighter)
                    // We want distinct badges, so we keep high lightness but vary hue slightly or just lightness?
                    // User said "tonal variations".
                    
                    const bgL = Math.max(92, Math.min(99, 96 + (offset/4))) 
                    const catBg = hslToString({ ...baseHSL, l: bgL, s: 70 }) // High lightness background
                    
                    // Text/Border color: Darker version of base
                    // We also vary this slightly to match the tonal shift vibe
                    const textL = Math.max(25, Math.min(45, baseHSL.l - 40))
                    const catText = hslToString({ ...baseHSL, l: textL, s: 50 })
                    
                    return (
                        <span 
                            key={cat} 
                            className="text-[11px] px-2 py-0.5 rounded-full border font-medium transition-colors hover:opacity-100"
                            style={{ 
                                backgroundColor: catBg,
                                color: catText,
                                borderColor: `${catText}30` // 30 hex opacity
                            }}
                        >
                            {cat}
                        </span>
                    )
                })}
            </div>
        </div>
    )
}
