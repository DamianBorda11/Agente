-- =====================================================================
-- VIDEOCLUB: reemplaza los productos de práctica por 10 películas.
-- Cómo usarlo: Supabase → SQL Editor → New query → pega todo → Run.
--
-- ⚠ El DELETE borra TODAS las filas actuales de "practica-productos".
-- begin/commit = transacción: si algún INSERT falla, el DELETE también
-- se deshace y no pierdes tus datos.
--
-- Renta en pesos colombianos (COP) por noche.
-- "img-url" va en null: la página dibuja una carátula VHS. Si consigues
-- el póster, pega la URL desde el botón Editar.
--
-- categorias va como TEXTO en formato JSON ('["anime", "terror"]'), sin tipo.
-- Postgres lo convierte solo al tipo de la columna, sea json o jsonb.
-- (La versión anterior usaba array[...], que es text[] y chocaba con json.)
-- =====================================================================

begin;

delete from public."practica-productos";

insert into public."practica-productos"
  (nombre, descripcion, precio, unidades, descuento, disponible, categorias, "img-url")
values
  -- ---------- Tim Burton ----------
  ('Beetlejuice (1988)',
   'Dir. Tim Burton. Una pareja de fantasmas recién fallecidos contrata a un bioexorcista desquiciado para espantar a la familia que se mudó a su casa.',
   5000, 3, 0, true, '["tim burton"]', null),

  ('Edward Scissorhands (1990)',
   'Dir. Tim Burton. Un joven creado por un inventor que murió antes de terminarlo, con tijeras en lugar de manos, intenta encajar en un suburbio.',
   5500, 2, 0, true, '["tim burton", "romance"]', null),

  ('Sleepy Hollow (1999)',
   'Dir. Tim Burton. El investigador Ichabod Crane llega a un pueblo aterrorizado por un jinete sin cabeza.',
   6000, 2, 0, false, '["tim burton", "terror"]', null),

  -- ---------- Anime ----------
  ('Akira (1988)',
   'Dir. Katsuhiro Otomo. En Neo-Tokio, años después de una guerra que destruyó la ciudad, un pandillero desarrolla poderes psíquicos que no puede controlar.',
   6000, 2, 0.1, true, '["anime"]', null),

  ('Ghost in the Shell (1995)',
   'Dir. Mamoru Oshii. La mayor Motoko Kusanagi, una cyborg de una unidad de seguridad, persigue a un hacker conocido como el Titiritero.',
   6000, 1, 0, true, '["anime"]', null),

  ('Perfect Blue (1997)',
   'Dir. Satoshi Kon. Una cantante pop deja su grupo para ser actriz y empieza a perder el límite entre realidad y fantasía mientras un acosador la sigue.',
   5500, 1, 0, false, '["anime", "terror"]', null),

  -- ---------- Terror ----------
  ('The Shining (1980)',
   'Dir. Stanley Kubrick. Jack Torrance acepta cuidar un hotel aislado durante el invierno junto a su familia, y el lugar lo va enloqueciendo.',
   5000, 3, 0, true, '["terror"]', null),

  ('A Nightmare on Elm Street (1984)',
   'Dir. Wes Craven. Freddy Krueger ataca a un grupo de adolescentes en sus sueños; si mueren soñando, mueren de verdad.',
   4500, 4, 0.2, true, '["terror"]', null),

  -- ---------- Romance ----------
  ('Dirty Dancing (1987)',
   'Dir. Emile Ardolino. En el verano de 1963, Baby se enamora de Johnny Castle, el instructor de baile del centro vacacional donde veranea su familia.',
   4500, 2, 0, true, '["romance"]', null),

  ('Ghost (1990)',
   'Dir. Jerry Zucker. Sam es asesinado y queda como fantasma; con ayuda de la médium Oda Mae intenta proteger a Molly, su pareja.',
   5000, 2, 0, false, '["romance"]', null);

commit;

-- Para confirmar que quedaron las 10 (corre esto aparte después):
--   select id, nombre, categorias from public."practica-productos" order by id;
--
-- Si sale "malformed array literal": tu columna es text[] (no json).
-- Cambia cada '["anime", "terror"]' por array['anime', 'terror'].
