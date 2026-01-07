export const getClassBaseHSL = (cls) => {
  // Pastel Palette: Lower saturation, Higher lightness (for light mode friendly / soft dark mode)
  const map = {
    "Desenvolvimento Pessoal": { h: 185, s: 75, l: 75 }, // Cyan
    "Literatura & Cultura": { h: 270, s: 70, l: 80 }, // Violet
    "Tecnologia & IA": { h: 145, s: 65, l: 70 }, // Green
    "Negócios & Finanças": { h: 45, s: 85, l: 75 }, // Amber
    "Engenharia & Arquitetura": { h: 220, s: 70, l: 80 }, // Blue
    "Conhecimento & Ciências": { h: 340, s: 80, l: 80 }, // Pink/Rose (Distinct from others)
    Produtividade: { h: 15, s: 80, l: 80 }, // Coral/Red
    Espiritualidade: { h: 245, s: 70, l: 80 }, // Indigo
    Biografias: { h: 320, s: 70, l: 75 }, // Soft Magenta
  };

  if (map[cls]) return map[cls];

  // Fallback: Generate a consistent hue based on the class name
  let hash = 0;
  for (let i = 0; i < cls.length; i++) {
    hash = cls.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = Math.abs(hash % 360);
  return { h, s: 65, l: 75 }; // Soft pastel default
};

export const hslToString = ({ h, s, l }) => `hsl(${h}, ${s}%, ${l}%)`;

// Pastel Minimalist Palette (matching tailwind config)
export const COLORS = [
  "#d8b4fe", // pastel-purple
  "#86efac", // pastel-green
  "#93c5fd", // pastel-blue
  "#fca5a5", // pastel-pink
  "#fde047", // pastel-yellow
  "#fdba74", // pastel-orange
  "#f87171", // pastel-red
  "#c4b5fd", // pastel-violet-light
];
