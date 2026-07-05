create or replace function public.get_dashboard_overview(
  p_period text default 'today'
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_organization_id uuid;
  v_now timestamptz := now();
  v_start timestamptz;
  v_metric_date_start date;
  v_sales_total integer := 0;
  v_support_total integer := 0;
  v_active_sales integer := 0;
  v_active_support integer := 0;
  v_sales_human integer := 0;
  v_sales_ai integer := 0;
  v_sales_waiting integer := 0;
  v_support_human integer := 0;
  v_support_ai integer := 0;
  v_support_waiting integer := 0;
  v_checkout_sent integer := 0;
  v_checkout_accessed integer := 0;
  v_confirmed_sales integer := 0;
  v_revenue numeric := 0;
  v_average_rating numeric := 0;
  v_rating_count integer := 0;
  v_vitrine_accesses integer := 0;
  v_product_views integer := 0;
  v_pre_sales integer := 0;
  v_campaign_vitrine_accesses integer := 0;
  v_campaign_product_views integer := 0;
  v_campaign_leads integer := 0;
  v_campaign_checkouts_sent integer := 0;
  v_campaign_checkouts_accessed integer := 0;
  v_campaign_sales_confirmed integer := 0;
  v_ai_usage_count integer := 0;
  v_ai_bad_count integer := 0;
  v_ai_average_latency numeric := 0;
  v_ai_success_rate numeric := 0;
  v_attendance_total integer := 0;
  v_human_sessions integer := 0;
  v_ai_sessions integer := 0;
  v_waiting_sessions integer := 0;
begin
  v_organization_id := public.current_user_organization_id();

  if v_organization_id is null then
    raise exception 'Usuário sem organização vinculada.';
  end if;

  if not (
    public.current_user_has_permission('dashboard.view')
    or public.current_user_is_operator()
    or public.current_user_is_manager()
  ) then
    raise exception 'Sem permissão para visualizar a dashboard.';
  end if;

  v_start := case p_period
    when '7d' then v_now - interval '7 days'
    when '30d' then v_now - interval '30 days'
    when 'month' then date_trunc('month', v_now)
    else date_trunc('day', v_now)
  end;
  v_metric_date_start := v_start::date;

  select
    count(*)::integer,
    count(*) filter (where status in ('accepted', 'in_progress', 'ai_takeover'))::integer,
    count(*) filter (where status in ('waiting', 'waiting_for_acceptance'))::integer,
    count(*) filter (
      where status in ('accepted', 'in_progress')
        and (handled_by_type = 'human' or accepted_by is not null)
    )::integer,
    count(*) filter (
      where status in ('ai_takeover', 'in_progress')
        and handled_by_type = 'ai'
    )::integer
  into v_sales_total, v_active_sales, v_sales_waiting, v_sales_human, v_sales_ai
  from public.sales_sessions
  where organization_id = v_organization_id
    and created_at >= v_start;

  select
    count(*)::integer,
    count(*) filter (where status in ('accepted', 'in_progress', 'ai_takeover'))::integer,
    count(*) filter (where status in ('waiting', 'waiting_for_acceptance'))::integer,
    count(*) filter (
      where status in ('accepted', 'in_progress')
        and (handled_by_type = 'human' or accepted_by is not null)
    )::integer,
    count(*) filter (
      where status in ('ai_takeover', 'in_progress')
        and handled_by_type = 'ai'
    )::integer
  into v_support_total, v_active_support, v_support_waiting, v_support_human, v_support_ai
  from public.support_sessions
  where organization_id = v_organization_id
    and created_at >= v_start;

  v_waiting_sessions := coalesce(v_sales_waiting, 0) + coalesce(v_support_waiting, 0);
  v_human_sessions := coalesce(v_sales_human, 0) + coalesce(v_support_human, 0);
  v_ai_sessions := coalesce(v_sales_ai, 0) + coalesce(v_support_ai, 0);
  v_attendance_total := coalesce(v_active_sales, 0) + coalesce(v_active_support, 0) + coalesce(v_waiting_sessions, 0);

  select
    count(*) filter (where event_type = 'checkout_sent')::integer,
    count(*) filter (where event_type = 'checkout_accessed')::integer
  into v_checkout_sent, v_checkout_accessed
  from public.checkout_events
  where organization_id = v_organization_id
    and created_at >= v_start;

  select count(*)::integer, coalesce(sum(amount), 0)
  into v_confirmed_sales, v_revenue
  from public.sales_confirmations
  where organization_id = v_organization_id
    and created_at >= v_start;

  select coalesce(round(avg(rating)::numeric, 1), 0), count(*)::integer
  into v_average_rating, v_rating_count
  from public.evaluations
  where organization_id = v_organization_id
    and created_at >= v_start
    and rating is not null;

  select
    count(*) filter (
      where event_type in ('vitrine_access', 'vitrine_view', 'campaign_view', 'landing_view', 'page_view')
    )::integer,
    count(*) filter (
      where event_type in ('product_view', 'product_access', 'product_page_view')
    )::integer,
    count(*) filter (
      where event_type in ('pre_sale_view', 'pre_sales_view', 'pre_venda_view', 'checkout_intent')
    )::integer
  into v_vitrine_accesses, v_product_views, v_pre_sales
  from public.campaign_tracking_events
  where organization_id = v_organization_id
    and created_at >= v_start;

  select
    coalesce(sum(vitrine_accesses), 0)::integer,
    coalesce(sum(product_views), 0)::integer,
    coalesce(sum(leads), 0)::integer,
    coalesce(sum(checkouts_sent), 0)::integer,
    coalesce(sum(checkouts_accessed), 0)::integer,
    coalesce(sum(sales_confirmed), 0)::integer
  into
    v_campaign_vitrine_accesses,
    v_campaign_product_views,
    v_campaign_leads,
    v_campaign_checkouts_sent,
    v_campaign_checkouts_accessed,
    v_campaign_sales_confirmed
  from public.campaign_metrics_daily
  where organization_id = v_organization_id
    and metric_date >= v_metric_date_start;

  v_vitrine_accesses := greatest(v_vitrine_accesses, v_campaign_vitrine_accesses);
  v_product_views := greatest(v_product_views, v_campaign_product_views);
  v_sales_total := greatest(v_sales_total, v_campaign_leads);
  v_checkout_sent := greatest(v_checkout_sent, v_campaign_checkouts_sent);
  v_checkout_accessed := greatest(v_checkout_accessed, v_campaign_checkouts_accessed);
  v_confirmed_sales := greatest(v_confirmed_sales, v_campaign_sales_confirmed);

  select count(*)::integer
  into v_ai_usage_count
  from public.ai_agent_usage
  where organization_id = v_organization_id
    and created_at >= v_start;

  select count(*)::integer
  into v_ai_bad_count
  from public.ai_bad_responses
  where organization_id = v_organization_id
    and created_at >= v_start;

  select coalesce(round(avg(latency_ms)::numeric), 0)
  into v_ai_average_latency
  from public.ai_provider_logs
  where organization_id = v_organization_id
    and created_at >= v_start
    and latency_ms is not null;

  v_ai_success_rate := case
    when v_ai_usage_count > 0 then greatest(0, round(((v_ai_usage_count - v_ai_bad_count)::numeric / v_ai_usage_count::numeric) * 100, 1))
    else 0
  end;

  return jsonb_build_object(
    'generatedAt', v_now,
    'period', p_period,
    'metrics', jsonb_build_array(
      jsonb_build_object('title', 'Vendas Confirmadas', 'description', 'Confirmadas no Supabase', 'glow', 'blue', 'trend', null, 'value', v_confirmed_sales::text),
      jsonb_build_object('title', 'Receita Estimada', 'description', 'Receita confirmada', 'glow', 'purple', 'trend', null, 'value', 'R$ ' || trim(to_char(coalesce(v_revenue, 0), 'FM999G999G999G990D00'))),
      jsonb_build_object('title', 'Checkouts Enviados', 'description', 'Eventos registrados', 'glow', 'blue', 'trend', null, 'value', v_checkout_sent::text),
      jsonb_build_object('title', 'Checkouts Acessados', 'description', 'Alta intenção', 'glow', 'purple', 'trend', null, 'value', v_checkout_accessed::text),
      jsonb_build_object('title', 'Atendimentos Ativos', 'description', 'Sessões em progresso', 'glow', 'green', 'trend', null, 'value', v_active_sales::text),
      jsonb_build_object('title', 'Suportes Ativos', 'description', 'Chamados em progresso', 'glow', 'purple', 'trend', null, 'value', v_active_support::text),
      jsonb_build_object('title', 'Avaliação Média', 'description', v_rating_count::text || ' avaliações registradas', 'glow', 'purple', 'trend', null, 'value', replace(v_average_rating::text, '.', ',')),
      jsonb_build_object('title', 'Taxa de Conversão', 'description', 'Vendas / salas', 'glow', 'blue', 'trend', null, 'value', case when v_sales_total > 0 then round((v_confirmed_sales::numeric / v_sales_total::numeric) * 100)::text || '%' else '0%' end)
    ),
    'funnel', jsonb_build_array(
      jsonb_build_object('caption', 'acessos', 'icon', 'Eye', 'label', 'Vitrine', 'value', v_vitrine_accesses::text),
      jsonb_build_object('caption', 'visualizações', 'icon', 'Box', 'label', 'Produto', 'value', v_product_views::text),
      jsonb_build_object('caption', 'acessos', 'icon', 'FileText', 'label', 'Pré-venda', 'value', v_pre_sales::text),
      jsonb_build_object('caption', 'leads', 'icon', 'UsersRound', 'label', 'Sala', 'value', v_sales_total::text),
      jsonb_build_object('caption', 'envios', 'icon', 'Send', 'label', 'Checkout enviado', 'value', v_checkout_sent::text),
      jsonb_build_object('caption', 'cliques', 'icon', 'Eye', 'label', 'Checkout acessado', 'value', v_checkout_accessed::text),
      jsonb_build_object('caption', 'vendas', 'icon', 'ShoppingCart', 'label', 'Venda confirmada', 'value', v_confirmed_sales::text)
    ),
    'attendance', jsonb_build_object(
      'total', v_attendance_total,
      'breakdown', jsonb_build_array(
        jsonb_build_object('label', 'Humanos', 'value', coalesce(v_human_sessions, 0), 'color', 'bg-primary'),
        jsonb_build_object('label', 'IA Automática', 'value', coalesce(v_ai_sessions, 0), 'color', 'bg-kynovra-tech-purple'),
        jsonb_build_object('label', 'Aguardando', 'value', coalesce(v_waiting_sessions, 0), 'color', 'bg-kynovra-digital-green')
      )
    ),
    'aiPerformance', jsonb_build_object(
      'items', jsonb_build_array(
        jsonb_build_object('label', 'Chamadas IA', 'value', v_ai_usage_count::text, 'delta', null, 'tone', 'green'),
        jsonb_build_object('label', 'Taxa de acerto', 'value', replace(v_ai_success_rate::text, '.', ',') || '%', 'delta', null, 'tone', 'green'),
        jsonb_build_object('label', 'Latência média', 'value', case when v_ai_average_latency > 0 then (v_ai_average_latency::integer)::text || 'ms' else '0ms' end, 'delta', null, 'tone', 'green'),
        jsonb_build_object('label', 'Respostas ruins', 'value', v_ai_bad_count::text, 'delta', null, 'tone', case when v_ai_bad_count > 0 then 'red' else 'green' end)
      )
    ),
    'events', coalesce(
      (
        select jsonb_agg(to_jsonb(notification) order by notification.created_at desc)
        from (
          select *
          from public.notifications
          where organization_id = v_organization_id
            and created_at >= v_start
            and (recipient_id is null or recipient_id = auth.uid() or public.current_user_is_manager())
          order by created_at desc
          limit 8
        ) notification
      ),
      '[]'::jsonb
    )
  );
end;
$$;

revoke all on function public.get_dashboard_overview(text) from public;
grant execute on function public.get_dashboard_overview(text) to authenticated;
