import React from "react";
import {
  Info,
  Key,
  Calculator,
  Shield,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  Database,
  Search,
  BookOpen,
} from "lucide-react";

export default function GuideSettings() {
  return (
    <div className="w-full animate-fade-in space-y-12 pb-20">
      {/* Header Area */}
      <div className="hidden md:flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            Guia do Usuário
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Entenda como configurar e tirar o melhor proveito da sua biblioteca
            inteligente.
          </p>
        </div>
      </div>

      {/* Main Steps Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Step 1: Inteligência & IA */}
        <section className="bg-white dark:bg-neutral-900 rounded-[2.5rem] border border-slate-200 dark:border-neutral-800 p-8 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-purple-50 dark:bg-purple-900/20 rounded-2xl flex items-center justify-center text-purple-600 dark:text-purple-400">
              <Sparkles size={24} />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-purple-500">
                Configuração Inicial
              </span>
              <h3 className="text-xl font-bold text-slate-800 dark:text-white">
                Inteligência Artificial
              </h3>
            </div>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
            O cérebro do sistema utiliza LLMs (Gemini, OpenAI ou Groq) para
            automatizar o preenchimento de campos. Ao adicionar um livro apenas
            pelo título, a IA sugere a categoria técnica, o título original e
            uma motivação reflexiva baseada no seu perfil.
          </p>
          <ul className="space-y-3">
            <li className="flex gap-3 text-xs text-slate-500 dark:text-slate-400">
              <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
              <span>Chaves de API são armazenadas com criptografia.</span>
            </li>
            <li className="flex gap-3 text-xs text-slate-500 dark:text-slate-400">
              <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
              <span>
                Você pode personalizar os "Prompts" para mudar o tom da IA.
              </span>
            </li>
          </ul>
        </section>

        {/* Step 2: Fórmula de Score */}
        <section className="bg-white dark:bg-neutral-900 rounded-[2.5rem] border border-slate-200 dark:border-neutral-800 p-8 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-amber-50 dark:bg-amber-900/20 rounded-2xl flex items-center justify-center text-amber-600 dark:text-amber-400">
              <Calculator size={24} />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-amber-500">
                Priorização
              </span>
              <h3 className="text-xl font-bold text-slate-800 dark:text-white">
                Fórmula de Prioridade
              </h3>
            </div>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
            O sistema calcula um Score para cada livro. Os pesos são fluidos: se
            você mudar a importância de "Livros Técnicos" nas configurações, o
            Score de todos os livros no banco de dados é recalculado
            instantaneamente.
          </p>
          <div className="bg-slate-50 dark:bg-neutral-800/50 rounded-2xl p-4 border border-slate-100 dark:border-neutral-800">
            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase mb-2">
              <Database size={12} /> Fatores que compõem o Score:
            </div>
            <div className="flex flex-wrap gap-2">
              {["Tipo", "Onde está", "Prioridade Manual", "Ano", "Classe"].map(
                (f) => (
                  <span
                    key={f}
                    className="px-2 py-1 bg-white dark:bg-neutral-800 rounded-lg text-[10px] font-bold border border-slate-200 dark:border-neutral-700 shadow-sm text-slate-600 dark:text-slate-300"
                  >
                    {f}
                  </span>
                )
              )}
            </div>
          </div>
        </section>

        {/* Step 3: Auditoria de Dados */}
        <section className="bg-white dark:bg-neutral-900 rounded-[2.5rem] border border-slate-200 dark:border-neutral-800 p-8 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-rose-50 dark:bg-rose-900/20 rounded-2xl flex items-center justify-center text-rose-600 dark:text-rose-400">
              <Shield size={24} />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-rose-500">
                Manutenção
              </span>
              <h3 className="text-xl font-bold text-slate-800 dark:text-white">
                Auditoria & Saúde
              </h3>
            </div>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            Ao importar dados de outras fontes ou mudar suas classes/categorias,
            alguns livros podem ficar "desalinhados". A Auditoria varre sua
            biblioteca e agrupa erros de classificação para que você possa
            corrigi-los em massa.
          </p>
        </section>

        {/* Step 4: Fluxo de Trabalho */}
        <section className="bg-white dark:bg-neutral-900 rounded-[2.5rem] border border-slate-200 dark:border-neutral-800 p-8 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center text-blue-600 dark:text-blue-400">
              <BookOpen size={24} />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-blue-500">
                Uso Diário
              </span>
              <h3 className="text-xl font-bold text-slate-800 dark:text-white">
                Seu Mural Dinâmico
              </h3>
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-neutral-800 flex items-center justify-center text-[10px] font-bold shrink-0">
                1
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Adicione livros apenas pelo título e deixe a IA cuidar dos
                detalhes.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-neutral-800 flex items-center justify-center text-[10px] font-bold shrink-0">
                2
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Use o "Mural" para gerenciar o que você está lendo agora.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-neutral-800 flex items-center justify-center text-[10px] font-bold shrink-0">
                3
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Acompanhe seu progresso na página de Analytics.
              </p>
            </div>
          </div>
        </section>
      </div>

      {/* Quick Links Card */}
      <div className="bg-slate-900 rounded-[2rem] p-8 text-white relative overflow-hidden group">
        <div className="relative z-10">
          <h3 className="text-xl font-black mb-2">Pronta para começar?</h3>
          <p className="text-slate-400 text-sm mb-6 max-w-lg">
            Acesse as seções abaixo para configurar sua biblioteca agora mesmo.
          </p>
          <div className="flex flex-wrap gap-4">
            <a
              href="/settings/ai"
              className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 rounded-xl font-bold text-sm transition-all flex items-center gap-2"
            >
              Configurar APIs <ArrowRight size={16} />
            </a>
            <a
              href="/settings/lists"
              className="px-5 py-2.5 bg-neutral-800 hover:bg-neutral-700 rounded-xl font-bold text-sm transition-all flex items-center gap-2"
            >
              Gerenciar Listas <Search size={16} />
            </a>
          </div>
        </div>
        <div className="absolute -right-10 -bottom-10 text-white/5 transform rotate-12 transition-transform group-hover:scale-110">
          <BookOpen size={200} />
        </div>
      </div>
    </div>
  );
}
