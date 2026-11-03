drop trigger if exists profiles_set_updated_at on public.profiles;
drop trigger if exists transactions_set_updated_at on public.transactions;
drop trigger if exists budgets_set_updated_at on public.budgets;
drop trigger if exists goals_set_updated_at on public.goals;
drop trigger if exists bills_set_updated_at on public.bills;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger transactions_set_updated_at
before update on public.transactions
for each row execute function public.set_updated_at();

create trigger budgets_set_updated_at
before update on public.budgets
for each row execute function public.set_updated_at();

create trigger goals_set_updated_at
before update on public.goals
for each row execute function public.set_updated_at();

create trigger bills_set_updated_at
before update on public.bills
for each row execute function public.set_updated_at();
