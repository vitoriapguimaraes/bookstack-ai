import { useState, useEffect } from "react";
import { Save, Key, MessageSquare, AlertCircle, Trash2 } from "lucide-react";
import { api } from "../../services/api";
import { useToast } from "../../context/ToastContext";

const DEFAULT_SYSTEM_PROMPT =
  "Você é um assistente literário especializado que auxilia na organização e enriquecimento de uma biblioteca pessoal.";
const DEFAULT_USER_PROMPT = `PERFIL DO USUÁRIO:
[NOME/PERSONA]: [Idade, profissão e principais áreas de interesse]
[OBJETIVO DE LEITURA]: [O que você busca ao ler um livro? Ex: Rigor técnico, lazer, expansão de repertório, etc.]
[LENTE DE MUNDO]: [Quais valores ou perspectivas você aplica ao analisar um tema? Ex: Inclusividade, ética, pragmatismo, etc.]

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

4. "motivation" (string): Uma frase reflexiva e autêntica (2-3 linhas) que explique por que este livro faz sentido para o usuário AGORA.
   - Conecte o tema do livro com seus objetivos de leitura.
   - Reflita sua lente de mundo na análise.

5. "original_title" (string): O título original do livro.`;

export default function AISettings() {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form State
  const [openaiKey, setOpenaiKey] = useState("");
  const [geminiKey, setGeminiKey] = useState("");
  const [groqKey, setGroqKey] = useState("");
  const [preferredProvider, setPreferredProvider] = useState("groq");
  const [systemPrompt, setSystemPrompt] = useState(DEFAULT_SYSTEM_PROMPT);
  const [userPrompt, setUserPrompt] = useState(DEFAULT_USER_PROMPT);

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    try {
      const res = await api.get("/preferences/");
      const data = res.data;

      if (data) {
        setOpenaiKey(data.openai_key || "");
        setGeminiKey(data.gemini_key || "");
        setGeminiKey(data.gemini_key || "");
        setGroqKey(data.groq_key || "");
        setPreferredProvider(data.preferred_provider || "groq");

        // Load Custom Prompts or defaults
        if (data.custom_prompts) {
          setSystemPrompt(
            data.custom_prompts.system_prompt || DEFAULT_SYSTEM_PROMPT,
          );
          setUserPrompt(data.custom_prompts.user_prompt || DEFAULT_USER_PROMPT);
        }
      }
    } catch (err) {
      console.error("Erro ao carregar preferências de IA:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        openai_key: openaiKey,
        gemini_key: geminiKey,
        groq_key: groqKey,
        preferred_provider: preferredProvider,
        custom_prompts: {
          system_prompt: systemPrompt,
          user_prompt: userPrompt,
        },
      };

      await api.put("/preferences/", payload);
      addToast({
        type: "success",
        message: "Configurações de IA salvas com sucesso!",
      });
    } catch (err) {
      console.error("Erro ao salvar:", err);
      addToast({ type: "error", message: "Erro ao salvar. Tente novamente." });
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return (
      <div className="p-8 text-center text-slate-500 animate-pulse">
        Carregando configurações de IA...
      </div>
    );

  return (
    <div className="w-full animate-fade-in space-y-6 pb-20">
      <div className="hidden md:block">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">
          IA & Inteligência
        </h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
          Configure suas chaves de API e personalize os prompts utilizados pelo
          sistema.
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
              Conecte seus provedores para automação inteligente
            </p>
          </div>
        </div>

        <div className="mb-6 bg-purple-50/50 dark:bg-purple-900/10 border border-purple-100 dark:border-purple-800/30 rounded-xl p-4 flex gap-3 items-start">
          <AlertCircle
            size={18}
            className="text-purple-600 dark:text-purple-400 shrink-0 mt-0.5"
          />
          <div className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            <p className="font-bold text-purple-700 dark:text-purple-300 mb-1">
              Por que configurar uma API?
            </p>
            Os modelos de LLM são usados para completar automaticamente a{" "}
            <strong>classe</strong>, <strong>categoria</strong> e sugerir a{" "}
            <strong>motivação de leitura</strong> baseada no seu perfil. Este
            recurso é opcional, mas garante uma experiência muito mais fluida.
            <p className="mt-2 text-[10px] opacity-80 italic">
              🔒 Suas chaves são armazenadas com criptografia de ponta a ponta
              no servidor.
            </p>
          </div>
        </div>

        <div className="grid gap-6">
          <div>
            <label
              className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2"
              htmlFor="gemini_key"
            >
              Google Gemini API Key
            </label>
            <div className="relative">
              <input
                id="gemini_key"
                type="password"
                value={geminiKey}
                onChange={(e) => setGeminiKey(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full pl-4 pr-10 py-2 rounded-lg border border-slate-200 dark:border-neutral-700 bg-slate-50 dark:bg-neutral-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-purple-500 focus:outline-none transition-all font-mono text-sm"
              />
              {geminiKey && (
                <button
                  onClick={() => setGeminiKey("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-red-500 dark:text-slate-500 dark:hover:text-red-400 transition-colors rounded-md hover:bg-slate-100 dark:hover:bg-neutral-700"
                  title="Limpar chave"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Recomendado (Modelos Flash gratuitos)
            </p>
          </div>

          <div>
            <label
              className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2"
              htmlFor="groq_key"
            >
              Groq Cloud API Key
            </label>
            <div className="relative">
              <input
                id="groq_key"
                type="password"
                value={groqKey}
                onChange={(e) => setGroqKey(e.target.value)}
                placeholder="gsk_..."
                className="w-full pl-4 pr-10 py-2 rounded-lg border border-slate-200 dark:border-neutral-700 bg-slate-50 dark:bg-neutral-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-purple-500 focus:outline-none transition-all font-mono text-sm"
              />
              {groqKey && (
                <button
                  onClick={() => setGroqKey("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-red-500 dark:text-slate-500 dark:hover:text-red-400 transition-colors rounded-md hover:bg-slate-100 dark:hover:bg-neutral-700"
                  title="Limpar chave"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Ótimo para Llama 3 e Mixtral (Ultra-rápido)
            </p>
          </div>

          <div>
            <label
              className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2"
              htmlFor="openai_key"
            >
              OpenAI API Key
            </label>
            <div className="relative">
              <input
                id="openai_key"
                type="password"
                value={openaiKey}
                onChange={(e) => setOpenaiKey(e.target.value)}
                placeholder="sk-..."
                className="w-full pl-4 pr-10 py-2 rounded-lg border border-slate-200 dark:border-neutral-700 bg-slate-50 dark:bg-neutral-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-purple-500 focus:outline-none transition-all font-mono text-sm"
              />
              {openaiKey && (
                <button
                  onClick={() => setOpenaiKey("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-red-500 dark:text-slate-500 dark:hover:text-red-400 transition-colors rounded-md hover:bg-slate-100 dark:hover:bg-neutral-700"
                  title="Limpar chave"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Preferred Provider Card */}
      <div className="bg-white dark:bg-neutral-900 rounded-lg border border-slate-200 dark:border-neutral-800 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
            <MessageSquare
              className="text-emerald-600 dark:text-emerald-400"
              size={20}
            />
          </div>
          <div>
            <h3 className="text-base md:text-lg font-semibold text-slate-800 dark:text-white leading-tight">
              Provedor Principal
            </h3>
            <p className="text-sm text-slate-500 dark:text-neutral-400">
              Qual IA deve ser usada por padrão para metadados?
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { id: "groq", label: "Groq (Llama 3)", desc: "Mais rápido" },
            {
              id: "openai",
              label: "OpenAI (GPT-4o)",
              desc: "Mais inteligente",
            },
            { id: "gemini", label: "Google Gemini", desc: "Equilibrado" },
          ].map((provider) => (
            <div
              key={provider.id}
              onClick={() => setPreferredProvider(provider.id)}
              className={`cursor-pointer border rounded-xl p-4 transition-all flex items-center justify-between ${
                preferredProvider === provider.id
                  ? "bg-emerald-50 dark:bg-emerald-900/10 border-emerald-500 ring-1 ring-emerald-500"
                  : "bg-slate-50 dark:bg-neutral-800 border-slate-200 dark:border-neutral-700 hover:border-emerald-300"
              }`}
            >
              <div>
                <div className="font-bold text-slate-800 dark:text-white text-sm">
                  {provider.label}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {provider.desc}
                </div>
              </div>
              <div
                className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                  preferredProvider === provider.id
                    ? "border-emerald-500 bg-emerald-500"
                    : "border-slate-300 dark:border-neutral-600"
                }`}
              >
                {preferredProvider === provider.id && (
                  <div className="w-1.5 h-1.5 bg-white rounded-full" />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Prompts Card */}
      <div className="bg-white dark:bg-neutral-900 rounded-lg border border-slate-200 dark:border-neutral-800 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <MessageSquare
              className="text-blue-600 dark:text-blue-400"
              size={20}
            />
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

        <div className="mb-6 bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800/30 rounded-xl p-4 flex gap-3 items-start">
          <AlertCircle
            size={18}
            className="text-blue-600 dark:text-blue-400 shrink-0 mt-0.5"
          />
          <div className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            <p className="font-bold text-blue-700 dark:text-blue-300 mb-1">
              Personalização do Cérebro
            </p>
            Aqui você define a "persona" da IA e as regras de classificação.
            Alterar estes prompts muda a forma como o sistema sugere dados para
            novos livros.
            <p className="mt-2 text-[10px] opacity-80 italic">
              🔒 Suas instruções personalizadas são protegidas e de uso
              exclusivo da sua conta.
            </p>
          </div>
        </div>

        <div className="space-y-6">
          {/* System Prompt */}
          <div>
            <label
              className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2"
              htmlFor="system_prompt"
            >
              System Prompt (Persona)
            </label>
            <textarea
              id="system_prompt"
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-neutral-700 bg-slate-50 dark:bg-neutral-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all font-mono text-xs leading-relaxed"
            />
          </div>

          {/* User Prompt */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label
                className="block text-sm font-bold text-slate-700 dark:text-slate-300"
                htmlFor="user_prompt"
              >
                User Prompt Template
              </label>
              <span className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-2 py-1 rounded border border-amber-200 dark:border-amber-800">
                ⚠️ Cuidado ao editar a estrutura JSON/Lista
              </span>
            </div>
            <textarea
              id="user_prompt"
              value={userPrompt}
              onChange={(e) => setUserPrompt(e.target.value)}
              rows={12}
              className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-neutral-700 bg-slate-50 dark:bg-neutral-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all font-mono text-xs leading-relaxed"
            />
            <p className="text-xs text-slate-400 mt-2">
              Este é o texto que será enviado junto com o título do livro.
              Mantenha as instruções de formatação claras.
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
          {saving ? "Salvando..." : "Salvar Alterações"}
        </button>
      </div>
    </div>
  );
}
