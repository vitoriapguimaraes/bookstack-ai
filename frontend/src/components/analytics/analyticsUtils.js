export const getClassBaseHSL = (cls) => {
    const map = {
        'Desenvolvimento Pessoal': { h: 189, s: 94, l: 43 }, // Cyan
        'Literatura & Cultura': { h: 262, s: 83, l: 66 },    // Violet
        'Tecnologia & IA': { h: 158, s: 64, l: 52 },         // Emerald
        'Negócios & Finanças': { h: 45, s: 93, l: 47 },      // Amber
        'Produtividade': { h: 343, s: 87, l: 60 },           // Rose
        'Espiritualidade': { h: 243, s: 75, l: 59 },         // Indigo
        'Biografias': { h: 330, s: 81, l: 60 },              // Pink
    }
    return map[cls] || { h: 0, s: 0, l: 50 } // Gray
}

export const hslToString = ({ h, s, l }) => `hsl(${h}, ${s}%, ${l}%)`

// Minimalist Palette
export const COLORS = ['#06b6d4', '#8b5cf6', '#10b981', '#f43f5e', '#f59e0b', '#3b82f6', '#6366f1', '#ec4899']
