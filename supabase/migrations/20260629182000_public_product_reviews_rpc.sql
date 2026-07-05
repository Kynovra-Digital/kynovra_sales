create or replace function public.get_public_product_reviews(
  p_product_slug text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_product record;
begin
  select id, organization_id
    into v_product
  from public.products
  where slug = p_product_slug
    and status = 'active'
  limit 1;

  if v_product.id is null then
    return '[]'::jsonb;
  end if;

  return coalesce(
    (
      select jsonb_agg(to_jsonb(review_row))
      from (
        select
          e.id,
          e.session_type,
          e.rating,
          e.ratings,
          e.comment,
          e.created_at
        from public.evaluations e
        join public.sales_sessions ss
          on e.session_type = 'sales'
          and e.session_id = ss.id
        where ss.product_id = v_product.id
          and ss.organization_id = v_product.organization_id
          and e.organization_id = v_product.organization_id
          and e.rating is not null
        order by e.created_at desc
        limit 30
      ) as review_row
    ),
    '[]'::jsonb
  );
end;
$$;

grant execute on function public.get_public_product_reviews(text) to anon, authenticated;
