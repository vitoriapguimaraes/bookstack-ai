import { useState, useEffect } from 'react'
import { Save, Key, MessageSquare, AlertCircle } from 'lucide-react'
import { api } from '../../services/api'
import { useToast } from '../../context/ToastContext'

const DEFAULT_SYSTEM_PROMPT = "Você é um assistente literário especializado que conhece profundamente o perfil da leitora."
const DEFAULT_USER_PROMPT = `PERFIL DA LEITORA:
Vitória é uma mulher de 30 anos e profissional de tecnologia (Cientista de Dados e Desenvolvedora) com raízes na Engenharia Ambiental. Seu estilo de leitura é marcado pela busca de equilíbrio entre a densidade técnica e a sensibilidade humana. Ela não lê apenas para aprender uma sintaxe, mas para entender como a tecnologia e o comportamento humano se moldam.

PROCESSO DE RACIOCÍNIO OBRIGATÓRIO:
1. Primeiro, defina a "book_class" (Classe Macro) adequada.
2. Depois, consulte a lista de categorias APENAS dessa classe específica.
3. Escolha a "category" (Subcategoria) a partir dessa lista restrita.

1. "book_class" (string): Escolha UMA das classes abaixo.
   - Tecnologia & IA
   - Desenvolvimento Pessoal
   - Negócios & Finanças
   - Conhecimento & Ciências
   - Literatura & Cultura
   - Engenharia & Arquitetura

2. "category" (string): Escolha UMA categoria específica válida para a classe.

3. "type" (string): "Técnico" ou "Não Técnico"

4. "motivation" (string): Uma frase reflexiva e autêntica (2-3 linhas) que explique por que este livro faz sentido para Vitória AGORA.
   - Conecte tecnologia com humanidade
   - Reconheça sua maturidade e experiência

5. "original_title" (string): O título original do livro.`

export default function AISettings() {
    const { addToast } = useToast()
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    
    // Form State
    const [openaiKey, setOpenaiKey] = useState('')
    const [geminiKey, setGeminiKey] = useState('')
    const [groqKey, setGroqKey] = useState('')
    const [systemPrompt, setSystemPrompt] = useState(DEFAULT_SYSTEM_PROMPT)
    const [userPrompt, setUserPrompt] = useState(DEFAULT_USER_PROMPT)

    useEffect(() => {
        fetchPreferences()
    }, [])

    const fetchPreferences = async () => {
        try {
            const res = await api.get('/preferences/')
            const data = res.data
            
            if (data) {
                setOpenaiKey(data.openai_key || '')
                setGeminiKey(data.gemini_key || '')
                setGroqKey(data.groq_key || '')
                
                // Load Custom Prompts or defaults
                if (data.custom_prompts) {
                    setSystemPrompt(data.custom_prompts.system_prompt || DEFAULT_SYSTEM_PROMPT)
                    setUserPrompt(data.custom_prompts.user_prompt || DEFAULT_USER_PROMPT)
                }
            }
        } catch (err) {
            console.error("Erro ao carregar preferências de IA:", err)
        } finally {
            setLoading(false)
        }
    }

    const handleSave = async () => {
        setSaving(true)
        try {
            const payload = {
                openai_key: openaiKey,
                gemini_key: geminiKey,
                groq_key: groqKey,
                custom_prompts: {
                    system_prompt: systemPrompt,
                    user_prompt: userPrompt
                }
            }
            
            await api.put('/preferences/', payload)
            addToast({ type: 'success', message: 'Configurações de IA salvas com sucesso!' })
        } catch (err) {
            console.error("Erro ao salvar:", err)
            addToast({ type: 'error', message: 'Erro ao salvar. Tente novamente.' })
        } finally {
            setSaving(false)
        }
    }

    if (loading) return <div className="p-8 text-center text-slate-500 animate-pulse">Carregando configurações de IA...</div>

    return (
        <div className="w-full animate-fade-in space-y-6 pb-20">
            <div className="hidden md:block">
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white">IA & Inteligência</h2>
                <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                    Configure suas chaves de API e personalize os prompts utilizados pelo sistema.
                </p>
            </div>

            {/* API Keys Card */}
            <div className="bg-white dark:bg-neutral-900 rounded-lg border border-slate-200 dark:border-neutral-800 p-6">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                        <Key className="text-purple-600 dark:text-purple-400" size={20} />
                    </div>
                    <div>
                        <h3 className="text-base md:text-lg font-semibold text-slate-800 dark:text-white leading-tight">
                            Chaves de API
                        </h3>
                        <p className="text-sm text-slate-500 dark:text-neutral-400">
                            Conecte seus provedores favoritos (Gemini, OpenAI, Groq)
                        </p>
                    </div>
                </div>

                <div className="grid gap-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Google Gemini API Key
                        </label>
                        <input 
                            type="password" 
                            value={geminiKey}
                            onChange={e => setGeminiKey(e.target.value)}
                            placeholder="AIzaSy..."
                            className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-neutral-700 bg-slate-50 dark:bg-neutral-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-purple-500 focus:outline-none transition-all font-mono text-sm"
                        />
                         <p className="text-xs text-slate-400 mt-1">Recomendado (Modelos Flash gratuitos)</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Groq Cloud API Key
                        </label>
                        <input 
                            type="password" 
                            value={groqKey}
                            onChange={e => setGroqKey(e.target.value)}
                            placeholder="gsk_..."
                            className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-neutral-700 bg-slate-50 dark:bg-neutral-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-purple-500 focus:outline-none transition-all font-mono text-sm"
                        />
                         <p className="text-xs text-slate-400 mt-1">Ótimo para Llama 3 e Mixtral (Ultra-rápido)</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            OpenAI API Key
                        </label>
                        <input 
                            type="password" 
                            value={openaiKey}
                            onChange={e => setOpenaiKey(e.target.value)}
                            placeholder="sk-..."
                            className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-neutral-700 bg-slate-50 dark:bg-neutral-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-purple-500 focus:outline-none transition-all font-mono text-sm"
                        />
                    </div>
                </div>
            </div>

            {/* Prompts Card */}
            <div className="bg-white dark:bg-neutral-900 rounded-lg border border-slate-200 dark:border-neutral-800 p-6">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <MessageSquare className="text-blue-600 dark:text-blue-400" size={20} />
                    </div>
                    <div>
                        <h3 className="text-base md:text-lg font-semibold text-slate-800 dark:text-white leading-tight">
                            Prompts Personalizados
                        </h3>
                        <p className="text-sm text-slate-500 dark:text-neutral-400">
                            Ajuste como a IA deve analisar seus livros.
                        </p>
                    </div>
                </div>

                <div className="space-y-6">
                    {/* System Prompt */}
                    <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                            System Prompt (Persona)
                        </label>
                        <textarea 
                            value={systemPrompt}
                            onChange={e => setSystemPrompt(e.target.value)}
                            rows={3}
                            className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-neutral-700 bg-slate-50 dark:bg-neutral-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all font-mono text-xs leading-relaxed"
                        />
                    </div>

                    {/* User Prompt */}
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">
                                User Prompt Template
                            </label>
                            <span className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-2 py-1 rounded border border-amber-200 dark:border-amber-800">
                                ⚠️ Cuidado ao editar a estrutura JSON/Lista
                            </span>
                        </div>
                        <textarea 
                            value={userPrompt}
                            onChange={e => setUserPrompt(e.target.value)}
                            rows={12}
                            className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-neutral-700 bg-slate-50 dark:bg-neutral-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all font-mono text-xs leading-relaxed"
                        />
                        <p className="text-xs text-slate-400 mt-2">
                            Este é o texto que será enviado junto com o título do livro. Mantenha as instruções de formatação claras.
                        </p>
                    </div>
                </div>
            </div>

            {/* Save Button */}
            <div className="sticky bottom-6 flex justify-end">
                <button 
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-lg shadow-purple-500/30 transition-all transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Save size={20} />
                    {saving ? 'Salvando...' : 'Salvar Alterações'}
                </button>
            </div>
        </div>
    )
}
