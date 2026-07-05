create or replace function public.storefront_primary_categories()
returns jsonb
language sql
immutable
security definer
set search_path = public
as $$
  select jsonb_build_array(
    jsonb_build_object('name', 'Tecnologia', 'slug', 'tecnologia', 'position', 1),
    jsonb_build_object('name', 'Casa e Utilidades', 'slug', 'casa-e-utilidades', 'position', 2),
    jsonb_build_object('name', 'Beleza e Bem-estar', 'slug', 'beleza-e-bem-estar', 'position', 3),
    jsonb_build_object('name', 'Família e Pets', 'slug', 'familia-e-pets', 'position', 4),
    jsonb_build_object('name', 'Negócios Digitais', 'slug', 'negocios-digitais', 'position', 5)
  );
$$;

alter table public.product_categories
  add column if not exists parent_slug text not null default 'negocios-digitais';

alter table public.product_categories
  drop constraint if exists product_categories_parent_slug_check;

alter table public.product_categories
  add constraint product_categories_parent_slug_check
  check (parent_slug in (
    'tecnologia',
    'casa-e-utilidades',
    'beleza-e-bem-estar',
    'familia-e-pets',
    'negocios-digitais'
  ));

comment on column public.product_categories.parent_slug is
  'Fixed storefront primary category slug. Primary categories are product defaults, not tenant records.';

update public.product_categories
set parent_slug = case slug
  when 'tecnologia' then 'tecnologia'
  when 'eletronicos' then 'tecnologia'
  when 'informatica' then 'tecnologia'
  when 'celulares' then 'tecnologia'
  when 'audio' then 'tecnologia'
  when 'games' then 'tecnologia'
  when 'iluminacao' then 'tecnologia'
  when 'relogios' then 'tecnologia'
  when 'seguranca' then 'tecnologia'
  when 'software' then 'tecnologia'
  when 'casa-e-utilidades' then 'casa-e-utilidades'
  when 'casa-e-cozinha' then 'casa-e-utilidades'
  when 'organizacao' then 'casa-e-utilidades'
  when 'decoracao' then 'casa-e-utilidades'
  when 'ferramentas' then 'casa-e-utilidades'
  when 'jardinagem' then 'casa-e-utilidades'
  when 'automotivo' then 'casa-e-utilidades'
  when 'viagem' then 'casa-e-utilidades'
  when 'papelaria' then 'casa-e-utilidades'
  when 'beleza-e-bem-estar' then 'beleza-e-bem-estar'
  when 'beleza' then 'beleza-e-bem-estar'
  when 'saude' then 'beleza-e-bem-estar'
  when 'fitness' then 'beleza-e-bem-estar'
  when 'moda' then 'beleza-e-bem-estar'
  when 'acessorios' then 'beleza-e-bem-estar'
  when 'familia-e-pets' then 'familia-e-pets'
  when 'infantil' then 'familia-e-pets'
  when 'pets' then 'familia-e-pets'
  when 'negocios-digitais' then 'negocios-digitais'
  when 'ecommerce' then 'negocios-digitais'
  when 'servicos-digitais' then 'negocios-digitais'
  when 'marketing-digital' then 'negocios-digitais'
  when 'outros' then 'negocios-digitais'
  else parent_slug
end;

insert into public.product_categories (organization_id, name, slug, parent_slug)
select o.id, category_row.name, category_row.slug, category_row.parent_slug
from public.organizations o
cross join (
  values
    ('Eletrônicos', 'eletronicos', 'tecnologia'),
    ('Informática', 'informatica', 'tecnologia'),
    ('Celulares', 'celulares', 'tecnologia'),
    ('Áudio', 'audio', 'tecnologia'),
    ('Games', 'games', 'tecnologia'),
    ('Iluminação', 'iluminacao', 'tecnologia'),
    ('Relógios', 'relogios', 'tecnologia'),
    ('Segurança', 'seguranca', 'tecnologia'),
    ('Software', 'software', 'tecnologia'),
    ('Casa e Cozinha', 'casa-e-cozinha', 'casa-e-utilidades'),
    ('Organização', 'organizacao', 'casa-e-utilidades'),
    ('Decoração', 'decoracao', 'casa-e-utilidades'),
    ('Ferramentas', 'ferramentas', 'casa-e-utilidades'),
    ('Jardinagem', 'jardinagem', 'casa-e-utilidades'),
    ('Automotivo', 'automotivo', 'casa-e-utilidades'),
    ('Viagem', 'viagem', 'casa-e-utilidades'),
    ('Papelaria', 'papelaria', 'casa-e-utilidades'),
    ('Beleza', 'beleza', 'beleza-e-bem-estar'),
    ('Saúde', 'saude', 'beleza-e-bem-estar'),
    ('Fitness', 'fitness', 'beleza-e-bem-estar'),
    ('Moda', 'moda', 'beleza-e-bem-estar'),
    ('Acessórios', 'acessorios', 'beleza-e-bem-estar'),
    ('Infantil', 'infantil', 'familia-e-pets'),
    ('Pets', 'pets', 'familia-e-pets'),
    ('Ecommerce', 'ecommerce', 'negocios-digitais'),
    ('Serviços Digitais', 'servicos-digitais', 'negocios-digitais'),
    ('Marketing Digital', 'marketing-digital', 'negocios-digitais'),
    ('Outros', 'outros', 'negocios-digitais')
) as category_row(name, slug, parent_slug)
on conflict (organization_id, slug) do update
set
  name = excluded.name,
  parent_slug = excluded.parent_slug;

update public.product_subcategories ps
set category_id = parent_category.id
from public.product_categories parent_category
join public.product_categories old_primary
  on old_primary.organization_id = parent_category.organization_id
  and old_primary.slug = parent_category.parent_slug
where ps.category_id = old_primary.id
  and ps.organization_id = parent_category.organization_id
  and parent_category.slug = ps.slug;

delete from public.product_categories
where slug in (
  'tecnologia',
  'casa-e-utilidades',
  'beleza-e-bem-estar',
  'familia-e-pets',
  'negocios-digitais'
);

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

grant execute on function public.storefront_primary_categories() to anon, authenticated;
grant execute on function public.get_public_storefront_categories() to anon, authenticated;
