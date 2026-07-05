create extension if not exists unaccent with schema extensions;

alter table public.organizations
  add column if not exists about text,
  add column if not exists person_type text not null default 'legal_entity',
  add column if not exists cnpj text,
  add column if not exists created_by uuid references auth.users(id) on delete set null;

update public.organizations
set person_type = 'individual'
where cnpj is null
  or length(regexp_replace(cnpj, '\D', '', 'g')) <> 14;

alter table public.organizations
  drop constraint if exists organizations_person_type_check;

alter table public.organizations
  add constraint organizations_person_type_check
  check (person_type in ('individual', 'legal_entity'));

alter table public.organizations
  drop constraint if exists organizations_cnpj_required_for_legal_entity_check;

alter table public.organizations
  add constraint organizations_cnpj_required_for_legal_entity_check
  check (
    person_type = 'individual'
    or (
      cnpj is not null
      and length(regexp_replace(cnpj, '\D', '', 'g')) = 14
    )
  );

drop policy if exists "Organizations visible to own users" on public.organizations;
create policy "Organizations visible to own users"
on public.organizations
for select
to authenticated
using (id = public.current_user_organization_id());

create or replace function public.slugify_organization_name(p_name text)
returns text
language sql
immutable
as $$
  select trim(
    both '-'
    from regexp_replace(
      regexp_replace(
        lower(extensions.unaccent(coalesce(p_name, 'organizacao'))),
        '[^a-z0-9]+',
        '-',
        'g'
      ),
      '-+',
      '-',
      'g'
    )
  )
$$;

create or replace function public.create_initial_organization(
  p_name text,
  p_about text,
  p_person_type text,
  p_cnpj text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth, extensions
as $$
declare
  v_user_id uuid := auth.uid();
  v_existing_profile public.profiles%rowtype;
  v_organization_id uuid;
  v_base_slug text;
  v_slug text;
  v_suffix integer := 1;
  v_clean_cnpj text;
  v_full_name text;
  v_email text;
begin
  if v_user_id is null then
    raise exception 'Usuário não autenticado.';
  end if;

  select *
  into v_existing_profile
  from public.profiles
  where id = v_user_id
  limit 1;

  if v_existing_profile.id is not null then
    raise exception 'Usuário já está vinculado a uma organização.';
  end if;

  if nullif(trim(p_name), '') is null then
    raise exception 'Nome da organização é obrigatório.';
  end if;

  if nullif(trim(p_about), '') is null then
    raise exception 'Sobre a organização é obrigatório.';
  end if;

  if p_person_type not in ('individual', 'legal_entity') then
    raise exception 'Tipo de pessoa inválido.';
  end if;

  v_clean_cnpj := nullif(regexp_replace(coalesce(p_cnpj, ''), '\D', '', 'g'), '');

  if p_person_type = 'legal_entity'
    and (v_clean_cnpj is null or length(v_clean_cnpj) <> 14)
  then
    raise exception 'CNPJ inválido.';
  end if;

  v_base_slug := nullif(public.slugify_organization_name(p_name), '');
  v_slug := coalesce(v_base_slug, 'organizacao');

  while exists (
    select 1
    from public.organizations
    where slug = v_slug
  ) loop
    v_suffix := v_suffix + 1;
    v_slug := coalesce(v_base_slug, 'organizacao') || '-' || v_suffix::text;
  end loop;

  select
    coalesce(
      raw_user_meta_data->>'full_name',
      raw_user_meta_data->>'name',
      email
    ),
    email
  into v_full_name, v_email
  from auth.users
  where id = v_user_id;

  insert into public.organizations (
    name,
    slug,
    about,
    person_type,
    cnpj,
    created_by
  )
  values (
    trim(p_name),
    v_slug,
    trim(p_about),
    p_person_type,
    case when p_person_type = 'legal_entity' then v_clean_cnpj else null end,
    v_user_id
  )
  returning id into v_organization_id;

  insert into public.organization_settings (
    organization_id,
    timezone,
    support_public_enabled,
    sales_public_enabled,
    ai_takeover_timeout_seconds
  )
  values (
    v_organization_id,
    'America/Fortaleza',
    true,
    true,
    60
  )
  on conflict (organization_id)
  do nothing;

  insert into public.organization_ai_settings (
    organization_id,
    provider,
    model,
    model_id,
    is_active,
    temperature,
    max_output_tokens,
    timeout_seconds,
    fallback_enabled,
    ai_auto_takeover_enabled,
    human_accept_timeout_seconds
  )
  values (
    v_organization_id,
    'gateway',
    'google/gemini-3-flash',
    'google/gemini-3-flash',
    true,
    0.7,
    800,
    30,
    false,
    true,
    60
  )
  on conflict (organization_id) where is_active = true
  do nothing;

  insert into public.profiles (
    id,
    organization_id,
    full_name,
    role
  )
  values (
    v_user_id,
    v_organization_id,
    coalesce(nullif(trim(v_full_name), ''), v_email, 'Owner'),
    'owner'
  );

  insert into public.audit_logs (
    organization_id,
    actor_id,
    action,
    entity_type,
    entity_id,
    metadata
  )
  values (
    v_organization_id,
    v_user_id,
    'organization.initialized',
    'organization',
    v_organization_id,
    jsonb_build_object('source', 'welcome_onboarding')
  );

  return jsonb_build_object(
    'organization_id', v_organization_id,
    'profile_role', 'owner'
  );
end;
$$;

grant execute on function public.create_initial_organization(text, text, text, text)
to authenticated;
