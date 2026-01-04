# 📚 Sistema de Gerenciamento de Leitura

> Um sistema completo de gerenciamento de biblioteca pessoal com classificação hierárquica, sugestões de IA e analytics avançados. Organize sua lista de leitura, acompanhe seu progresso e descubra insights sobre seus hábitos de leitura.

![Status](https://img.shields.io/badge/Status-Em%20Desenvolvimento-yellow?style=for-the-badge)
![Python](https://img.shields.io/badge/Python-3.11-blue?style=for-the-badge&logo=python)
![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react)

## ✨ Funcionalidades Principais

### 📖 Gerenciamento de Livros
- **CRUD Completo**: Adicionar, editar, visualizar e excluir livros
- **Classificação Hierárquica**: Sistema de 6 classes e 47 categorias
- **Sugestões de IA**: Integração com Groq AI e Google Books API para preenchimento automático
- **Capas Automáticas**: Busca e armazenamento de capas via Google Books API
- **Sistema de Score**: Cálculo automático de prioridade baseado em múltiplos fatores

### 🎯 Organização Inteligente
- **Fila de Leitura**: Sistema de ordenação para "Próximos da Fila"
- **Filtros Avançados**: Busca por título/autor, categoria, status, prioridade e ano
- **Múltiplas Visualizações**: Mural de cards, tabela gerencial e analytics

### 📊 Analytics
- **Dashboard Interativo**: Estatísticas de leitura em tempo real
- **Distribuição por Classe**: Visualize seus livros por macro-categorias
- **Métricas de Progresso**: Acompanhe livros lidos, em leitura e na fila

### 🤖 Inteligência Artificial
- **Classificação Automática**: IA sugere classe, categoria e tipo do livro
- **Motivação Gerada**: Resumos e motivos para ler gerados por IA
- **Dados Factuais**: Autor, ano e descrição via Google Books API

## 🛠️ Tecnologias Utilizadas

### Backend
- **FastAPI**: Framework web moderno e rápido
- **SQLModel**: ORM com suporte a SQLite
- **Groq AI**: Modelo de linguagem para classificação
- **Google Books API**: Dados factuais e capas de livros
- **Python 3.11+**

### Frontend
- **React 18**: Biblioteca UI com hooks
- **Vite**: Build tool ultra-rápido
- **Tailwind CSS**: Framework CSS utility-first
- **Axios**: Cliente HTTP
- **Lucide React**: Ícones modernos

## 🚀 Como Executar

### Pré-requisitos
- Python 3.11+
- Node.js 18+
- Conta Groq (para API key)

### 1. Clone o Repositório
```bash
git clone https://github.com/vitoriapguimaraes/new_project_book.git
cd new_project_book
```

### 2. Configure o Backend

```bash
cd backend

# Crie um ambiente virtual
python -m venv venv

# Ative o ambiente (Windows)
venv\Scripts\activate

# Instale as dependências
pip install fastapi uvicorn sqlmodel python-dotenv groq requests

# Configure a API key do Groq
# Crie um arquivo .env com:
# GROQ_API_KEY=sua_chave_aqui

# Execute o servidor
uvicorn main:app --reload
```

O backend estará rodando em `http://127.0.0.1:8000`

### 3. Configure o Frontend

```bash
cd frontend

# Instale as dependências
npm install

# Execute o servidor de desenvolvimento
npm run dev
```

O frontend estará rodando em `http://localhost:5173`

## 📖 Como Usar

### Adicionar um Novo Livro

1. Acesse a aba **"Adicionar Livro"**
2. Digite o **título** do livro
3. Clique em **"✨ Sugerir com IA"** para preenchimento automático
4. Revise e ajuste os campos sugeridos
5. Selecione a **Classe** (as categorias serão filtradas automaticamente)
6. Clique em **"Salvar Livro"**

### Organizar Fila de Leitura

1. Acesse a aba **"Gerenciar Biblioteca"**
2. Filtre por status **"A Ler"** ou **"Lendo"**
3. Edite o campo **"Ordem"** para definir prioridades
4. Livros com ordem definida aparecem em **"Próximos da Fila"**

### Visualizar Analytics

1. Acesse a aba **"Analytics"**
2. Veja estatísticas de:
   - Total de livros
   - Distribuição por status
   - Top 6 categorias
   - Nota média

## 📁 Estrutura de Diretórios

```
/new_project_book
├── backend/
│   ├── main.py              # API FastAPI
│   ├── models.py            # Modelos SQLModel
│   ├── utils.py             # Funções auxiliares e IA
│   ├── database.py          # Configuração do banco
│   ├── database.db          # SQLite database
│   └── static/covers/       # Capas de livros (legacy)
├── frontend/
│   ├── src/
│   │   ├── components/      # Componentes React
│   │   │   ├── BookForm.jsx
│   │   │   ├── BookCard.jsx
│   │   │   ├── BooksTable.jsx
│   │   │   ├── Analytics.jsx
│   │   │   └── Sidebar.jsx
│   │   ├── App.jsx          # Componente principal
│   │   └── index.css        # Estilos Tailwind
│   ├── vite.config.js       # Configuração Vite
│   └── package.json
└── README.md
```

## 🎨 Sistema de Classificação

### 6 Classes Hierárquicas

1. **🤖 Tecnologia & IA** (7 categorias)
   - IA, Machine Learning, Data Science, Programação, etc.

2. **🏗️ Engenharia & Arquitetura** (6 categorias)
   - MLOps, Engenharia de Dados, Clean Code, etc.

3. **📈 Conhecimento & Ciências** (4 categorias)
   - Estatística, Cosmologia, Conhecimento Geral

4. **💰 Negócios & Finanças** (3 categorias)
   - Finanças Pessoais, Negócios, Liberdade Econômica

5. **📚 Literatura & Cultura** (6 categorias)
   - Literatura Brasileira, Ficção, Diversidade, etc.

6. **🌱 Desenvolvimento Pessoal** (10 categorias)
   - Liderança, Produtividade, Bem-estar, Comunicação, etc.

## 🔄 Migração de Dados

O projeto inclui scripts de migração para:
- Adicionar campo `book_class` ao banco existente
- Popular classes automaticamente baseado em categorias
- Converter capas locais para URLs da API
- Atualizar URLs para thumbnails (menor resolução)

## 📊 Sistema de Score

O score é calculado automaticamente baseado em:
- **Peso da Categoria** (1-7 pontos)
- **Prioridade** (1-3 pontos)
- **Disponibilidade** (+2 se "Estante")
- **Tipo** (+1 se "Técnico")

## 🔮 Próximos Passos

> Veja as [issues abertas](https://github.com/vitoriapguimaraes/new_project_book/issues) para sugestões de melhorias.

## 📝 Status

🚧 **Em Desenvolvimento Ativo**

**Última Atualização**: Janeiro 2026

**Versão**: 2.0.0 (Sistema de Classificação Hierárquica)

## 👩‍💻 Mais Sobre Mim

Acesse os arquivos disponíveis na [Pasta Documentos](https://github.com/vitoriapguimaraes/vitoriapguimaraes/tree/main/DOCUMENTOS) para mais informações sobre minhas qualificações e certificações.

---

**Desenvolvido com ❤️ por [Vitória Guimarães](https://github.com/vitoriapguimaraes)**
