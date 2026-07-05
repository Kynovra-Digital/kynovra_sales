create or replace function public.public_email_is_registered(p_email text)
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select exists (
    select 1
    from auth.users user_account
    where lower(user_account.email) = lower(trim(coalesce(p_email, '')))
      and nullif(trim(coalesce(p_email, '')), '') is not null
  )
$$;

revoke all on function public.public_email_is_registered(text) from public;
grant execute on function public.public_email_is_registered(text) to anon, authenticated;
