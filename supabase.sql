create table if not exists public.appointments (
  id bigint generated always as identity primary key,
  date date not null,
  title text not null,
  type_id text not null,
  group_id text,
  group_ids text[] not null default '{}',
  reuniao_numero smallint,
  created_at timestamptz not null default now()
);

alter table public.appointments enable row level security;

grant select, insert, delete on public.appointments to anon, authenticated;
grant usage, select on sequence public.appointments_id_seq to anon, authenticated;

drop policy if exists "Anyone can read appointments" on public.appointments;
create policy "Anyone can read appointments"
  on public.appointments for select
  using (true);

create table if not exists public.calendar_admins (
  user_id uuid primary key references auth.users (id) on delete cascade
);

alter table public.calendar_admins enable row level security;
revoke all on public.calendar_admins from anon, authenticated;

create or replace function public.is_calendar_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.calendar_admins
    where user_id = (select auth.uid())
  );
$$;

revoke all on function public.is_calendar_admin() from public, anon;
grant execute on function public.is_calendar_admin() to authenticated;

drop policy if exists "Admins can add appointments" on public.appointments;
create policy "Admins can add appointments"
  on public.appointments for insert
  to authenticated
  with check ((select public.is_calendar_admin()));

drop policy if exists "Admins can remove appointments" on public.appointments;
create policy "Admins can remove appointments"
  on public.appointments for delete
  to authenticated
  using ((select public.is_calendar_admin()));

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (
       select 1
       from pg_publication_tables
       where pubname = 'supabase_realtime'
         and schemaname = 'public'
         and tablename = 'appointments'
     ) then
    alter publication supabase_realtime add table public.appointments;
  end if;
end;
$$;

insert into public.calendar_admins (user_id)
values ('497dee29-69ae-4398-83e1-9bea28d589d1')
on conflict (user_id) do nothing;
