-- RPC function used by the admin database page to show table sizes on disk
create or replace function get_table_sizes()
returns table (table_name text, total_bytes bigint)
language sql
security definer
as $$
  select
    relname::text as table_name,
    pg_total_relation_size(c.oid) as total_bytes
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public'
    and c.relkind = 'r'
  order by total_bytes desc;
$$;
