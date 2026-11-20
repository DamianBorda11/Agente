-- =====================================================================
-- MR. SOMNIEL: reemplaza el catálogo por los 5 productos de merch.
-- Cómo usarlo: Supabase → SQL Editor → New query → pega todo → Run.
--
-- ⚠ Borra TODOS los pedidos de prueba (con sus detalles e historial) y
-- TODAS las filas de "practica-productos". Hace falta borrar primero los
-- pedidos porque detalles_pedidos.producto_id tiene "on delete restrict":
-- Postgres no deja borrar un producto que aparece en algún pedido.
-- Si quieres conservar algo: Table Editor → pedidos → Export → CSV.
--
-- begin/commit = transacción: si algún INSERT falla, los DELETE también
-- se deshacen y no pierdes tus datos.
--
-- Precio en pesos colombianos (COP) por unidad. "unidades" = stock.
-- TODO: precios y stock son valores de ejemplo — pon los reales (y
-- cámbialos igual en js/catalogo-local.js).
--
-- "img-url" usa rutas relativas (assets/art/...): funcionan porque las
-- páginas están en la misma carpeta. Si subes las imágenes a Supabase
-- Storage, reemplázalas por la URL pública desde el botón Editar del admin.
--
-- categorias va como TEXTO en formato JSON ('["posters"]'), sin tipo.
-- Postgres lo convierte solo al tipo de la columna, sea json o jsonb.
-- =====================================================================

begin;

-- 1. Pedidos viejos (de películas). historial_estados_pedido se borra
--    solo por "on delete cascade" desde pedidos.
delete from public.detalles_pedidos;
delete from public.pedidos;

-- 2. Catálogo viejo
delete from public."practica-productos";

-- 3. Catálogo nuevo
insert into public."practica-productos"
  (nombre, descripcion, precio, unidades, descuento, disponible, categorias, "img-url")
values
  ('Poster Yeyo (A3)',
   'Impresión en papel mate de 200 g, 29,7 × 42 cm. Ilustración original de @mr.somniel.',
   35000, 10, 0, true, '["posters"]', 'assets/art/art-01.jpg'),

  ('Poster Guiño (A3)',
   'Impresión en papel mate de 200 g, 29,7 × 42 cm. Fondo azul con trazos naranja y amarillo.',
   35000, 8, 0.1, true, '["posters"]', 'assets/art/art-02.jpg'),

  ('Pack de stickers Punks (x5)',
   'Cinco stickers troquelados de vinilo resistente al agua, de 6 a 8 cm cada uno.',
   12000, 30, 0, true, '["stickers"]', 'assets/art/art-05.jpg'),

  ('Cómic Somniel #1',
   'Fanzine de 24 páginas a color, tamaño media carta, grapado a mano.',
   28000, 15, 0, true, '["comics"]', 'assets/art/art-03.jpg'),

  ('Pin Dados',
   'Pin metálico esmaltado de 3 cm con broche de mariposa. Agotado por ahora.',
   10000, 0, 0, false, '["pines"]', 'assets/art/art-04.jpg');

-- 4. Documenta el nuevo significado de "cantidad" (antes eran noches de renta).
comment on column public.detalles_pedidos.cantidad is 'Unidades compradas de ese producto';

commit;

-- Para confirmar que quedaron los 5 (corre esto aparte después):
--   select id, nombre, precio, unidades, categorias from public."practica-productos" order by id;
--
-- Si sale "malformed array literal": tu columna es text[] (no json).
-- Cambia cada '["posters"]' por array['posters'].
