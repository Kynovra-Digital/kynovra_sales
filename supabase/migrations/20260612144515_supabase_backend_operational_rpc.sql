create extension if not exists pgcrypto with schema extensions;

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  organization_id uuid not null,
  full_name text,
  role text not null default 'attendance',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_role_check
    check (role in ('owner', 'management', 'supervisor', 'attendance', 'support'))
);

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  name text not null,
  email text not null,
  phone text,
  source text not null default 'product_public_link',
  product_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.sales_sessions
  add column if not exists handled_by_type text,
  add column if not exists ai_takeover_at timestamptz;

alter table public.support_sessions
  add column if not exists handled_by_type text,
  add column if not exists ai_takeover_at timestamptz;

create table if not exists public.sales_messages (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  session_id uuid not null references public.sales_sessions(id) on delete cascade,
  sender_type text not null,
  sender_id text,
  content text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint sales_messages_sender_type_check
    check (sender_type in ('customer', 'human', 'ai', 'system'))
);

create table if not exists public.support_messages (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  session_id uuid not null references public.support_sessions(id) on delete cascade,
  sender_type text not null,
  sender_id text,
  content text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint support_messages_sender_type_check
    check (sender_type in ('customer', 'human', 'ai', 'system'))
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  recipient_id uuid,
  type text not null,
  title text not null,
  body text,
  entity_type text,
  entity_id uuid,
  read_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  actor_id uuid,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.ai_usage_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  agent_id uuid,
  session_type text,
  session_id uuid,
  provider text,
  model text,
  input_tokens integer not null default 0,
  output_tokens integer not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists profiles_organization_idx
  on public.profiles (organization_id);

create index if not exists leads_organization_product_idx
  on public.leads (organization_id, product_id);

create index if not exists sales_messages_session_created_idx
  on public.sales_messages (session_id, created_at);

create index if not exists support_messages_session_created_idx
  on public.support_messages (session_id, created_at);

create index if not exists notifications_recipient_unread_idx
  on public.notifications (organization_id, recipient_id, read_at);

create index if not exists audit_logs_entity_idx
  on public.audit_logs (organization_id, entity_type, entity_id, created_at);

alter table public.organizations enable row level security;
alter table public.profiles enable row level security;
alter table public.leads enable row level security;
alter table public.sales_messages enable row level security;
alter table public.support_messages enable row level security;
alter table public.notifications enable row level security;
alter table public.audit_logs enable row level security;
alter table public.ai_usage_events enable row level security;

create or replace function public.current_user_organization_id()
returns uuid
language sql
stable
security definer
set search_path = public, auth
as $$
  select organization_id
  from public.profiles
  where id = auth.uid()
  limit 1
$$;

create or replace function public.current_user_is_operator()
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
      and role in ('owner', 'management', 'supervisor', 'attendance', 'support')
  )
$$;

create or replace function public.current_user_is_manager()
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
      and role in ('owner', 'management', 'supervisor')
  )
$$;

drop policy if exists "Profiles can read organization profiles" on public.profiles;
create policy "Profiles can read organization profiles"
on public.profiles
for select
to authenticated
using (organization_id = public.current_user_organization_id());

drop policy if exists "Products visible to organization users" on public.products;
create policy "Products visible to organization users"
on public.products
for select
to authenticated
using (organization_id = public.current_user_organization_id());

drop policy if exists "Leads visible to organization users" on public.leads;
create policy "Leads visible to organization users"
on public.leads
for select
to authenticated
using (organization_id = public.current_user_organization_id());

drop policy if exists "Sales queue visible to operators" on public.sales_sessions;
create policy "Sales queue visible to operators"
on public.sales_sessions
for select
to authenticated
using (
  organization_id = public.current_user_organization_id()
  and (
    (status = 'waiting' and accepted_by is null and public.current_user_is_operator())
    or accepted_by = auth.uid()::text
    or public.current_user_is_manager()
  )
);

drop policy if exists "Support queue visible to operators" on public.support_sessions;
create policy "Support queue visible to operators"
on public.support_sessions
for select
to authenticated
using (
  organization_id = public.current_user_organization_id()
  and (
    (status = 'waiting' and accepted_by is null and public.current_user_is_operator())
    or accepted_by = auth.uid()::text
    or public.current_user_is_manager()
  )
);

drop policy if exists "Sales messages visible to organization users" on public.sales_messages;
create policy "Sales messages visible to organization users"
on public.sales_messages
for select
to authenticated
using (organization_id = public.current_user_organization_id());

drop policy if exists "Support messages visible to organization users" on public.support_messages;
create policy "Support messages visible to organization users"
on public.support_messages
for select
to authenticated
using (organization_id = public.current_user_organization_id());

drop policy if exists "Notifications visible to recipient or managers" on public.notifications;
create policy "Notifications visible to recipient or managers"
on public.notifications
for select
to authenticated
using (
  organization_id = public.current_user_organization_id()
  and (recipient_id is null or recipient_id = auth.uid() or public.current_user_is_manager())
);

drop policy if exists "Audit logs visible to managers" on public.audit_logs;
create policy "Audit logs visible to managers"
on public.audit_logs
for select
to authenticated
using (
  organization_id = public.current_user_organization_id()
  and public.current_user_is_manager()
);

drop policy if exists "AI settings visible to managers" on public.organization_ai_settings;
create policy "AI settings visible to managers"
on public.organization_ai_settings
for select
to authenticated
using (
  organization_id = public.current_user_organization_id()
  and public.current_user_is_manager()
);

create or replace function public.create_sales_session_from_product(
  p_product_slug text,
  p_customer_name text,
  p_customer_email text
)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_product record;
  v_lead_id uuid;
  v_session_id uuid;
  v_public_token text;
begin
  if nullif(trim(p_customer_name), '') is null then
    raise exception 'Informe o nome.';
  end if;

  if nullif(trim(p_customer_email), '') is null then
    raise exception 'Informe o e-mail.';
  end if;

  select *
    into v_product
  from public.products
  where slug = p_product_slug
    and status = 'active'
  limit 1;

  if v_product.id is null then
    raise exception 'Produto indisponível.';
  end if;

  insert into public.leads (
    organization_id,
    name,
    email,
    source,
    product_id
  )
  values (
    v_product.organization_id,
    trim(p_customer_name),
    lower(trim(p_customer_email)),
    'product_public_link',
    v_product.id
  )
  returning id into v_lead_id;

  v_public_token := encode(extensions.gen_random_bytes(24), 'hex');

  insert into public.sales_sessions (
    organization_id,
    product_id,
    lead_id,
    session_code,
    public_token,
    status,
    accepted_by,
    handled_by_type,
    source
  )
  values (
    v_product.organization_id,
    v_product.id,
    v_lead_id,
    'SALE-' || upper(substr(v_public_token, 1, 10)),
    v_public_token,
    'waiting',
    null,
    null,
    'product_public_link'
  )
  returning id into v_session_id;

  insert into public.notifications (
    organization_id,
    type,
    title,
    body,
    entity_type,
    entity_id,
    metadata
  )
  values (
    v_product.organization_id,
    'sales_ticket.created',
    'Novo atendimento de venda',
    'Um cliente iniciou atendimento para ' || v_product.name || '.',
    'sales_session',
    v_session_id,
    jsonb_build_object('source', 'product_public_link')
  );

  return jsonb_build_object(
    'session_id', v_session_id,
    'public_token', v_public_token
  );
end;
$$;

create or replace function public.create_support_session(
  p_product_id uuid,
  p_reason text,
  p_custom_reason text default null,
  p_initial_message text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_product record;
  v_session_id uuid;
  v_public_token text;
  v_continuity_code text;
begin
  select *
    into v_product
  from public.products
  where id = p_product_id
  limit 1;

  if v_product.id is null then
    raise exception 'Produto não encontrado.';
  end if;

  v_public_token := encode(extensions.gen_random_bytes(24), 'hex');
  v_continuity_code := 'KS-' || upper(substr(encode(extensions.gen_random_bytes(9), 'hex'), 1, 12));

  insert into public.support_sessions (
    organization_id,
    product_id,
    public_token,
    continuity_code,
    reason,
    custom_reason,
    status,
    accepted_by,
    handled_by_type,
    source
  )
  values (
    v_product.organization_id,
    v_product.id,
    v_public_token,
    v_continuity_code,
    trim(p_reason),
    nullif(trim(coalesce(p_custom_reason, '')), ''),
    'waiting',
    null,
    null,
    'support_public_link'
  )
  returning id into v_session_id;

  if nullif(trim(coalesce(p_initial_message, '')), '') is not null then
    insert into public.support_messages (
      organization_id,
      session_id,
      sender_type,
      content
    )
    values (
      v_product.organization_id,
      v_session_id,
      'customer',
      trim(p_initial_message)
    );
  end if;

  insert into public.notifications (
    organization_id,
    type,
    title,
    body,
    entity_type,
    entity_id,
    metadata
  )
  values (
    v_product.organization_id,
    'support_ticket.created',
    'Novo suporte aberto',
    'Um cliente iniciou suporte para ' || v_product.name || '.',
    'support_session',
    v_session_id,
    jsonb_build_object('source', 'support_public_link', 'reason', p_reason)
  );

  return jsonb_build_object(
    'session_id', v_session_id,
    'public_token', v_public_token,
    'continuity_code', v_continuity_code
  );
end;
$$;

create or replace function public.accept_sales_ticket(p_session_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_session record;
begin
  update public.sales_sessions
  set
    status = 'accepted',
    accepted_by = auth.uid()::text,
    accepted_at = now(),
    handled_by_type = 'human',
    updated_at = now()
  where id = p_session_id
    and status = 'waiting'
    and accepted_by is null
    and organization_id = public.current_user_organization_id()
  returning * into v_session;

  if v_session.id is null then
    return jsonb_build_object(
      'success', false,
      'message', 'Este ticket já foi aceito por outro atendente.'
    );
  end if;

  insert into public.audit_logs (
    organization_id,
    actor_id,
    action,
    entity_type,
    entity_id,
    metadata
  )
  values (
    v_session.organization_id,
    auth.uid(),
    'sales_ticket.accepted',
    'sales_session',
    v_session.id,
    '{}'::jsonb
  );

  return jsonb_build_object('success', true, 'session_id', v_session.id);
end;
$$;

create or replace function public.open_sales_ticket(p_session_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_session record;
begin
  update public.sales_sessions
  set
    status = 'in_progress',
    opened_at = coalesce(opened_at, now()),
    updated_at = now()
  where id = p_session_id
    and accepted_by = auth.uid()::text
    and status in ('accepted', 'in_progress')
  returning * into v_session;

  if v_session.id is null then
    raise exception 'Você precisa aceitar este ticket antes de abrir.';
  end if;

  return jsonb_build_object('success', true, 'session_id', v_session.id);
end;
$$;

create or replace function public.close_sales_ticket(p_session_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_session record;
begin
  update public.sales_sessions
  set
    status = 'closed',
    closed_at = now(),
    updated_at = now()
  where id = p_session_id
    and (
      accepted_by = auth.uid()::text
      or public.current_user_is_manager()
    )
  returning * into v_session;

  if v_session.id is null then
    raise exception 'Sem permissão para encerrar este atendimento.';
  end if;

  insert into public.audit_logs (
    organization_id,
    actor_id,
    action,
    entity_type,
    entity_id
  )
  values (
    v_session.organization_id,
    auth.uid(),
    'sales_ticket.closed',
    'sales_session',
    v_session.id
  );

  return jsonb_build_object('success', true);
end;
$$;

create or replace function public.transfer_sales_ticket(p_session_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_session record;
begin
  update public.sales_sessions
  set
    status = 'waiting',
    accepted_by = null,
    accepted_at = null,
    opened_at = null,
    handled_by_type = null,
    updated_at = now()
  where id = p_session_id
    and (
      accepted_by = auth.uid()::text
      or public.current_user_is_manager()
    )
  returning * into v_session;

  if v_session.id is null then
    raise exception 'Sem permissão para transferir este atendimento.';
  end if;

  insert into public.audit_logs (
    organization_id,
    actor_id,
    action,
    entity_type,
    entity_id
  )
  values (
    v_session.organization_id,
    auth.uid(),
    'sales_ticket.transferred',
    'sales_session',
    v_session.id
  );

  return jsonb_build_object('success', true);
end;
$$;

create or replace function public.accept_support_ticket(p_session_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_session record;
begin
  update public.support_sessions
  set
    status = 'accepted',
    accepted_by = auth.uid()::text,
    accepted_at = now(),
    handled_by_type = 'human',
    updated_at = now()
  where id = p_session_id
    and status = 'waiting'
    and accepted_by is null
    and organization_id = public.current_user_organization_id()
  returning * into v_session;

  if v_session.id is null then
    return jsonb_build_object(
      'success', false,
      'message', 'Este suporte já foi aceito por outro atendente.'
    );
  end if;

  insert into public.audit_logs (
    organization_id,
    actor_id,
    action,
    entity_type,
    entity_id
  )
  values (
    v_session.organization_id,
    auth.uid(),
    'support_ticket.accepted',
    'support_session',
    v_session.id
  );

  return jsonb_build_object('success', true, 'session_id', v_session.id);
end;
$$;

create or replace function public.open_support_ticket(p_session_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_session record;
begin
  update public.support_sessions
  set
    status = 'in_progress',
    opened_at = coalesce(opened_at, now()),
    updated_at = now()
  where id = p_session_id
    and accepted_by = auth.uid()::text
    and status in ('accepted', 'in_progress')
  returning * into v_session;

  if v_session.id is null then
    raise exception 'Você precisa aceitar este suporte antes de abrir.';
  end if;

  return jsonb_build_object('success', true, 'session_id', v_session.id);
end;
$$;

create or replace function public.close_support_ticket(p_session_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_session record;
begin
  update public.support_sessions
  set
    status = 'closed',
    closed_at = now(),
    updated_at = now()
  where id = p_session_id
    and (
      accepted_by = auth.uid()::text
      or public.current_user_is_manager()
    )
  returning * into v_session;

  if v_session.id is null then
    raise exception 'Sem permissão para encerrar este suporte.';
  end if;

  insert into public.audit_logs (
    organization_id,
    actor_id,
    action,
    entity_type,
    entity_id
  )
  values (
    v_session.organization_id,
    auth.uid(),
    'support_ticket.closed',
    'support_session',
    v_session.id
  );

  return jsonb_build_object('success', true);
end;
$$;

create or replace function public.transfer_support_ticket(p_session_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_session record;
begin
  update public.support_sessions
  set
    status = 'waiting',
    accepted_by = null,
    accepted_at = null,
    opened_at = null,
    handled_by_type = null,
    updated_at = now()
  where id = p_session_id
    and (
      accepted_by = auth.uid()::text
      or public.current_user_is_manager()
    )
  returning * into v_session;

  if v_session.id is null then
    raise exception 'Sem permissão para transferir este suporte.';
  end if;

  insert into public.audit_logs (
    organization_id,
    actor_id,
    action,
    entity_type,
    entity_id
  )
  values (
    v_session.organization_id,
    auth.uid(),
    'support_ticket.transferred',
    'support_session',
    v_session.id
  );

  return jsonb_build_object('success', true);
end;
$$;

create or replace function public.generate_continuity_code(p_session_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, auth, extensions
as $$
declare
  v_session record;
  v_code text;
begin
  v_code := 'KS-' || upper(substr(encode(extensions.gen_random_bytes(9), 'hex'), 1, 12));

  update public.support_sessions
  set
    continuity_code = v_code,
    updated_at = now()
  where id = p_session_id
    and (
      accepted_by = auth.uid()::text
      or public.current_user_is_manager()
    )
  returning * into v_session;

  if v_session.id is null then
    raise exception 'Sem permissão para gerar código.';
  end if;

  insert into public.audit_logs (
    organization_id,
    actor_id,
    action,
    entity_type,
    entity_id,
    metadata
  )
  values (
    v_session.organization_id,
    auth.uid(),
    'support_continuity_code.generated',
    'support_session',
    v_session.id,
    jsonb_build_object('continuity_code', v_code)
  );

  return jsonb_build_object('success', true, 'continuity_code', v_code);
end;
$$;

create or replace function public.validate_continuity_code(p_code text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_session record;
begin
  select id, public_token, status, closed_at
    into v_session
  from public.support_sessions
  where continuity_code = upper(trim(p_code))
  limit 1;

  if v_session.id is null then
    return jsonb_build_object('success', false, 'message', 'Código inválido.');
  end if;

  if v_session.status = 'closed' then
    return jsonb_build_object(
      'success', false,
      'expired', true,
      'message', 'Atendimento encerrado por limite de tempo.'
    );
  end if;

  return jsonb_build_object(
    'success', true,
    'public_token', v_session.public_token
  );
end;
$$;

create or replace function public.get_public_sales_session(p_public_token text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_session record;
begin
  select
    ss.id,
    ss.public_token,
    ss.status,
    ss.handled_by_type,
    ss.opened_at,
    ss.closed_at,
    p.name as product_name,
    p.image_url as product_image_url,
    p.main_benefit,
    p.checkout_url
  into v_session
  from public.sales_sessions ss
  join public.products p on p.id = ss.product_id
  where ss.public_token = p_public_token
  limit 1;

  if v_session.id is null then
    raise exception 'Sala não encontrada.';
  end if;

  return to_jsonb(v_session);
end;
$$;

create or replace function public.get_public_support_session(p_public_token text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_session record;
begin
  select
    ss.id,
    ss.public_token,
    ss.status,
    ss.handled_by_type,
    ss.reason,
    ss.continuity_code,
    ss.opened_at,
    ss.closed_at,
    p.name as product_name,
    p.image_url as product_image_url,
    p.support_info
  into v_session
  from public.support_sessions ss
  left join public.products p on p.id = ss.product_id
  where ss.public_token = p_public_token
  limit 1;

  if v_session.id is null then
    raise exception 'Sala não encontrada.';
  end if;

  return to_jsonb(v_session);
end;
$$;

create or replace function public.send_public_sales_message(
  p_public_token text,
  p_content text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_session record;
  v_message_id uuid;
begin
  select *
    into v_session
  from public.sales_sessions
  where public_token = p_public_token
  limit 1;

  if v_session.id is null then
    raise exception 'Sala não encontrada.';
  end if;

  if v_session.status <> 'in_progress' then
    raise exception 'Aguarde o atendimento iniciar antes de enviar mensagem.';
  end if;

  insert into public.sales_messages (
    organization_id,
    session_id,
    sender_type,
    content
  )
  values (
    v_session.organization_id,
    v_session.id,
    'customer',
    trim(p_content)
  )
  returning id into v_message_id;

  return jsonb_build_object('success', true, 'message_id', v_message_id);
end;
$$;

create or replace function public.send_public_support_message(
  p_public_token text,
  p_content text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_session record;
  v_message_id uuid;
begin
  select *
    into v_session
  from public.support_sessions
  where public_token = p_public_token
  limit 1;

  if v_session.id is null then
    raise exception 'Sala não encontrada.';
  end if;

  if v_session.status <> 'in_progress' then
    raise exception 'Aguarde o atendimento iniciar antes de enviar mensagem.';
  end if;

  insert into public.support_messages (
    organization_id,
    session_id,
    sender_type,
    content
  )
  values (
    v_session.organization_id,
    v_session.id,
    'customer',
    trim(p_content)
  )
  returning id into v_message_id;

  return jsonb_build_object('success', true, 'message_id', v_message_id);
end;
$$;

create or replace function public.ai_takeover_waiting_sessions(
  p_timeout_seconds integer default 45
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sales_count integer := 0;
  v_support_count integer := 0;
begin
  with updated_sales as (
    update public.sales_sessions
    set
      status = 'in_progress',
      accepted_by = 'ai',
      accepted_at = now(),
      opened_at = now(),
      ai_takeover_at = now(),
      handled_by_type = 'ai',
      updated_at = now()
    where status = 'waiting'
      and accepted_by is null
      and created_at <= now() - make_interval(secs => p_timeout_seconds)
    returning id, organization_id
  ),
  inserted_sales_messages as (
    insert into public.sales_messages (
      organization_id,
      session_id,
      sender_type,
      content
    )
    select
      organization_id,
      id,
      'ai',
      'Olá, tudo bem? Seu atendimento já foi iniciado. Vou te ajudar com as informações do produto e a finalização da compra.'
    from updated_sales
    returning id
  )
  select count(*) into v_sales_count from inserted_sales_messages;

  with updated_support as (
    update public.support_sessions
    set
      status = 'in_progress',
      accepted_by = 'ai',
      accepted_at = now(),
      opened_at = now(),
      ai_takeover_at = now(),
      handled_by_type = 'ai',
      updated_at = now()
    where status = 'waiting'
      and accepted_by is null
      and created_at <= now() - make_interval(secs => p_timeout_seconds)
    returning id, organization_id
  ),
  inserted_support_messages as (
    insert into public.support_messages (
      organization_id,
      session_id,
      sender_type,
      content
    )
    select
      organization_id,
      id,
      'ai',
      'Olá, tudo bem? Seu atendimento já foi iniciado. Vou analisar sua solicitação e te ajudar com os próximos passos.'
    from updated_support
    returning id
  )
  select count(*) into v_support_count from inserted_support_messages;

  return jsonb_build_object(
    'success', true,
    'sales_takeovers', v_sales_count,
    'support_takeovers', v_support_count
  );
end;
$$;

create or replace function public.save_global_ai_settings(
  p_organization_id uuid,
  p_provider text,
  p_model text,
  p_api_key_encrypted text default null,
  p_base_url text default null,
  p_temperature numeric default 0.7,
  p_max_output_tokens integer default 800,
  p_timeout_seconds integer default 30,
  p_fallback_enabled boolean default false,
  p_fallback_provider text default null,
  p_fallback_model text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_settings_id uuid;
begin
  if not public.current_user_is_manager() then
    raise exception 'Sem permissão para alterar configurações de IA.';
  end if;

  if p_organization_id <> public.current_user_organization_id() then
    raise exception 'Organização inválida.';
  end if;

  insert into public.organization_ai_settings (
    organization_id,
    provider,
    model,
    api_key_encrypted,
    base_url,
    temperature,
    max_output_tokens,
    timeout_seconds,
    fallback_enabled,
    fallback_provider,
    fallback_model
  )
  values (
    p_organization_id,
    p_provider,
    p_model,
    p_api_key_encrypted,
    p_base_url,
    p_temperature,
    p_max_output_tokens,
    p_timeout_seconds,
    p_fallback_enabled,
    p_fallback_provider,
    p_fallback_model
  )
  on conflict (organization_id) where is_active = true
  do update set
    provider = excluded.provider,
    model = excluded.model,
    api_key_encrypted = coalesce(excluded.api_key_encrypted, public.organization_ai_settings.api_key_encrypted),
    base_url = excluded.base_url,
    temperature = excluded.temperature,
    max_output_tokens = excluded.max_output_tokens,
    timeout_seconds = excluded.timeout_seconds,
    fallback_enabled = excluded.fallback_enabled,
    fallback_provider = excluded.fallback_provider,
    fallback_model = excluded.fallback_model,
    updated_at = now()
  returning id into v_settings_id;

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
    'ai_settings.updated',
    'organization_ai_settings',
    v_settings_id,
    jsonb_build_object('provider', p_provider, 'model', p_model)
  );

  return jsonb_build_object('success', true, 'settings_id', v_settings_id);
end;
$$;

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'sales_sessions'
    ) then
      alter publication supabase_realtime add table public.sales_sessions;
    end if;

    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'support_sessions'
    ) then
      alter publication supabase_realtime add table public.support_sessions;
    end if;

    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'sales_messages'
    ) then
      alter publication supabase_realtime add table public.sales_messages;
    end if;

    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'support_messages'
    ) then
      alter publication supabase_realtime add table public.support_messages;
    end if;

    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'notifications'
    ) then
      alter publication supabase_realtime add table public.notifications;
    end if;
  end if;
end;
$$;
