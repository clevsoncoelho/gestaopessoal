create or replace function public.set_updated_at() returns trigger language plpgsql set search_path = public, pg_temp as $$ begin new.updated_at = now(); return new; end; $$;
create or replace function public.keep_alive() returns boolean language sql stable security invoker set search_path = public, pg_temp as $$ select true $$;
revoke execute on function public.keep_alive() from public;
grant execute on function public.keep_alive() to anon, authenticated, service_role;

create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = public, pg_temp as $$ begin insert into public.profiles (id, full_name) values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', new.email)) on conflict (id) do nothing; insert into public.categories (user_id, name, icon, kind, context) values (new.id, 'Alimentação', '🛒', 'expense', 'personal'), (new.id, 'Transporte', '🚗', 'expense', 'personal'), (new.id, 'Casa', '⌂', 'expense', 'personal'), (new.id, 'Lazer', '♫', 'expense', 'personal'), (new.id, 'Serviços', '✦', 'income', 'professional'), (new.id, 'Operacional', '⚙', 'expense', 'professional') on conflict (user_id, name, context) do nothing; return new; end; $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();
revoke execute on function public.handle_new_user() from public, anon, authenticated;

create or replace function public.apply_goal_contribution() returns trigger language plpgsql security definer set search_path = public, pg_temp as $$ declare owner_id uuid; begin select user_id into owner_id from public.goals where id = new.goal_id; if owner_id is null or owner_id <> new.user_id then raise exception 'Goal does not belong to the contribution owner'; end if; update public.goals set current_amount = least(target_amount, current_amount + new.amount), status = case when current_amount + new.amount >= target_amount then 'completed'::public.goal_status else status end, updated_at = now() where id = new.goal_id; return new; end; $$;
drop trigger if exists goal_contribution_updates_goal on public.goal_contributions;
create trigger goal_contribution_updates_goal after insert on public.goal_contributions for each row execute function public.apply_goal_contribution();
revoke execute on function public.apply_goal_contribution() from public, anon, authenticated;
