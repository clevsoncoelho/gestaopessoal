# Pulse Finance

Aplicação de gestão financeira mobile-first, com modo pessoal/profissional, dashboard imersivo, metas, orçamentos, Supabase protegido por RLS e experiência PWA.

## O que já funciona

- Dashboard com saldo ocultável, fluxo de entradas/saídas e alertas.
- Navegação por Início, Transações, Metas e Perfil.
- Cadastro e exclusão persistentes de transações e metas no Supabase.
- Busca e swipe para excluir transações.
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
