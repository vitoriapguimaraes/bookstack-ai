import { Info } from 'lucide-react'

export default function AISettings() {
    return (
        <div className="space-y-6 animate-fade-in">
            <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-700/30 p-4 rounded-lg flex gap-3">
               <Info className="text-amber-600 dark:text-amber-500 flex-shrink-0" size={20} />
               <p className="text-sm text-amber-800 dark:text-amber-200">
                  Estes são os prompts exatos enviados para o modelo (Gemini/OpenAI/Groq) para classificar cada livro.
                  Qualquer alteração aqui deve ser refeita no backend.
               </p>
            </div>

            <div className="grid gap-6">
                <PromptCard 
                    title="System Prompt" 
                    description="Define a persona e o contexto geral da IA."
                    content='Você é um assistente literário especializado que conhece profundamente o perfil da leitora.'
                />

                <PromptCard 
                    title="User Prompt" 
                    description="Estrutura enviada com os dados do livro para análise."
                    content={`PERFIL DA LEITORA:
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

5. "original_title" (string): O título original do livro.`}
                />
            </div>
        </div>
    )
}

function PromptCard({ title, description, content }) {
    return (
        <div className="border border-slate-200 dark:border-neutral-800 rounded-xl overflow-hidden bg-white dark:bg-neutral-900 shadow-sm">
            <div className="bg-slate-50 dark:bg-neutral-800/50 p-4 border-b border-slate-200 dark:border-neutral-800">
                <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    {title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{description}</p>
            </div>
            <div className="p-0">
                <pre className="bg-slate-900 text-slate-300 p-4 text-xs font-mono overflow-x-auto whitespace-pre-wrap">
                    {content}
                </pre>
            </div>
        </div>
    )
}
