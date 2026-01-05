# Roadmap do Projeto: Book Tracking App

Este documento organiza os próximos passos do desenvolvimento, priorizando uma base sólida para crescimento (multi-usuário e mobile) e deploy seguro.

## Ordem Sugerida de Desenvolvimento

### Fase 3: Responsividade (Mobile Web)
**Objetivo:** Garantir que o site funcione bem no celular pelo navegador. Isso é pré-requisito antes de pensar em APK.
- [ ] **CSS Mobile-First:** Ajustar grids e tamanhos de fonte para telas pequenas.
- [ ] **Menu Mobile:** Criar um menu hambúrguer ou barra de navegação inferior estilo app.

### Fase 4: Autenticação e Multi-usuário (O Grande Salto)
**Objetivo:** Permitir que você e seu namorado usem o sistema separadamente.
- [ ] **Sistema de Login:** Implementar registro/login (se usar Supabase, isso é muito facilitado).
- [ ] **Isolamento de Dados:** Garantir que o "Usuário A" só veja os livros do "Usuário A".
- [ ] **Configurações por Usuário:** Tabela de user_preferences para salvar chaves de API e prompts personalizados.
- [ ] **Painel Admin:** Tela simples para você (superuser) ver quem está cadastrado.

### Fase 5: Deploy (Colocar no Ar)
**Objetivo:** Tirar do localhost.
- [ ] **Backend:** Deploy no **Render** (tem plano grátis bom para python).
- [ ] **Frontend:** Deploy na **Vercel** (excelente para React).
- [ ] **Variáveis de Ambiente:** Configurar segredos (API Keys, Banco) nas plataformas.

### Fase 6: Mobile App (APK) - Opcional Futuro
**Objetivo:** Ter o ícone no celular.
- [ ] **PWA (Progressive Web App):** Configurar para ser instalável sem loja (mais fácil).
- [ ] **Capacitor:** Se realmente quiser APK para instalar, usar Capacitor no projeto React existente. Não precisa reescrever em Flutter.

---

## Resposta às suas dúvidas

1.  **Deploy agora ou depois?**
    *   **Melhor depois da Fase 2 (Banco de Dados).** Se você fizer deploy agora com banco local (SQLite/arquivo), cada vez que o servidor reiniciar (o que acontece todo dia nos planos grátis), **você perderá todos os dados**. Configurar o banco na nuvem (Supabase/Mongo) é essencial *antes* de usar em produção.

2.  **Flutter vs React Native vs Web?**
    *   Não precisa migrar para Flutter! Seu site React pode virar um app com **Capacitor** ou ser apenas um **PWA** (site que parece app). Fazer responsividade (Fase 3) já resolve 90% da sua dor de "querer ver no celular".

3.  **Refatorar agora?**
    *   Sim! É muito mais fácil mudar nomes de pastas agora do que depois que tivermos lógicas complexas de autenticação espalhadas pelos arquivos.

## Próximo Passo Imediato

Vamos começar pela **Fase 1 (Refatoração)** e já emendar na **Fase 2 (Banco de Dados)**?

Isso prepararia o terreno perfeito para o multi-usuário.
