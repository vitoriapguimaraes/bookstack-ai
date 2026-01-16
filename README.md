# Sistema de Gerenciamento de Leitura (BookStack AI)

> Um sistema completo de gerenciamento de biblioteca pessoal com classificação hierárquica, sugestões inteligentes de IA e analytics avançados. Organize sua lista de leitura, acompanhe seu progresso, defina metas anuais e exporte showcases visuais da sua estante.

![Demonstração do sistema](https://github.com/vitoriapguimaraes/bookstack-ai/blob/main/frontend/public/demo/navigation.gif)

## Funcionalidades Principais

- **Gerenciamento Inteligente de Livros**: CRUD completo com sugestões automáticas de metadados via IA (Groq) e Google Books API.
- **Classificação Hierárquica**: Organização robusta em 6 classes e 47 categorias para melhor segmentação do conhecimento.
- **Showcase Exporter (Novo)**: Gere imagens compartilháveis da sua estante ("aesthetic") com contador de livros, resumo de filtros e layout otimizado para redes sociais.
- **Analytics Avançados**: Dashboard interativo com métricas de leitura, distribuição por classes e progresso de metas.
- **Configurações de Usuário (Novo)**: Defina e acompanhe metas anuais de leitura com persistência de preferências e filtros.
- **Sistema de Prioridade (Score)**: Algoritmo que calcula automaticamente a prioridade de leitura baseada em múltiplos fatores.
- **Fila de Leitura Dinâmica**: Organização automática de próximos livros baseada em status e prioridade.

## Tecnologias Utilizadas

- **Frontend**: React 18, Vite, Tailwind CSS, Lucide React, Axios, html2canvas.
- **Backend**: FastAPI, SQLModel (SQLite), Groq AI SDK.
- **Integrações**: Google Books API, Groq LLM.

## Como Executar

1. Clone o repositório:

   ```bash
   git clone https://github.com/vitoriapguimaraes/bookstack-ai.git
   cd bookstack-ai
   ```

2. Configure e execute o Backend:

   ```bash
   cd backend
   python -m venv venv
   # Windows: venv\Scripts\activate | Unix: source venv/bin/activate
   pip install -r requirements.txt
   # Opção 1: Via Script (Recomendado)
   python main.py

   # Opção 2: Via Uvicorn Direto
   uvicorn app.main:app --reload
   ```

3. Configure e execute o Frontend:

   ```bash
   cd frontend
   npm install
   npm run dev
   ```

4. Acesse o sistema em `http://localhost:5173`.

## Como Usar

- **Adicionar Livros**: Use a busca por IA para preencher dados automaticamente apenas pelo título.
- **Exportar Estante**: Na tela inicial, use o botão de "Compartilhar Estante" para gerar uma imagem personalizada do seu progresso atual.
- **Definir Metas**: Acesse "Configurações > Preferências" para definir quantos livros deseja ler no ano.
- **Analytics**: Acompanhe o gráfico de distribuição para garantir que você está diversificando suas lecturas entre as classes (Tecnologia, Negócios, etc).

## Estrutura de Diretórios

```bash
/bookstack-ai
├── backend/
│   ├── main.py              # API FastAPI
│   ├── models.py            # Modelos de Dados
│   └── database.py          # Configuração SQLite
├── frontend/
│   ├── src/
│   │   ├── components/      # UI Components (BookCard, ShowcaseExporter, etc)
│   │   ├── views/           # Page Views (Home, Analytics, Settings)
│   │   └── index.css        # Tailwind Global Styles
└── README.md
```

## Status

🚧 Em desenvolvimento

> Veja as [issues abertas](https://github.com/vitoriapguimaraes/bookstack-ai/issues) para sugestões de melhorias e próximos passos.

## Mais Sobre Mim

Acesse os arquivos disponíveis na [Pasta Documentos](https://github.com/vitoriapguimaraes/vitoriapguimaraes/tree/main/DOCUMENTOS) para mais informações sobre minhas qualificações e certificações.
