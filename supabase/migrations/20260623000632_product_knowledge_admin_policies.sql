grant select, insert, update, delete on table public.product_knowledge_items to authenticated;

drop policy if exists "Product knowledge visible to organization users"
  on public.product_knowledge_items;
create policy "Product knowledge visible to organization users"
on public.product_knowledge_items for select to authenticated
using (organization_id = public.current_user_organization_id());

drop policy if exists "Product knowledge writable by organization managers"
  on public.product_knowledge_items;
create policy "Product knowledge writable by organization managers"
on public.product_knowledge_items for all to authenticated
using (
  organization_id = public.current_user_organization_id()
  and public.current_user_is_manager()
)
with check (
  organization_id = public.current_user_organization_id()
  and public.current_user_is_manager()
);
