alter table public.profiles
  drop constraint if exists profiles_role_check;

alter table public.profiles
  add constraint profiles_role_check
  check (
    role in (
      'owner',
      'founder',
      'superadmin',
      'management',
      'admin',
      'supervisor',
      'user',
      'collaborator',
      'attendance',
      'support'
    )
  );

insert into public.permissions (key, description)
values
  ('*', 'Acesso total ao sistema. Uso interno para Owner/Fundador.'),
  ('system.admin', 'Administrar módulos operacionais e configurações.'),
  ('team.manage', 'Gerenciar equipe, grupos e permissões.'),
  ('settings.manage', 'Alterar configurações gerais da organização.'),
  ('ai.settings.manage', 'Alterar configuração global de IA.'),
  ('products.manage', 'Criar, editar, arquivar e configurar produtos.'),
  ('campaigns.manage', 'Criar, editar e arquivar campanhas.'),
  ('knowledge.manage', 'Gerenciar bases de conhecimento.'),
  ('sales.ticket.accept', 'Aceitar tickets de atendimento de venda.'),
  ('sales.ticket.open', 'Abrir atendimentos de venda aceitos.'),
  ('sales.ticket.transfer', 'Transferir atendimentos de venda.'),
  ('sales.ticket.close', 'Encerrar atendimentos de venda.'),
  ('support.ticket.accept', 'Aceitar tickets de suporte.'),
  ('support.ticket.open', 'Abrir suportes aceitos.'),
  ('support.ticket.transfer', 'Transferir suportes.'),
  ('support.ticket.close', 'Encerrar suportes.'),
  ('audit.read', 'Visualizar auditoria e histórico.'),
  ('notifications.read', 'Visualizar notificações da topbar.')
on conflict (key) do update
set description = excluded.description;

create or replace function public.current_user_is_owner()
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role in ('owner', 'founder')
  )
$$;

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
          select distinct p.key
          from public.group_members gm
          join public.group_permissions gp on gp.group_id = gm.group_id
          join public.permissions p on p.id = gp.permission_id
          join public.profiles profile on profile.id = gm.profile_id
          where gm.profile_id = auth.uid()
            and gm.organization_id = public.current_user_organization_id()
            and profile.organization_id = gm.organization_id
          order by p.key
        ),
        '{}'::text[]
      )
  end
$$;

create or replace function public.current_user_is_operator()
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select
    public.current_user_is_owner()
    or public.current_user_has_permission('sales.ticket.accept')
    or public.current_user_has_permission('sales.ticket.open')
    or public.current_user_has_permission('support.ticket.accept')
    or public.current_user_has_permission('support.ticket.open')
$$;

create or replace function public.current_user_is_manager()
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select
    public.current_user_is_owner()
    or public.current_user_has_permission('system.admin')
    or public.current_user_has_permission('team.manage')
$$;

drop policy if exists "Groups visible to organization users" on public.groups;
create policy "Groups visible to organization users"
on public.groups
for select
to authenticated
using (organization_id = public.current_user_organization_id());

drop policy if exists "Groups manageable by authorized users" on public.groups;
create policy "Groups manageable by authorized users"
on public.groups
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

drop policy if exists "Group members visible to organization users" on public.group_members;
create policy "Group members visible to organization users"
on public.group_members
for select
to authenticated
using (organization_id = public.current_user_organization_id());

drop policy if exists "Group members manageable by authorized users" on public.group_members;
create policy "Group members manageable by authorized users"
on public.group_members
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

drop policy if exists "Permissions visible to authenticated users" on public.permissions;
create policy "Permissions visible to authenticated users"
on public.permissions
for select
to authenticated
using (true);

drop policy if exists "Group permissions visible to organization users" on public.group_permissions;
create policy "Group permissions visible to organization users"
on public.group_permissions
for select
to authenticated
using (
  exists (
    select 1
    from public.groups g
    where g.id = group_permissions.group_id
      and g.organization_id = public.current_user_organization_id()
  )
);

drop policy if exists "Group permissions manageable by authorized users" on public.group_permissions;
create policy "Group permissions manageable by authorized users"
on public.group_permissions
for all
to authenticated
using (
  (
    public.current_user_is_owner()
    or public.current_user_has_permission('team.manage')
  )
  and exists (
    select 1
    from public.groups g
    where g.id = group_permissions.group_id
      and g.organization_id = public.current_user_organization_id()
  )
)
with check (
  (
    public.current_user_is_owner()
    or public.current_user_has_permission('team.manage')
  )
  and exists (
    select 1
    from public.groups g
    where g.id = group_permissions.group_id
      and g.organization_id = public.current_user_organization_id()
  )
);
