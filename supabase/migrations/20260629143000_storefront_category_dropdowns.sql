create or replace function public.get_public_storefront_categories()
returns jsonb
language sql
security definer
set search_path = public
as $$
  with official_categories(slug, position) as (
    values
      ('tecnologia', 1),
      ('casa-e-utilidades', 2),
      ('beleza-e-bem-estar', 3),
      ('familia-e-pets', 4),
      ('negocios-digitais', 5)
  ),
  storefront_organization as (
    select c.organization_id
    from public.campaigns c
    where c.status = 'active'
      and (c.starts_at is null or c.starts_at <= now())
      and (c.ends_at is null or c.ends_at >= now())
    group by c.organization_id
    order by count(*) desc, c.organization_id asc
    limit 1
  ),
  fallback_organization as (
    select o.id as organization_id
    from public.organizations o
    order by o.created_at asc
    limit 1
  ),
  selected_organization as (
    select organization_id from storefront_organization
    union all
    select organization_id from fallback_organization
    where not exists (select 1 from storefront_organization)
    limit 1
  ),
  categories as (
    select
      pc.name,
      pc.slug,
      pc.parent_slug,
      oc.position
    from public.product_categories pc
    join official_categories oc on oc.slug = pc.parent_slug
    join selected_organization so on so.organization_id = pc.organization_id
  )
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', primary_row.slug,
        'name', primary_row.name,
        'slug', primary_row.slug,
        'subcategories', primary_row.subcategories
      )
      order by primary_row.position asc
    ),
    '[]'::jsonb
  )
  from (
    select
      case oc.slug
        when 'tecnologia' then 'Tecnologia'
        when 'casa-e-utilidades' then 'Casa e Utilidades'
        when 'beleza-e-bem-estar' then 'Beleza e Bem-estar'
        when 'familia-e-pets' then 'Moda e Acessórios'
        when 'negocios-digitais' then 'Produtos Digitais'
        else oc.slug
      end as name,
      oc.slug,
      oc.position,
      coalesce(
        jsonb_agg(
          jsonb_build_object(
            'id', c.slug,
            'name', c.name,
            'slug', c.slug
          )
          order by c.name asc
        ) filter (where c.slug is not null),
        '[]'::jsonb
      ) as subcategories
    from official_categories oc
    left join categories c on c.parent_slug = oc.slug
    group by oc.slug, oc.position
  ) as primary_row;
$$;

grant execute on function public.get_public_storefront_categories() to anon, authenticated;
