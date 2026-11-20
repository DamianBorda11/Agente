-- =====================================================================
-- ARREGLAR PEDIDOS — secciones 4.4 a 4.8 de pedidos_detalles_pedidos.sql
-- en UN solo script que se puede correr las veces que quieras.
--
-- Cómo usarlo: Supabase → SQL Editor → New query → pega TODO → Run.
-- Al final debe salir una tabla con "ok" en cada fila. Si sale un error
-- en rojo, cópialo completo: dice exactamente qué falta.
--
-- Por qué se puede repetir sin romper nada:
--   create OR REPLACE function / view → si ya existe, la reemplaza
--   drop trigger / policy IF EXISTS   → si no existe, no da error
-- NO borra tablas ni datos: solo crea funciones, triggers, la vista,
-- permisos y políticas.
-- =====================================================================


-- ---------------------------------------------------------------------
-- 0. Revisión previa: la tabla pedidos debe ser la NUEVA (con estado,
--    cliente_id...). Si es la vieja de prueba, el script se detiene aquí
--    con un mensaje claro en vez de fallar más abajo.
-- ---------------------------------------------------------------------
do $check$
begin
  if not exists (
    select 1 from information_schema.columns
     where table_schema = 'public' and table_name = 'pedidos' and column_name = 'estado'
  ) or not exists (
    select 1 from information_schema.columns
     where table_schema = 'public' and table_name = 'pedidos' and column_name = 'cliente_id'
  ) then
    raise exception 'La tabla pedidos es la versión vieja (sin columnas estado/cliente_id). Corre primero las secciones 4.1, 4.2 y 4.3 de pedidos_detalles_pedidos.sql.';
  end if;
end;
$check$;


-- ---------------------------------------------------------------------
-- 4.4 — El precio lo fija la base de datos (nunca el navegador)
-- ---------------------------------------------------------------------
create or replace function fijar_precio_unitario()
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

drop trigger if exists detalles_pedidos_fijar_precio on detalles_pedidos;
create trigger detalles_pedidos_fijar_precio
before insert on detalles_pedidos
for each row execute function fijar_precio_unitario();


-- ---------------------------------------------------------------------
-- 4.5 — Transiciones de estado e historial
-- ---------------------------------------------------------------------
create or replace function validar_transicion_estado()
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

drop trigger if exists pedidos_validar_transicion on pedidos;
create trigger pedidos_validar_transicion
before update of estado on pedidos
for each row execute function validar_transicion_estado();

create or replace function registrar_cambio_estado()
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

drop trigger if exists pedidos_historial_alta on pedidos;
create trigger pedidos_historial_alta
after insert on pedidos
for each row execute function registrar_cambio_estado();

drop trigger if exists pedidos_historial_cambio on pedidos;
create trigger pedidos_historial_cambio
after update of estado on pedidos
for each row
when (old.estado is distinct from new.estado)
execute function registrar_cambio_estado();


-- ---------------------------------------------------------------------
-- 4.6 — Confirmar el pedido: una función atómica
-- ---------------------------------------------------------------------
create or replace function confirmar_pedido(
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

revoke all on function confirmar_pedido(bigint, boolean, text, text, text) from public, anon;
grant execute on function confirmar_pedido(bigint, boolean, text, text, text) to authenticated;


-- ---------------------------------------------------------------------
-- 4.7 — Totales calculados en la base de datos
-- ---------------------------------------------------------------------
create or replace view pedidos_con_total
with (security_invoker = true)
as
select p.*, coalesce(sum(d.cantidad * d.precio_unitario), 0)::bigint as total
  from pedidos p
  left join detalles_pedidos d on d.pedido_id = p.id
 group by p.id;


-- ---------------------------------------------------------------------
-- 4.8 — Permisos por columna y políticas de RLS
-- ---------------------------------------------------------------------
alter table pedidos enable row level security;
alter table detalles_pedidos enable row level security;
alter table historial_estados_pedido enable row level security;

revoke all on pedidos, detalles_pedidos, historial_estados_pedido, pedidos_con_total from anon, authenticated;

grant select, delete on pedidos to authenticated;
grant insert (cliente_id) on pedidos to authenticated;
grant update (estado) on pedidos to authenticated;

grant select, delete on detalles_pedidos to authenticated;
grant insert (pedido_id, producto_id, cantidad) on detalles_pedidos to authenticated;
grant update (cantidad) on detalles_pedidos to authenticated;

grant select on historial_estados_pedido to authenticated;
grant select on pedidos_con_total to authenticated;

-- Políticas de pedidos
drop policy if exists "ver_pedidos" on pedidos;
create policy "ver_pedidos" on pedidos
for select to authenticated
using (
  (select auth.uid()) = cliente_id
  or exists (select 1 from admins_practica where id = (select auth.uid()))
);

drop policy if exists "crear_carrito" on pedidos;
create policy "crear_carrito" on pedidos
for insert to authenticated
with check ( (select auth.uid()) = cliente_id );

drop policy if exists "vaciar_carrito" on pedidos;
create policy "vaciar_carrito" on pedidos
for delete to authenticated
using ( (select auth.uid()) = cliente_id and estado = 'carrito' );

drop policy if exists "admin_actualiza_estado" on pedidos;
create policy "admin_actualiza_estado" on pedidos
for update to authenticated
using ( exists (select 1 from admins_practica where id = (select auth.uid())) )
with check ( exists (select 1 from admins_practica where id = (select auth.uid())) );

-- Políticas de detalles_pedidos (dependen del pedido padre)
drop policy if exists "ver_detalles" on detalles_pedidos;
create policy "ver_detalles" on detalles_pedidos
for select to authenticated
using ( exists (select 1 from pedidos p where p.id = detalles_pedidos.pedido_id) );

drop policy if exists "agregar_detalle" on detalles_pedidos;
create policy "agregar_detalle" on detalles_pedidos
for insert to authenticated
with check (
  exists (select 1 from pedidos p
          where p.id = detalles_pedidos.pedido_id
            and p.cliente_id = (select auth.uid())
            and p.estado = 'carrito')
);

drop policy if exists "cambiar_cantidad" on detalles_pedidos;
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

drop policy if exists "quitar_detalle" on detalles_pedidos;
create policy "quitar_detalle" on detalles_pedidos
for delete to authenticated
using (
  exists (select 1 from pedidos p
          where p.id = detalles_pedidos.pedido_id
            and p.cliente_id = (select auth.uid())
            and p.estado = 'carrito')
);

drop policy if exists "ver_historial_admin" on historial_estados_pedido;
create policy "ver_historial_admin" on historial_estados_pedido
for select to authenticated
using ( exists (select 1 from admins_practica where id = (select auth.uid())) );


-- ---------------------------------------------------------------------
-- 5. Que la API (PostgREST) vea ya la función y la vista nuevas.
--    Sin esto, a veces sigue diciendo "Could not find the function"
--    durante un rato aunque ya exista.
-- ---------------------------------------------------------------------
notify pgrst, 'reload schema';


-- ---------------------------------------------------------------------
-- 6. Verificación: cada fila debe decir "ok"
-- ---------------------------------------------------------------------
select 'función confirmar_pedido' as pieza,
       case when exists (select 1 from pg_proc where proname = 'confirmar_pedido') then 'ok' else 'FALTA' end as estado
union all
select 'trigger del precio',
       case when exists (select 1 from pg_trigger where tgname = 'detalles_pedidos_fijar_precio') then 'ok' else 'FALTA' end
union all
select 'vista pedidos_con_total',
       case when exists (select 1 from pg_views where schemaname = 'public' and viewname = 'pedidos_con_total') then 'ok' else 'FALTA' end
union all
select 'RLS en detalles_pedidos',
       case when (select relrowsecurity from pg_class where oid = 'public.detalles_pedidos'::regclass) then 'ok' else 'FALTA' end
union all
select 'políticas de detalles_pedidos',
       case when (select count(*) from pg_policies where schemaname = 'public' and tablename = 'detalles_pedidos') = 4 then 'ok' else 'FALTA' end;
