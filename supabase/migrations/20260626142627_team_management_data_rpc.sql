grant select on public.groups to authenticated;
grant select on public.group_members to authenticated;
grant select on public.group_permissions to authenticated;
grant select on public.permissions to authenticated;
grant select on public.profile_permissions to authenticated;

create or replace function public.get_team_management_data()
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_organization_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Usuário não autenticado.';
  end if;

  v_organization_id := public.current_user_organization_id();

  if v_organization_id is null then
    raise exception 'Organização não encontrada.';
  end if;

  if not (
    public.current_user_is_owner()
    or public.current_user_has_permission('team.view')
    or public.current_user_has_permission('team.manage')
  ) then
    raise exception 'Sem permissão para visualizar equipes.';
  end if;

  return jsonb_build_object(
    'permissions',
    coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'id', p.id,
            'key', p.key,
            'description', p.description,
            'created_at', p.created_at
          )
          order by p.key
        )
        from public.permissions p
      ),
      '[]'::jsonb
    ),
    'members',
    coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'id', profile.id,
            'organization_id', profile.organization_id,
            'full_name', profile.full_name,
            'role', profile.role,
            'created_at', profile.created_at,
            'updated_at', profile.updated_at,
            'directPermissionKeys',
              coalesce(
                (
                  select jsonb_agg(permission.key order by permission.key)
                  from public.profile_permissions pp
                  join public.permissions permission on permission.id = pp.permission_id
                  where pp.profile_id = profile.id
                    and pp.organization_id = v_organization_id
                ),
                '[]'::jsonb
              )
          )
          order by coalesce(profile.full_name, profile.role), profile.created_at
        )
        from public.profiles profile
        where profile.organization_id = v_organization_id
      ),
      '[]'::jsonb
    ),
    'groups',
    coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'id', g.id,
            'organization_id', g.organization_id,
            'name', g.name,
            'description', g.description,
            'created_at', g.created_at,
            'updated_at', g.updated_at,
            'memberIds',
              coalesce(
                (
                  select jsonb_agg(gm.profile_id order by gm.created_at)
                  from public.group_members gm
                  where gm.group_id = g.id
                    and gm.organization_id = v_organization_id
                ),
                '[]'::jsonb
              ),
            'members',
              coalesce(
                (
                  select jsonb_agg(
                    jsonb_build_object(
                      'id', profile.id,
                      'organization_id', profile.organization_id,
                      'full_name', profile.full_name,
                      'role', profile.role,
                      'created_at', profile.created_at,
                      'updated_at', profile.updated_at,
                      'directPermissionKeys',
                        coalesce(
                          (
                            select jsonb_agg(permission.key order by permission.key)
                            from public.profile_permissions pp
                            join public.permissions permission on permission.id = pp.permission_id
                            where pp.profile_id = profile.id
                              and pp.organization_id = v_organization_id
                          ),
                          '[]'::jsonb
                        )
                    )
                    order by coalesce(profile.full_name, profile.role), profile.created_at
                  )
                  from public.group_members gm
                  join public.profiles profile on profile.id = gm.profile_id
                  where gm.group_id = g.id
                    and gm.organization_id = v_organization_id
                    and profile.organization_id = v_organization_id
                ),
                '[]'::jsonb
              ),
            'permissionKeys',
              coalesce(
                (
                  select jsonb_agg(permission.key order by permission.key)
                  from public.group_permissions gp
                  join public.permissions permission on permission.id = gp.permission_id
                  where gp.group_id = g.id
                ),
                '[]'::jsonb
              )
          )
          order by g.name
        )
        from public.groups g
        where g.organization_id = v_organization_id
      ),
      '[]'::jsonb
    )
  );
end;
$$;

revoke all on function public.get_team_management_data() from public;
grant execute on function public.get_team_management_data() to authenticated;
