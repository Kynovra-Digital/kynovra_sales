drop policy if exists "Product categories visible to organization users" on public.product_categories;
create policy "Product categories visible to organization users"
on public.product_categories
for select
to authenticated
using (organization_id = public.current_user_organization_id());

drop policy if exists "Product categories writable by organization managers" on public.product_categories;
create policy "Product categories writable by organization managers"
on public.product_categories
for all
to authenticated
using (
  organization_id = public.current_user_organization_id()
  and public.current_user_is_manager()
)
with check (
  organization_id = public.current_user_organization_id()
  and public.current_user_is_manager()
);
