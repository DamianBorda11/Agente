# Bitácora de reflexiones — Agente de Talleres

Una entrada breve por sesión de clase: qué se aprendió o qué costó más, escrita al cierre de cada
sesión. **No es la bitácora del curso** (esa la lleva el profesor, en `bitacora_sesiones_curso.csv`,
fuera de esta carpeta) — esta es la reflexión personal del estudiante sobre su propio proceso.

## 2026-08-20

Hoy entendí la diferencia entre declarar una variable con `let` y usarla sin declararla — el
`ReferenceError` dejó de sentirse aleatorio en cuanto vi que siempre es la misma causa: un nombre
que nunca definí.

## 2026-08-22

Me costó organizar las referencias visuales por tema en vez de por sitio de origen. Al principio
quería agruparlas por dónde las encontré, pero agruparlas por lo que inspiran (color, tipografía,
layout) tiene más sentido para el proyecto.

## 2026-09-03

Sesión de interacción con CSS (grid con media queries + botones con event listeners para cambiar
texto, color y modo oscuro). Por ahora no sentí que aprendí algo nuevo.

## 2026-09-04

Hoy aprendí que debo cerrar los paréntesis.

## 2026-09-18

Trabajé separando `data.js` de `script.js` y armando una página de gestión (`gestion.html`) con
CRUD para los expedientes. Dos errores que me hubiera gustado entender antes de toparme con ellos:

- Pensé que si agregaba un objeto al array `cartas` desde `gestion.html`, ese cambio iba a
  aparecer solo en `index.html`. No es así: cada archivo HTML carga su propio script y arranca su
  propia copia de las variables en memoria — no hay nada compartido entre dos páginas a menos que
  yo mismo lo guarde en algún lado (en mi caso, `localStorage`). Antes pensaba que "un array" era
  una sola cosa viva en el navegador; ahora entiendo que es una cosa por documento.
- Tuve un contenedor (`#gestion-raiz`) que se veía roto — el panel de contenido quedaba
  comprimido a una franja angosta en vez de ocupar el espacio disponible. La causa fue que ese
  contenedor no tenía un ancho definido, así que el navegador lo encogía a su contenido mínimo, y
  todo lo que dependía de `width: 100%` adentro se quedaba sin referencia real. Me hubiera
  ahorrado tiempo saber que un contenedor sin ancho explícito no es "automáticamente 100% de la
  pantalla".

## 2026-09-24

Sesión de seguridad en `gestion.html` (login con hash, IIFE, pruebas de ataque desde la consola),
ids en las cartas, `renderizarObjetos()` y filtro por peligroso en `index.html`.

"Que cada día estoy más cerca de aprender a doxear."

## 2026-09-25

Sesión larga en `proyecto1`: filtros de `index.html` (slider de rango doble de ataque, select de
tipo, botón restaurar, todo visible solo con la carpeta abierta), `game.html` con login/registro
validado por regex (contraseña y email) contra `usuarios.json` + `localStorage`, pestaña de
usuarios en `gestion.html`, juego de memoria adaptado del ejemplo `EjemploJuego` y registro de
cada intento (id, fecha ISO, número de intentos, tiempo) con ids autogenerados y exportación
del JSON.

"El juego y el orden de los datos está interesante."

## 2026-10-30

Sesión en `INPUT/supabase`: catálogo del videoclub (`prueba2`) con 18 películas (Tim Burton,
anime, terror y romance), fichas tipo catálogo de alquiler, pósters de Wikipedia y sello
"RENTADA" sobre la carátula. Luego `cliente.html`: registro e inicio de sesión con Supabase Auth.
Se corrigieron el `<script>` que cargaba la API en vez de la librería, la URL con `/rest/v1/`
de más y una llave mal cerrada que dejaba el login anidado dentro del registro. Estilo oscuro
simple en `cliente.css`.

"Hasta aquí logré logearme con cliente en Supabase."

## 2026-11-05

Sesión de seguridad sobre la tabla `clientes_practica` en Supabase: comprobamos que **no tenía RLS
(Row Level Security)** activado, así que la `anon key` pública (visible en `js/supabaseClient.js` y
en el inspector → Network/Sources) daba acceso total a leer, escribir y borrar desde fuera de la
app. La idea clave: la `anon key` no es una contraseña de admin, solo identifica el rol `anon`;
quien decide qué puede hacer ese rol es RLS. Sin RLS, PostgREST deja pasar todo.

Comandos usados para observar la vulnerabilidad (PowerShell, `curl.exe`; `$KEY` = anon key):

```powershell
# LEER todos los clientes (SELECT)
curl.exe -s "https://evvlbrkbftqoifhuloki.supabase.co/rest/v1/clientes_practica?select=*" `
  -H "apikey: $KEY" -H "Authorization: Bearer $KEY"

# ESCRIBIR una fila de prueba (POST) — confirmó que la tabla aceptaba escritura sin sesión
curl.exe -s -X POST "https://evvlbrkbftqoifhuloki.supabase.co/rest/v1/clientes_practica" `
  -H "apikey: $KEY" -H "Authorization: Bearer $KEY" `
  -H "Content-Type: application/json" -H "Prefer: return=representation" `
  -d '{\"id\": \"<uuid>\", \"nombre\": \"TEST borrar\", \"correo\": \"test-rls@ejemplo.com\", \"rol\": \"cliente\"}'

# BORRAR la fila de prueba (DELETE) — siempre con filtro ?id=eq.<uuid>, nunca sin él
curl.exe -s -X DELETE "https://evvlbrkbftqoifhuloki.supabase.co/rest/v1/clientes_practica?id=eq.<uuid>" `
  -H "apikey: $KEY" -H "Authorization: Bearer $KEY"
```

Desde la consola del navegador (`db` es global): `await db.from('clientes_practica').select('*')`.
Se insertó una sola fila de prueba y se borró enseguida (verificado con `[]`): efecto neto cero
sobre los datos reales. Pendiente: aplicar `alter table ... enable row level security` + políticas
con `auth.uid() = id` para cerrar la fuga.

_(Reflexión del estudiante pendiente de anotar.)_
