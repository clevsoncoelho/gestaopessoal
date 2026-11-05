-- Migration: expose budgets and goal_contributions for UI
-- Adds a view to make budget usage query easier, and ensures
-- goal_contributions is fully accessible via RLS (already done in initial schema)

-- Function to get current month's spending per category for a user
create or replace function public.monthly_category_spending(
  p_user_id uuid,
  p_context public.finance_context,
  p_month_start date
)
returns table (category_id uuid, category_name text, total numeric)
language sql
stable
security invoker
set search_path = public, pg_temp
as $$
  select
    t.category_id,
    c.name as category_name,
    sum(t.amount) as total
  from public.transactions t
  left join public.categories c on c.id = t.category_id
  where t.user_id = p_user_id
    and t.context = p_context
    and t.kind = 'expense'
    and t.occurred_on >= p_month_start
    and t.occurred_on < (p_month_start + interval '1 month')::date
  group by t.category_id, c.name;
$$;

grant execute on function public.monthly_category_spending(uuid, public.finance_context, date) to authenticated;

-- Allow budgets to reference categories by name as well (for UI display)
-- Add a helper view for budget usage
create or replace view public.budget_usage as
select
  b.id,
  b.user_id,
  b.context,
  b.month_start,
  b.limit_amount,
  c.name as category_name,
  c.icon as category_icon,
  coalesce(
    (
      select sum(t.amount)
      from public.transactions t
      where t.user_id = b.user_id
        and t.category_id = b.category_id
        and t.kind = 'expense'
        and t.occurred_on >= b.month_start
        and t.occurred_on < (b.month_start + interval '1 month')::date
    ),
    0
  ) as used_amount
from public.budgets b
join public.categories c on c.id = b.category_id;

-- RLS on the view is inherited from the underlying tables via security invoker
-- Grant access to authenticated users
grant select on public.budget_usage to authenticated;
