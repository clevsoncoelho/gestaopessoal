create extension if not exists "pgcrypto";

create type public.finance_context as enum ('personal', 'professional');
create type public.transaction_kind as enum ('income', 'expense', 'transfer');
create type public.goal_status as enum ('active', 'completed', 'archived');
create type public.bill_status as enum ('pending', 'paid', 'overdue', 'cancelled');

create table public.profiles (id uuid primary key references auth.users(id) on delete cascade, full_name text, avatar_url text, default_context public.finance_context not null default 'personal', currency_code text not null default 'BRL' check (char_length(currency_code) = 3), hide_balance boolean not null default false, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table public.categories (id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade, name text not null, icon text, color text, kind public.transaction_kind not null default 'expense', context public.finance_context not null default 'personal', created_at timestamptz not null default now(), unique (user_id, name, context));
create table public.transactions (id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade, category_id uuid references public.categories(id) on delete set null, description text not null, amount numeric(14,2) not null check (amount > 0), kind public.transaction_kind not null, context public.finance_context not null default 'personal', occurred_on date not null default current_date, notes text, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table public.budgets (id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade, category_id uuid not null references public.categories(id) on delete cascade, context public.finance_context not null default 'personal', month_start date not null, limit_amount numeric(14,2) not null check (limit_amount > 0), created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique (user_id, category_id, context, month_start));
create table public.goals (id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade, title text not null, description text, target_amount numeric(14,2) not null check (target_amount > 0), current_amount numeric(14,2) not null default 0 check (current_amount >= 0), monthly_contribution numeric(14,2) not null default 0 check (monthly_contribution >= 0), target_date date, context public.finance_context not null default 'personal', status public.goal_status not null default 'active', created_at timestamptz not null default now(), updated_at timestamptz not null default now(), check (current_amount <= target_amount));
create table public.goal_contributions (id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade, goal_id uuid not null references public.goals(id) on delete cascade, amount numeric(14,2) not null check (amount > 0), contributed_on date not null default current_date, note text, created_at timestamptz not null default now());
create table public.bills (id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade, title text not null, amount numeric(14,2) not null check (amount > 0), due_on date not null, context public.finance_context not null default 'personal', status public.bill_status not null default 'pending', paid_on date, notes text, created_at timestamptz not null default now(), updated_at timestamptz not null default now());

create index transactions_user_date_idx on public.transactions (user_id, occurred_on desc);
create index transactions_user_context_idx on public.transactions (user_id, context);
create index transactions_category_id_idx on public.transactions (category_id);
create index budgets_user_month_idx on public.budgets (user_id, month_start);
create index budgets_category_id_idx on public.budgets (category_id);
create index goals_user_status_idx on public.goals (user_id, status);
create index bills_user_due_idx on public.bills (user_id, due_on, status);
create index goal_contributions_goal_date_idx on public.goal_contributions (goal_id, contributed_on desc);
create index goal_contributions_user_id_idx on public.goal_contributions (user_id);

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.transactions enable row level security;
alter table public.budgets enable row level security;
alter table public.goals enable row level security;
alter table public.goal_contributions enable row level security;
alter table public.bills enable row level security;

create policy "profiles_owner_select" on public.profiles for select to authenticated using ((select auth.uid()) = id);
create policy "profiles_owner_insert" on public.profiles for insert to authenticated with check ((select auth.uid()) = id);
create policy "profiles_owner_update" on public.profiles for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
create policy "categories_owner_all" on public.categories for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "transactions_owner_all" on public.transactions for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "budgets_owner_all" on public.budgets for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "goals_owner_all" on public.goals for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "goal_contributions_owner_all" on public.goal_contributions for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "bills_owner_all" on public.bills for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

grant select, insert, update, delete on public.profiles, public.categories, public.transactions, public.budgets, public.goals, public.goal_contributions, public.bills to authenticated;
