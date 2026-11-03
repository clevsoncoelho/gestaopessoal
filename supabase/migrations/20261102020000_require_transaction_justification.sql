create or replace function public.require_transaction_justification()
returns trigger
language plpgsql
as $$
begin
  if new.notes is null or btrim(new.notes) = '' then
    raise exception 'A justificativa da transação é obrigatória';
  end if;
  return new;
end;
$$;

drop trigger if exists transactions_require_justification on public.transactions;
create trigger transactions_require_justification
before insert or update on public.transactions
for each row execute function public.require_transaction_justification();
