// Em produção (Vercel), usa VITE_API_URL do ambiente.
// Em desenvolvimento local, usa a mesma URL de produção — o CORS do backend
// precisa liberar localhost, ou rode o backend local com o proxy do Vite (/api → 8000).
export const API_URL =
  import.meta.env.VITE_API_URL || "https://bookstack-ai-api.vercel.app";