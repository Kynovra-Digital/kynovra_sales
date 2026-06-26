create or replace function public.save_team_group(
  p_group_id uuid,
  p_organization_id uuid,
  p_name text,
  p_description text default null,
  p_member_ids uuid[] default '{}'::uuid[],
  p_permission_keys text[] default '{}'::text[]
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_group_id uuid;
  v_profile_id uuid;
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
    raise exception 'Sem permissão para gerenciar equipes.';
  end if;

  if nullif(trim(p_name), '') is null then
    raise exception 'Nome da equipe é obrigatório.';
  end if;

  if p_group_id is null then
    insert into public.groups (
      organization_id,
      name,
      description
    )
    values (
      p_organization_id,
      trim(p_name),
      nullif(trim(coalesce(p_description, '')), '')
    )
    returning id into v_group_id;
  else
    update public.groups
    set
      name = trim(p_name),
      description = nullif(trim(coalesce(p_description, '')), ''),
      updated_at = now()
    where id = p_group_id
      and organization_id = p_organization_id
    returning id into v_group_id;

    if v_group_id is null then
      raise exception 'Equipe não encontrada.';
    end if;
  end if;

  delete from public.group_members
  where group_id = v_group_id
    and organization_id = p_organization_id;

  foreach v_profile_id in array coalesce(p_member_ids, '{}'::uuid[]) loop
    if exists (
      select 1
      from public.profiles
      where id = v_profile_id
        and organization_id = p_organization_id
    ) then
      insert into public.group_members (
        organization_id,
        group_id,
        profile_id
      )
      values (
        p_organization_id,
        v_group_id,
        v_profile_id
      )
      on conflict do nothing;
    end if;
  end loop;

  delete from public.group_permissions
  where group_id = v_group_id;

  for v_permission_id in
    select id
    from public.permissions
    where key = any(coalesce(p_permission_keys, '{}'::text[]))
  loop
    insert into public.group_permissions (
      group_id,
      permission_id
    )
    values (
      v_group_id,
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
    'team.group.saved',
    'group',
    v_group_id::text,
    jsonb_build_object(
      'member_count', coalesce(array_length(p_member_ids, 1), 0),
      'permission_count', coalesce(array_length(p_permission_keys, 1), 0)
    )
  );

  return jsonb_build_object(
    'success', true,
    'group_id', v_group_id
  );
end;
$$;

revoke all on function public.save_team_group(
  uuid,
  uuid,
  text,
  text,
  uuid[],
  text[]
) from public;

grant execute on function public.save_team_group(
  uuid,
  uuid,
  text,
  text,
  uuid[],
  text[]
) to authenticated;
