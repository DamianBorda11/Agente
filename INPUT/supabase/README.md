# Entregas con Supabase

## 1. Crear el proyecto
1. Entra a https://supabase.com e inicia sesión (con GitHub sirve).
2. **New project** → nombre, contraseña de la base de datos (guárdala) y región más cercana.
3. Espera a que termine de crearse (1–2 min).

## 2. Crear la tabla
1. Menú izquierdo → **SQL Editor** → **New query**.
2. Pega todo `sql/schema.sql` y dale **Run**.
3. Verifica en **Table Editor** que aparece `entregas`.

## 3. Conectar el front
1. **Project Settings → API** (o el botón **Connect**).
2. Copia **Project URL** y la **anon / publishable key**.
3. Pégalas en `js/supabaseClient.js`.
4. Nunca uses la `service_role` / secret key en el navegador: salta todas las políticas RLS.

## 4. Probar
Abre `index.html` con Live Server (o directo en el navegador). Si algo falla, abre la consola (F12).

## Estructura
| Archivo | Responsabilidad |
|---|---|
| `index.html` | Formulario, tabla y orden de los scripts |
| `js/supabaseClient.js` | Crea `supabaseClient` |
| `js/datos.js` | CRUD contra la tabla (sin DOM) |
| `js/gestion.js` | DOM y eventos (sin Supabase directo) |
| `sql/schema.sql` | Tabla + políticas RLS |

## Errores típicos
| Síntoma | Causa |
|---|---|
| `ReferenceError: supabaseClient is not defined` | Scripts en otro orden, o ruta `js/...` mal escrita |
| `Identifier 'supabase' has already been declared` | Declaraste `const supabase`; usa `supabaseClient` |
| La tabla sale vacía sin error | RLS activo sin política de `select` |
| `new row violates row-level security policy` | Falta la política de `insert` |
| `Invalid API key` | URL o anon key mal copiadas |

## Permitir crear productos solo a usuarios autenticados

El error `42501: new row violates row-level security policy` significa que RLS está
bloqueando el `INSERT`. Para `practica-productos`, ejecuta este SQL en **SQL Editor**
si no existe ya una política equivalente:

```sql
grant insert on table public."practica-productos" to authenticated;

create policy "authenticated users can insert products"
on public."practica-productos"
for insert
to authenticated
with check (auth.uid() is not null);
```

Esta política permite insertar a cualquier usuario con una sesión autenticada; no
crea un flujo de inicio de sesión por sí sola. La página debe iniciar sesión con
Supabase Auth antes de llamar a `insert()`. No desactives RLS ni uses la `service_role`
en el navegador.
