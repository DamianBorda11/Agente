-- Pegar completo en Supabase → SQL Editor → Run.

create table public.entregas (
    id            bigint generated always as identity primary key,
    taller        text not null,
    titulo        text not null,
    fecha_entrega date not null,
    estado        text not null default 'pendiente'
                  check (estado in ('pendiente', 'en_progreso', 'entregada')),
    created_at    timestamptz not null default now()
);

-- Con RLS activo, la tabla está cerrada hasta que una política la abra.
-- Sin estas políticas, el select desde el navegador devuelve [] sin error.
alter table public.entregas enable row level security;

-- OJO: esto deja la tabla abierta a cualquiera que tenga la anon key
-- (que es pública: va en el JS). Sirve para practicar; para algo real,
-- usar Supabase Auth y cambiar "to anon" por "to authenticated".
grant select, insert, update, delete on public.entregas to anon;

create policy "anon puede leer" on public.entregas
    for select to anon using (true);

create policy "anon puede crear" on public.entregas
    for insert to anon with check (true);

create policy "anon puede actualizar" on public.entregas
    for update to anon using (true) with check (true);

create policy "anon puede eliminar" on public.entregas
    for delete to anon using (true);
