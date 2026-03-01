# Guia de Manutenção do Backend — bookstack-ai

## Mapa da Estrutura do Backend

```dash
backend/
├── main.py                  ← Ponto de entrada (só inicializa o uvicorn)
├── .env                     ← Variáveis de ambiente (NÃO versionar)
├── requirements.txt         ← Dependências Python
├── vercel.json              ← Config de deploy (Vercel)
├── database.db              ← Banco local SQLite (dev local)
└── app/
    ├── main.py              ← App FastAPI: CORS, routers, startup
    ├── api/
    │   ├── deps.py          ← Autenticação (get_current_user)
    │   └── v1/
    │       ├── api.py       ← Registra todos os routers/prefixes
    │       └── endpoints/   ← ← ← AQUI FICAM AS ROTAS DA API
    │           ├── auth.py        → /auth/register
    │           ├── books.py       → /books/* (CRUD + IA + import/export)
    │           ├── users.py       → /me, /users/sync, /admin/users/*
    │           ├── preferences.py → /preferences/ (chaves IA, fórmula, avatar)
    │           └── system.py      → /health, /proxy/image
    ├── core/
    │   ├── config.py        ← Variáveis de ambiente (settings)
    │   ├── database.py      ← Conexão SQLite/Postgres + criação de tabelas
    │   ├── security.py      ← Encrypt/decrypt de chaves de API
    │   └── storage.py       ← Upload de imagens (Supabase Storage)
    ├── models/
    │   ├── book.py          ← Tabela `book` (campos do livro)
    │   └── user.py          ← Tabelas `profiles` e `user_preferences`
    └── services/
        ├── ai.py            ← Chamadas para OpenAI/Gemini/Groq
        ├── book_enrichment.py ← Busca metadados de livros (IA + APIs externas)
        ├── metadata.py      ← Google Books API, Open Library
        └── scoring.py       ← Cálculo de score/prioridade dos livros
```

## Mapa de Rotas da API

| Endpoint                               | Arquivo                    | Descrição                           |
| -------------------------------------- | -------------------------- | ----------------------------------- |
| `POST /auth/register`                  | `endpoints/auth.py`        | Cadastro de usuário                 |
| `GET /books/`                          | `endpoints/books.py`       | Listar livros do usuário            |
| `POST /books/`                         | `endpoints/books.py`       | Criar livro (com enriquecimento IA) |
| `PUT /books/{id}`                      | `endpoints/books.py`       | Editar livro                        |
| `DELETE /books/{id}`                   | `endpoints/books.py`       | Deletar livro                       |
| `POST /books/suggest`                  | `endpoints/books.py`       | Sugerir metadados via IA            |
| `POST /books/{id}/cover`               | `endpoints/books.py`       | Upload de capa                      |
| `POST /books/import_csv`               | `endpoints/books.py`       | Importar livros via CSV             |
| `GET /books/export`                    | `endpoints/books.py`       | Exportar livros para CSV            |
| `POST /books/reorder_all`              | `endpoints/books.py`       | Reordenar lista                     |
| `POST /books/fix_consistency`          | `endpoints/books.py`       | Renormalizar ordens (1,2,3...)      |
| `POST /books/preview-score`            | `endpoints/books.py`       | Calcular score sem salvar           |
| `GET /books/stats/toread`              | `endpoints/books.py`       | Stats de leitura por quartil        |
| `GET /me`                              | `endpoints/users.py`       | Dados do usuário logado             |
| `POST /users/sync`                     | `endpoints/users.py`       | Sincronizar perfil com Supabase     |
| `GET /admin/users`                     | `endpoints/users.py`       | Listar usuários (admin)             |
| `DELETE /admin/users/{id}`             | `endpoints/users.py`       | Deletar usuário (admin)             |
| `POST /admin/users/{id}/toggle_active` | `endpoints/users.py`       | Ativar/desativar usuário            |
| `GET /preferences/`                    | `endpoints/preferences.py` | Buscar preferências                 |
| `PUT /preferences/`                    | `endpoints/preferences.py` | Salvar preferências                 |
| `GET /health`                          | `endpoints/system.py`      | Status da API e BD                  |
| `GET /proxy/image`                     | `endpoints/system.py`      | Proxy de imagens externas           |

## Guia Prático: Onde Mexer para Cada Tarefa

### Adicionar um novo endpoint

1. Abra o arquivo de endpoint correspondente em `app/api/v1/endpoints/`
2. Adicione a função com o decorator `@router.get/post/put/delete`
3. Se for um endpoint de um novo assunto, crie um novo arquivo e registre em `app/api/v1/api.py`

### Adicionar ou modificar um campo no banco de dados

1. Edite o modelo em `app/models/book.py` ou `app/models/user.py`
2. O banco é atualizado automaticamente no próximo startup (`create_db_and_tables`)
3. ⚠️ Em Postgres/Supabase, pode ser necessário criar a migração manualmente via SQL no painel do Supabase

### Modificar lógica de IA (sugestão de livros)

- **Prompts e chamadas de API:** `app/services/ai.py`
- **Orquestração (qual API chamar):** `app/services/book_enrichment.py`
- **APIs externas (Google Books etc.):** `app/services/metadata.py`

### Modificar a fórmula de score/prioridade

- Arquivo: `app/services/scoring.py`
- A função principal é `calculate_book_score(book, config)`
- O `config` vem de `UserPreference.formula_config` (JSON personalizado por usuário)

### Trocar ou ajustar a autenticação

- **Verificação do token Supabase:** `app/api/deps.py` → função `get_current_user`
- **Cadastro de usuário:** `app/api/v1/endpoints/auth.py`

### Adicionar nova origem no CORS

- Arquivo: `app/main.py` → lista `allow_origins`

### Adicionar nova variável de ambiente

1. Adicione no `.env` (local) e nas variáveis do Vercel (produção)
2. Adicione o atributo em `app/core/config.py` na classe `Settings`
3. Use via `from app.core.config import settings` nos outros arquivos

### Trocar de banco de dados

- Arquivo: `app/core/database.py`
- Se `DATABASE_URL` estiver nas variáveis de ambiente → usa **PostgreSQL (Supabase)**
- Se não estiver → usa **SQLite local** (`database.db`)

### Adicionar nova dependência Python

1. Instale com `pip install <pacote>`
2. Adicione em `requirements.txt`

## Fluxo de uma Requisição (Exemplo: Criar Livro)

```dash
Frontend
  → POST /books/
    → app/main.py (recebe + CORS)
      → app/api/v1/api.py (roteamento)
        → app/api/v1/endpoints/books.py → create_book()
          → app/api/deps.py → get_current_user() [valida token Supabase]
          → app/services/book_enrichment.py → get_book_details_hybrid() [busca dados IA]
          → app/services/scoring.py → calculate_book_score() [calcula prioridade]
          → app/core/database.py → get_session() [salva no banco]
```

## Como Rodar Localmente

```bash
# Na pasta backend/
pip install -r requirements.txt

# Copiar .env com as variáveis (Supabase URL, keys etc.)
# Rodar o servidor:
python main.py
# ou
uvicorn app.main:app --reload --port 8000
```

A documentação interativa da API fica disponível em: `http://localhost:8000/docs`

## Variáveis de Ambiente Necessárias

| Variável                    | Obrigatória | Descrição                                     |
| --------------------------- | ----------- | --------------------------------------------- |
| `DATABASE_URL`              | Sim (prod)  | URL do PostgreSQL/Supabase                    |
| `SUPABASE_URL`              | Sim         | URL do projeto Supabase                       |
| `SUPABASE_ANON_KEY`         | Sim         | Chave pública do Supabase                     |
| `SUPABASE_SERVICE_ROLE_KEY` | Sim         | Chave privada (admin)                         |
| `ENCRYPTION_KEY`            | Sim         | Chave para criptografar API keys dos usuários |
| `OPENAI_API_KEY`            | Não         | Chave OpenAI global (fallback)                |
| `GEMINI_API_KEY`            | Não         | Chave Gemini global (fallback)                |
| `GROQ_API_KEY`              | Não         | Chave Groq global (fallback)                  |
