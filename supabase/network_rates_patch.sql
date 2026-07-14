create table if not exists public.network_rates (
  rate_key text primary key,
  program text not null,
  rate numeric(7,3) not null,
  apr numeric(7,3) not null,
  active boolean default true,
  sort_order integer default 0,
  updated_at timestamptz default now()
);

insert into public.network_rates (rate_key, program, rate, apr, active, sort_order) values
  ('30_fixed', '30-Year Fixed', 6.413, 6.425, true, 1),
  ('30_fha', '30-Year FHA', 6.250, 7.273, true, 2),
  ('15_fixed', '15-Year Fixed', 5.897, 5.926, true, 3)
on conflict (rate_key) do nothing;
