# Pulse Finance

Aplicação de gestão financeira mobile-first, com modo pessoal/profissional, dashboard imersivo, metas, orçamentos, Supabase protegido por RLS e experiência PWA.

## O que já funciona

- Dashboard com saldo ocultável, fluxo de entradas/saídas e alertas.
- Navegação por Início, Transações, Metas e Perfil.
- Cadastro local otimista de transações e metas.
- Busca e swipe para excluir transações.
- Pull-to-refresh, animações e instalação como PWA.
- Login, criação de conta e logout via Supabase Auth quando as variáveis estiverem configuradas.
- Rota `/api/keep-alive` e workflow agendado a cada dois dias.

## Rodar localmente

```bash
npm install
copy .env.example .env.local
npm run dev
```

O projeto Supabase já está criado em São Paulo e contém o schema inicial. Para usar autenticação e persistência, preencha as variáveis do `.env.local` com a URL e a chave publicável do Supabase.
