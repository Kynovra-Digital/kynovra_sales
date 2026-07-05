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
      c.starts_at,
      c.ends_at,
      c.status,
      c.created_at
    from public.campaigns c
    where c.status = 'active'
      and (c.starts_at is null or c.starts_at <= now())
      and (c.ends_at is null or c.ends_at >= now())
    order by c.starts_at desc nulls last, c.created_at desc
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
              'price', p.price,
              'status', p.status,
              'main_benefit', p.main_benefit,
              'short_description', p.short_description,
              'public_headline', p.public_headline,
              'public_description', p.public_description,
              'public_cta', p.public_cta,
              'show_price_publicly', p.show_price_publicly,
              'support_info', p.support_info
            )
            order by cp.sort_order asc, p.created_at desc
          )
          from public.campaign_products cp
          join public.products p on p.id = cp.product_id
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

grant execute on function public.get_public_storefront() to anon, authenticated;
