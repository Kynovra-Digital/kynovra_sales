do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'products'
      and policyname = 'Products writable by organization managers'
  ) then
    create policy "Products writable by organization managers"
    on public.products
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
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'campaigns'
      and policyname = 'Campaigns visible to organization users'
  ) then
    create policy "Campaigns visible to organization users"
    on public.campaigns
    for select
    to authenticated
    using (organization_id = public.current_user_organization_id());
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'campaigns'
      and policyname = 'Campaigns writable by organization managers'
  ) then
    create policy "Campaigns writable by organization managers"
    on public.campaigns
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
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'campaign_products'
      and policyname = 'Campaign products visible to organization users'
  ) then
    create policy "Campaign products visible to organization users"
    on public.campaign_products
    for select
    to authenticated
    using (organization_id = public.current_user_organization_id());
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'campaign_products'
      and policyname = 'Campaign products writable by organization managers'
  ) then
    create policy "Campaign products writable by organization managers"
    on public.campaign_products
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
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'ai_agents'
      and policyname = 'AI agents visible to organization users'
  ) then
    create policy "AI agents visible to organization users"
    on public.ai_agents
    for select
    to authenticated
    using (organization_id = public.current_user_organization_id());
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'ai_agents'
      and policyname = 'AI agents writable by organization managers'
  ) then
    create policy "AI agents writable by organization managers"
    on public.ai_agents
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
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'organization_settings'
      and policyname = 'Organization settings visible to organization users'
  ) then
    create policy "Organization settings visible to organization users"
    on public.organization_settings
    for select
    to authenticated
    using (organization_id = public.current_user_organization_id());
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'organization_settings'
      and policyname = 'Organization settings writable by managers'
  ) then
    create policy "Organization settings writable by managers"
    on public.organization_settings
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
  end if;
end $$;
