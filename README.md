# Pulse Finance

Aplicação de gestão financeira mobile-first, com modo pessoal/profissional, dashboard imersivo, metas, orçamentos, Supabase protegido por RLS e experiência PWA.

## O que já funciona

- Dashboard com saldo ocultável, fluxo de entradas/saídas e alertas.
- Navegação por Início, Transações, Metas e Perfil.
- Cadastro e exclusão persistentes de transações e metas no Supabase.
- Busca e swipe para excluir transações.
- Aba de análise com indicadores, gastos por categoria e contas recorrentes persistidas.
- Justificativa obrigatória nas novas transações, armazenada em `transactions.notes` e exibida no histórico.
- A obrigatoriedade também é reforçada por trigger no banco para impedir registros novos sem justificativa, inclusive importações.
- Área segura preparada para conexão Open Finance com o Banco Inter, sem solicitar senha ou expor certificados no navegador.
- Cadastro e quitação de contas diretamente pelo painel de análise.
- Pull-to-refresh, animações e instalação como PWA.
- Login, criação de conta, login Google e logout via Supabase Auth.
- Rota `/api/keep-alive` e workflow agendado a cada dois dias.

## Rodar localmente

```bash
npm install
copy .env.example .env.local
npm run dev
```

O projeto Supabase já está criado em São Paulo e contém o schema inicial. Preencha as variáveis do `.env.local` com a URL e a chave publicável do Supabase. Nunca versione `.env.local` nem use uma chave secreta no frontend.
