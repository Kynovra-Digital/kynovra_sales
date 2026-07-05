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
    jsonb_build_object('name', 'Moda e Acessórios', 'slug', 'familia-e-pets', 'position', 4),
    jsonb_build_object('name', 'Produtos Digitais', 'slug', 'negocios-digitais', 'position', 5)
  );
$$;

grant execute on function public.storefront_primary_categories() to anon, authenticated;
