alter table public.products
  add column if not exists discount_type text not null default 'none',
  add column if not exists discount_value numeric,
  add column if not exists is_featured boolean not null default false;

alter table public.products
  drop constraint if exists products_discount_type_check;

alter table public.products
  add constraint products_discount_type_check
  check (discount_type in ('none', 'final_price'));

create or replace function public.get_public_storefront()
returns jsonb
language sql
security definer
set search_path = public
as $$
  with active_campaigns as (
    select
      c.id,
      c.organization_id,
      c.name,
      c.slug,
      c.headline,
      c.description,
      c.banner_url,
      c.section_banner_url,
      c.starts_at,
      c.ends_at,
      c.status,
      c.created_at
    from public.campaigns c
    where c.status = 'active'
      and (c.starts_at is null or c.starts_at <= now())
      and (c.ends_at is null or c.ends_at >= now())
    order by c.starts_at desc nulls last, c.created_at desc
  ),
  sales_by_product as (
    select
      ss.product_id,
      count(sc.id)::integer as sales_count
    from public.sales_confirmations sc
    join public.sales_sessions ss on ss.id = sc.sales_session_id
    where ss.product_id is not null
    group by ss.product_id
  )
  select jsonb_build_object(
    'campaigns',
    coalesce(
      jsonb_agg(
        jsonb_build_object(
          'id', campaign_row.id,
          'name', campaign_row.name,
          'slug', campaign_row.slug,
          'headline', campaign_row.headline,
          'description', campaign_row.description,
          'banner_url', campaign_row.banner_url,
          'section_banner_url', campaign_row.section_banner_url,
          'starts_at', campaign_row.starts_at,
          'ends_at', campaign_row.ends_at,
          'status', campaign_row.status,
          'products', campaign_row.products
        )
        order by campaign_row.starts_at desc nulls last, campaign_row.created_at desc
      ),
      '[]'::jsonb
    )
  )
  from (
    select
      c.*,
      coalesce(
        (
          select jsonb_agg(
            jsonb_build_object(
              'id', p.id,
              'name', p.name,
              'slug', p.slug,
              'image_url', p.image_url,
              'category', p.category,
              'subcategory', p.subcategory,
              'price', p.price,
              'status', p.status,
              'main_benefit', p.main_benefit,
              'short_description', p.short_description,
              'public_headline', p.public_headline,
              'public_description', p.public_description,
              'public_cta', p.public_cta,
              'show_price_publicly', p.show_price_publicly,
              'support_info', p.support_info,
              'discount_type', p.discount_type,
              'discount_value', p.discount_value,
              'is_featured', p.is_featured,
              'sales_count', coalesce(sbp.sales_count, 0)
            )
            order by cp.sort_order asc, p.is_featured desc, coalesce(sbp.sales_count, 0) desc, p.created_at desc
          )
          from public.campaign_products cp
          join public.products p on p.id = cp.product_id
          left join sales_by_product sbp on sbp.product_id = p.id
          where cp.campaign_id = c.id
            and cp.organization_id = c.organization_id
            and p.organization_id = c.organization_id
            and p.status = 'active'
        ),
        '[]'::jsonb
      ) as products
    from active_campaigns c
  ) as campaign_row;
$$;

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
    image_urls,
    category,
    price,
    status,
    main_benefit,
    support_info,
    checkout_url,
    discount_type,
    discount_value,
    is_featured
  into v_product
  from public.products
  where slug = p_product_slug
    and status = 'active'
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
      image_urls,
      category,
      price,
      status,
      main_benefit,
      support_info,
      checkout_url,
      discount_type,
      discount_value,
      is_featured
    from public.products
    where status = 'active'
    order by is_featured desc, created_at desc
  ) as product_row;
$$;

grant execute on function public.get_public_storefront() to anon, authenticated;
grant execute on function public.get_public_product_by_slug(text) to anon, authenticated;
grant execute on function public.list_public_active_products() to anon, authenticated;
