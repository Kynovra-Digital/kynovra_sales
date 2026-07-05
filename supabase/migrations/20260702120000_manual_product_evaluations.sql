-- Adiciona product_id à tabela evaluations para permitir avaliações manuais de produtos
alter table public.evaluations
add column if not exists product_id uuid references public.products(id) on delete cascade;

-- Cria índice para melhor performance nas consultas por produto
create index if not exists evaluations_product_id_idx on public.evaluations(product_id);

-- RPC para inserir avaliação manual de produto
create or replace function public.insert_manual_product_evaluation(
  p_product_id uuid,
  p_rating numeric,
  p_comment text default null,
  p_ratings jsonb default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_organization_id uuid;
  v_evaluation record;
begin
  if auth.uid() is null then
    raise exception 'Usuário não autenticado';
  end if;

  -- Busca organization_id do produto
  select organization_id
    into v_organization_id
  from public.products
  where id = p_product_id;

  if v_organization_id is null then
    raise exception 'Produto não encontrado';
  end if;

  if v_organization_id is distinct from public.current_user_organization_id() then
    raise exception 'Sem permissão para avaliar este produto';
  end if;

  if not (
    public.current_user_is_manager()
    or public.current_user_has_permission('products.manage')
    or public.current_user_has_permission('evaluations.manage')
  ) then
    raise exception 'Sem permissão para inserir avaliação manual';
  end if;

  -- Valida rating (0-5)
  if p_rating < 0 or p_rating > 5 then
    raise exception 'Rating deve estar entre 0 e 5';
  end if;

  -- Insere avaliação
  insert into public.evaluations (
    organization_id,
    product_id,
    rating,
    comment,
    ratings,
    session_id,
    session_type,
    resolved_status
  ) values (
    v_organization_id,
    p_product_id,
    p_rating,
    p_comment,
    p_ratings,
    gen_random_uuid(), -- session_id único para avaliações manuais
    'manual',
    'resolved'
  )
  returning * into v_evaluation;

  return jsonb_build_object(
    'success', true,
    'evaluation', to_jsonb(v_evaluation)
  );
end;
$$;

-- Grant de execução para authenticated (admin)
grant execute on function public.insert_manual_product_evaluation(uuid, numeric, text, jsonb) to authenticated;

-- Comment na função
comment on function public.insert_manual_product_evaluation is 'Insere avaliação manual de produto. Requer product_id, rating (0-5), comment (opcional) e ratings (opcional).';
