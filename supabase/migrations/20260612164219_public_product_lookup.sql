create or replace function public.get_public_product_by_slug(
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
  select
    id,
    name,
    slug,
    image_url,
    category,
    price,
    status,
    main_benefit,
    support_info,
    checkout_url
  into v_product
  from public.products
  where slug = p_product_slug
  limit 1;

  if v_product.id is null then
    raise exception 'Produto não encontrado.';
  end if;

  return to_jsonb(v_product);
end;
$$;

create or replace function public.list_public_active_products()
returns jsonb
language sql
security definer
set search_path = public
as $$
  select coalesce(jsonb_agg(to_jsonb(product_row)), '[]'::jsonb)
  from (
    select
      id,
      name,
      slug,
      image_url,
      category,
      price,
      status,
      main_benefit,
      support_info,
      checkout_url
    from public.products
    where status = 'active'
    order by created_at desc
  ) as product_row;
$$;

grant execute on function public.get_public_product_by_slug(text) to anon, authenticated;
grant execute on function public.list_public_active_products() to anon, authenticated;
