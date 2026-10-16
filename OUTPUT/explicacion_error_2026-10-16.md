# Explicación de error — 2026-10-16

**Error:** `404 (Not Found)` — `PGRST205: Could not find the table 'public.productos_practica' in the schema cache`
**Tipo:** `referencia_no_definida`

## Qué pasó
- `db.from('productos_practica')` pide una tabla que **no existe** en tu proyecto de Supabase.
- `sql/schema.sql` solo crea `public.entregas`.
- Supabase convierte cada tabla en una URL (`/rest/v1/<tabla>`). Si la tabla no existe, la URL tampoco → 404.

## Concepto
Es la misma idea que `ReferenceError` en JS: usas un nombre que nunca se declaró. Aquí la "declaración" es el `create table` en SQL, no un `let`.

## Opciones
1. Consultar la tabla que sí existe: `await db.from('entregas').select('*');`
2. Crear `productos_practica` en el SQL Editor (con `grant` + `policy` para `anon`, igual que `entregas`) y, si sigue el error, recargar el schema cache: `notify pgrst, 'reload schema';`

## Resolución
- La tabla real en Supabase se llama `practica-productos` (otro orden de palabras y con guion, no guion bajo).
- Corrección: `await db.from('practica-productos').select('*');`
- A futuro: usar `snake_case` (`productos_practica`). Con guion, en SQL hay que escribir el nombre entre comillas dobles: `"practica-productos"`.
