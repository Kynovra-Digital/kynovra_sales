insert into public.permissions (key, description)
values
  ('dashboard.view', 'Ver aba Dashboard.'),
  ('sales.view', 'Ver aba Atendimentos de Venda.'),
  ('support.view', 'Ver aba Suporte Pós-Venda.'),
  ('products.view', 'Ver aba Produtos.'),
  ('knowledge.view', 'Ver aba Base de Conhecimentos.'),
  ('campaigns.view', 'Ver aba Campanhas.'),
  ('leads.view', 'Ver aba Leads e Registros.'),
  ('inventory.view', 'Ver aba Estoque e Disponibilidade.'),
  ('quality.view', 'Ver aba Relatórios de Qualidade.'),
  ('team.view', 'Ver aba Equipe e Permissões.'),
  ('audit.view', 'Ver aba Auditoria e Histórico.'),
  ('settings.view', 'Ver aba Configurações Gerais.')
on conflict (key) do update
set description = excluded.description;

create table if not exists public.profile_permissions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  permission_id uuid not null references public.permissions(id) on delete cascade,
  created_at timestamptz not null default now()
);

create unique index if not exists profile_permissions_unique_idx
  on public.profile_permissions (profile_id, permission_id);

create index if not exists profile_permissions_organization_idx
  on public.profile_permissions (organization_id);

alter table public.profile_permissions enable row level security;

drop policy if exists "Profile permissions visible to organization users" on public.profile_permissions;
create policy "Profile permissions visible to organization users"
on public.profile_permissions
for select
to authenticated
using (organization_id = public.current_user_organization_id());

drop policy if exists "Profile permissions manageable by authorized users" on public.profile_permissions;
create policy "Profile permissions manageable by authorized users"
on public.profile_permissions
for all
to authenticated
using (
  organization_id = public.current_user_organization_id()
  and (
    public.current_user_is_owner()
    or public.current_user_has_permission('team.manage')
  )
)
with check (
  organization_id = public.current_user_organization_id()
  and (
    public.current_user_is_owner()
    or public.current_user_has_permission('team.manage')
  )
);

create or replace function public.current_user_has_permission(
  p_permission_key text
)
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select
    public.current_user_is_owner()
    or exists (
      select 1
      from public.group_members gm
      join public.group_permissions gp on gp.group_id = gm.group_id
      join public.permissions p on p.id = gp.permission_id
      join public.profiles profile on profile.id = gm.profile_id
      where gm.profile_id = auth.uid()
        and gm.organization_id = public.current_user_organization_id()
        and profile.organization_id = gm.organization_id
        and p.key in (p_permission_key, '*')
    )
    or exists (
      select 1
      from public.profile_permissions pp
      join public.permissions p on p.id = pp.permission_id
      join public.profiles profile on profile.id = pp.profile_id
      where pp.profile_id = auth.uid()
        and pp.organization_id = public.current_user_organization_id()
        and profile.organization_id = pp.organization_id
        and p.key in (p_permission_key, '*')
    )
$$;

create or replace function public.current_user_permissions()
returns text[]
language sql
stable
security definer
set search_path = public, auth
as $$
  select case
    when public.current_user_is_owner() then
      coalesce(
        array(
          select distinct p.key
          from public.permissions p
          order by p.key
        ),
        array['*']::text[]
      )
    else
      coalesce(
        array(
          select distinct permission_key
          from (
            select p.key as permission_key
            from public.group_members gm
            join public.group_permissions gp on gp.group_id = gm.group_id
            join public.permissions p on p.id = gp.permission_id
            join public.profiles profile on profile.id = gm.profile_id
            where gm.profile_id = auth.uid()
              and gm.organization_id = public.current_user_organization_id()
              and profile.organization_id = gm.organization_id

            union

            select p.key as permission_key
            from public.profile_permissions pp
            join public.permissions p on p.id = pp.permission_id
            join public.profiles profile on profile.id = pp.profile_id
            where pp.profile_id = auth.uid()
              and pp.organization_id = public.current_user_organization_id()
              and profile.organization_id = pp.organization_id
          ) resolved_permissions
          order by permission_key
        ),
        '{}'::text[]
      )
  end
$$;

create or replace function public.save_member_permissions(
  p_organization_id uuid,
  p_profile_id uuid,
  p_permission_keys text[] default '{}'::text[]
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_permission_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Usuário não autenticado.';
  end if;

  if p_organization_id is null
    or p_organization_id <> public.current_user_organization_id() then
    raise exception 'Organização inválida.';
  end if;

  if not (
    public.current_user_is_owner()
    or public.current_user_has_permission('team.manage')
  ) then
    raise exception 'Sem permissão para gerenciar membros.';
  end if;

  if not exists (
    select 1
    from public.profiles
    where id = p_profile_id
      and organization_id = p_organization_id
  ) then
    raise exception 'Membro não encontrado.';
  end if;

  delete from public.profile_permissions
  where organization_id = p_organization_id
    and profile_id = p_profile_id;

  for v_permission_id in
    select id
    from public.permissions
    where key = any(coalesce(p_permission_keys, '{}'::text[]))
  loop
    insert into public.profile_permissions (
      organization_id,
      profile_id,
      permission_id
    )
    values (
      p_organization_id,
      p_profile_id,
      v_permission_id
    )
    on conflict do nothing;
  end loop;

  insert into public.audit_logs (
    organization_id,
    actor_id,
    action,
    entity_type,
    entity_id,
    metadata
  )
  values (
    p_organization_id,
    auth.uid(),
    'team.member_permissions.saved',
    'profile',
    p_profile_id::text,
    jsonb_build_object(
      'permission_count', coalesce(array_length(p_permission_keys, 1), 0)
    )
  );

  return jsonb_build_object(
    'success', true,
    'profile_id', p_profile_id
  );
end;
$$;

revoke all on function public.save_member_permissions(
  uuid,
  uuid,
  text[]
) from public;

grant execute on function public.save_member_permissions(
  uuid,
  uuid,
  text[]
) to authenticated;
