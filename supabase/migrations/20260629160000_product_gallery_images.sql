alter table public.products
  add column if not exists image_urls text[] not null default array[]::text[];

update public.products
set image_urls = array[image_url]
where image_url is not null
  and image_url <> ''
  and cardinality(image_urls) = 0;

alter table public.products
  drop constraint if exists products_image_urls_max_five;

alter table public.products
  add constraint products_image_urls_max_five
  check (cardinality(image_urls) <= 5);
