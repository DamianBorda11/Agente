# Explicación de error — 2026-10-22

**Error:** `42501: new row violates row-level security policy for table "practica-productos"`
**Tipo:** `logica`

## Qué pasó

La función sí envió el `INSERT` a Supabase. El servidor lo rechazó porque la política
Row Level Security (RLS) de `practica-productos` no permite que esta sesión inserte filas.
La tabla debe tener una política `INSERT` para el rol `authenticated`, y la página debe
tener una sesión activa de Supabase Auth.

```sql
grant insert on table public."practica-productos" to authenticated;

create policy "authenticated users can insert products"
on public."practica-productos"
for insert
to authenticated
with check (auth.uid() is not null);
```

La clave `anon` del cliente puede permanecer en el navegador; la política restringe la
inserción a usuarios autenticados. No se debe desactivar RLS ni exponer la clave
`service_role`. Esta política deja insertar a cualquier usuario autenticado; para limitar
cada fila a su propietario se necesitaría una columna de propietario y otra política.

Además, el listener de `btn-agregar-obj` estaba dentro del listener de `btn-traer`.
Ahora se registra al cargar el script, por separado, y el mensaje de error de Supabase
se muestra en la página.
