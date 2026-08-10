-- Prototype (open) policies. Tighten before production.
alter table resources   enable row level security;
alter table accounts    enable row level security;
alter table allocations enable row level security;
alter table rfps        enable row level security;
alter table logs        enable row level security;
do $$ declare t text; begin
  foreach t in array array['resources','accounts','allocations','rfps','logs'] loop
    execute format('drop policy if exists p_all_%1$s on %1$s;', t);
    execute format('create policy p_all_%1$s on %1$s for all to anon, authenticated using (true) with check (true);', t);
  end loop; end $$;
