alter table public.sales_sessions
  add column if not exists visitor_id text,
  add column if not exists visitor_expires_at timestamptz;

create index if not exists sales_sessions_visitor_product_idx
  on public.sales_sessions (visitor_id, product_id, created_at desc)
  where visitor_id is not null;
