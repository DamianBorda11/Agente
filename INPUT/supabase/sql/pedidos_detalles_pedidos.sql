-- =====================================================================
-- CARRITO CONECTADO A pedidos + detalles_pedidos (diseño de 2 tablas)
-- Adaptado de guia_carrito_pedidos_supabase.pdf a los nombres reales de
-- este proyecto:
--   productos_practica (de la guía) -> "practica-productos" (con guion,
--     por eso va entre comillas dobles en todo este script)
--   admin_practica (de la guía)     -> admins_practica
--   clientes_practica               -> igual
--
-- CÓMO CORRERLO: Supabase -> SQL Editor -> botón "+" para una consulta
-- NUEVA por cada sección (4.1, 4.2, 4.3...). No las pegues todas juntas
-- en una sola consulta -- así lo pide la guía, y si una falla sabrás
-- exactamente cuál.
--
-- Antes de la sección 4.1 (que BORRA la tabla pedidos actual):
--   1. Nadie debe estar usando la tienda.
--   2. Si quieres conservar algo de la tabla pedidos actual, expórtalo
--      primero: Table Editor -> pedidos -> Export -> CSV.
--   3. Aplica también el código nuevo (galeria.js, cliente.js, los HTML)
--      en el mismo momento: el código viejo deja de funcionar apenas
--      borres la tabla.
-- =====================================================================


-- =====================================================================
-- 4.1 — Retirar la tabla de prueba (una fila por producto)
-- IRREVERSIBLE: borra sus filas, sus políticas de RLS, sus restricciones
-- y su secuencia. Si algún objeto dependiera de ella, Postgres se niega
-- y te dice cuál (no hace falta "cascade").
-- =====================================================================
drop table pedidos;


-- =====================================================================
-- 4.2 — Las tres tablas nuevas
-- =====================================================================
create table pedidos (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  cliente_id uuid not null references clientes_practica (id) on delete restrict,
  estado text not null default 'carrito'
    check (estado in ('carrito', 'confirmado', 'enviado', 'entregado', 'cancelado')),
  envio boolean not null default false,
  direccion text,
  telefono text,
  observacion text,
  confirmado_en timestamptz
);

create table detalles_pedidos (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  pedido_id bigint not null references pedidos (id) on delete cascade,
  producto_id bigint not null references "practica-productos" (id) on delete restrict,
  cantidad bigint not null check (cantidad > 0), -- en este proyecto, "cantidad" = noches de renta
  precio_unitario bigint not null check (precio_unitario >= 0),
  unique (pedido_id, producto_id)
);

create table historial_estados_pedido (
  id bigint generated always as identity primary key,
  pedido_id bigint not null references pedidos (id) on delete cascade,
  estado_anterior text,
  estado_nuevo text not null,
  cambiado_por uuid,
  cambiado_en timestamptz not null default now()
);


-- =====================================================================
-- 4.3 — Índices
-- =====================================================================
-- Un cliente solo puede tener UN carrito abierto (índice único parcial).
create unique index pedidos_un_carrito_por_cliente on pedidos (cliente_id) where estado = 'carrito';

-- Postgres no crea índices automáticamente en las columnas de una clave foránea.
create index pedidos_cliente_id_idx on pedidos (cliente_id);
create index detalles_pedidos_producto_id_idx on detalles_pedidos (producto_id);
create index historial_estados_pedido_pedido_id_idx on historial_estados_pedido (pedido_id);


-- =====================================================================
-- 4.4 — El precio lo fija la base de datos (nunca el navegador)
-- =====================================================================
create function fijar_precio_unitario()
returns trigger
language plpgsql
set search_path = public
as $fn$
declare
  v_precio bigint;
begin
  select round(p.precio * (1 - coalesce(p.descuento, 0)))::bigint
    into v_precio
    from "practica-productos" p
   where p.id = new.producto_id;

  if v_precio is null then
    raise exception 'Producto % no encontrado', new.producto_id;
  end if;

  new.precio_unitario := v_precio;
  return new;
end;
$fn$;

create trigger detalles_pedidos_fijar_precio
before insert on detalles_pedidos
for each row execute function fijar_precio_unitario();


-- =====================================================================
-- 4.5 — Transiciones de estado e historial
-- =====================================================================
create function validar_transicion_estado()
returns trigger
language plpgsql
set search_path = public
as $fn$
begin
  if new.estado = old.estado then
    return new;
  end if;

  if (old.estado, new.estado) in (
        ('carrito', 'confirmado'), ('carrito', 'cancelado'),
        ('confirmado', 'enviado'), ('confirmado', 'cancelado'),
        ('enviado', 'entregado'), ('enviado', 'cancelado')) then
    return new;
  end if;

  raise exception 'Transicion de estado no permitida: % -> %', old.estado, new.estado;
end;
$fn$;

create trigger pedidos_validar_transicion
before update of estado on pedidos
for each row execute function validar_transicion_estado();

create function registrar_cambio_estado()
returns trigger
language plpgsql
security definer
set search_path = public
as $fn$
begin
  if tg_op = 'INSERT' then
    insert into historial_estados_pedido (pedido_id, estado_anterior, estado_nuevo, cambiado_por)
    values (new.id, null, new.estado, auth.uid());
  else
    insert into historial_estados_pedido (pedido_id, estado_anterior, estado_nuevo, cambiado_por)
    values (new.id, old.estado, new.estado, auth.uid());
  end if;
  return new;
end;
$fn$;

create trigger pedidos_historial_alta
after insert on pedidos
for each row execute function registrar_cambio_estado();

create trigger pedidos_historial_cambio
after update of estado on pedidos
for each row
when (old.estado is distinct from new.estado)
execute function registrar_cambio_estado();


-- =====================================================================
-- 4.6 — Confirmar el pedido: una función atómica
-- =====================================================================
create function confirmar_pedido(
  p_pedido_id bigint,
  p_envio boolean,
  p_direccion text,
  p_telefono text,
  p_observacion text
)
returns pedidos
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_pedido pedidos;
  d record;
begin
  if auth.uid() is null then
    raise exception 'Debes iniciar sesion';
  end if;

  -- Bloquea la fila del pedido: dos confirmaciones simultáneas no se pisan.
  select * into v_pedido
    from pedidos
   where id = p_pedido_id and cliente_id = auth.uid() and estado = 'carrito'
   for update;

  if not found then
    raise exception 'Pedido no encontrado o ya confirmado';
  end if;

  if not exists (select 1 from detalles_pedidos where pedido_id = p_pedido_id) then
    raise exception 'El carrito esta vacio';
  end if;

  if p_envio and (coalesce(trim(p_direccion), '') = '' or coalesce(trim(p_telefono), '') = '') then
    raise exception 'Para envio a domicilio se requieren direccion y telefono';
  end if;

  -- Descuenta el stock, siempre en el mismo orden (evita bloqueos cruzados).
  for d in
    select producto_id, cantidad from detalles_pedidos where pedido_id = p_pedido_id order by producto_id
  loop
    update "practica-productos"
       set unidades = unidades - d.cantidad
     where id = d.producto_id and disponible and unidades >= d.cantidad;

    if not found then
      raise exception 'Stock insuficiente para el producto %', d.producto_id;
    end if;
  end loop;

  -- Precio definitivo: el de este momento (mientras estaba en el carrito era provisional).
  update detalles_pedidos dp
     set precio_unitario = round(p.precio * (1 - coalesce(p.descuento, 0)))::bigint
    from "practica-productos" p
   where p.id = dp.producto_id and dp.pedido_id = p_pedido_id;

  update pedidos
     set estado = 'confirmado',
         envio = p_envio,
         direccion = nullif(trim(p_direccion), ''),
         telefono = nullif(trim(p_telefono), ''),
         observacion = nullif(trim(p_observacion), ''),
         confirmado_en = now()
   where id = p_pedido_id
   returning * into v_pedido;

  return v_pedido;
end;
$fn$;

-- Por defecto cualquiera podría llamarla: se limita a usuarios con sesión.
revoke all on function confirmar_pedido(bigint, boolean, text, text, text) from public, anon;
grant execute on function confirmar_pedido(bigint, boolean, text, text, text) to authenticated;


-- =====================================================================
-- 4.7 — Totales calculados en la base de datos
-- =====================================================================
create view pedidos_con_total
with (security_invoker = true)
as
select p.*, coalesce(sum(d.cantidad * d.precio_unitario), 0)::bigint as total
  from pedidos p
  left join detalles_pedidos d on d.pedido_id = p.id
 group by p.id;


-- =====================================================================
-- 4.8 — Permisos por columna y políticas de RLS
-- =====================================================================
alter table pedidos enable row level security;
alter table detalles_pedidos enable row level security;
alter table historial_estados_pedido enable row level security;

revoke all on pedidos, detalles_pedidos, historial_estados_pedido, pedidos_con_total from anon, authenticated;

grant select, delete on pedidos to authenticated;
grant insert (cliente_id) on pedidos to authenticated;
grant update (estado) on pedidos to authenticated; -- solo lo usará el admin (ver políticas)

grant select, delete on detalles_pedidos to authenticated;
grant insert (pedido_id, producto_id, cantidad) on detalles_pedidos to authenticated;
grant update (cantidad) on detalles_pedidos to authenticated;

grant select on historial_estados_pedido to authenticated;
grant select on pedidos_con_total to authenticated;

-- Políticas de pedidos. El cliente no tiene ninguna política de UPDATE:
-- confirma con confirmar_pedido().
create policy "ver_pedidos" on pedidos
for select to authenticated
using (
  (select auth.uid()) = cliente_id
  or exists (select 1 from admins_practica where id = (select auth.uid()))
);

create policy "crear_carrito" on pedidos
for insert to authenticated
with check ( (select auth.uid()) = cliente_id );

create policy "vaciar_carrito" on pedidos
for delete to authenticated
using ( (select auth.uid()) = cliente_id and estado = 'carrito' );

create policy "admin_actualiza_estado" on pedidos
for update to authenticated
using ( exists (select 1 from admins_practica where id = (select auth.uid())) )
with check ( exists (select 1 from admins_practica where id = (select auth.uid())) );

-- Políticas de detalles_pedidos: dependen del pedido padre.
create policy "ver_detalles" on detalles_pedidos
for select to authenticated
using ( exists (select 1 from pedidos p where p.id = detalles_pedidos.pedido_id) );

create policy "agregar_detalle" on detalles_pedidos
for insert to authenticated
with check (
  exists (select 1 from pedidos p
          where p.id = detalles_pedidos.pedido_id
            and p.cliente_id = (select auth.uid())
            and p.estado = 'carrito')
);

create policy "cambiar_cantidad" on detalles_pedidos
for update to authenticated
using (
  exists (select 1 from pedidos p
          where p.id = detalles_pedidos.pedido_id
            and p.cliente_id = (select auth.uid())
            and p.estado = 'carrito')
)
with check (
  exists (select 1 from pedidos p
          where p.id = detalles_pedidos.pedido_id
            and p.cliente_id = (select auth.uid())
            and p.estado = 'carrito')
);

create policy "quitar_detalle" on detalles_pedidos
for delete to authenticated
using (
  exists (select 1 from pedidos p
          where p.id = detalles_pedidos.pedido_id
            and p.cliente_id = (select auth.uid())
            and p.estado = 'carrito')
);

-- Política del historial: solo lo lee un administrador.
create policy "ver_historial_admin" on historial_estados_pedido
for select to authenticated
using ( exists (select 1 from admins_practica where id = (select auth.uid())) );


-- =====================================================================
-- 4.9 — Para confirmar que todo quedó bien (opcional, de solo lectura)
-- =====================================================================
-- select relname as tabla, relrowsecurity as rls_activo
--   from pg_class
--  where relnamespace = 'public'::regnamespace and relkind = 'r'
--    and relname in ('pedidos', 'detalles_pedidos', 'historial_estados_pedido');
--
-- select tablename, policyname, cmd from pg_policies
--  where schemaname = 'public' and tablename in ('pedidos', 'detalles_pedidos', 'historial_estados_pedido')
--  order by tablename, policyname;
