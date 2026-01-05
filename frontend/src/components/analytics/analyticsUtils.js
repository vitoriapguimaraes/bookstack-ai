export const getClassBaseHSL = (cls) => {
    // Pastel Palette: Lower saturation, Higher lightness (for light mode friendly / soft dark mode)
    const map = {
        'Desenvolvimento Pessoal': { h: 189, s: 70, l: 75 }, // Soft Cyan
        'Literatura & Cultura': { h: 265, s: 70, l: 80 },    // Soft Violet
        'Tecnologia & IA': { h: 150, s: 60, l: 70 },         // Soft Emerald
        'Negócios & Finanças': { h: 45, s: 80, l: 75 },      // Soft Amber
        'Produtividade': { h: 340, s: 80, l: 80 },           // Soft Rose
        'Espiritualidade': { h: 240, s: 70, l: 80 },         // Soft Indigo
        'Biografias': { h: 320, s: 70, l: 75 },              // Soft Pink
    }
    return map[cls] || { h: 0, s: 0, l: 80 } // Soft Gray
}

export const hslToString = ({ h, s, l }) => `hsl(${h}, ${s}%, ${l}%)`

// Pastel Minimalist Palette (matching tailwind config)
export const COLORS = [
    '#d8b4fe', // pastel-purple
    '#86efac', // pastel-green
    '#93c5fd', // pastel-blue
    '#fca5a5', // pastel-pink
    '#fde047', // pastel-yellow
    '#fdba74', // pastel-orange
    '#f87171', // pastel-red
    '#c4b5fd', // pastel-violet-light
]
