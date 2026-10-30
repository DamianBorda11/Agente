# Explicación de error — 2026-10-30

**Archivos:** `INPUT/supabase/cliente.html`, `js/supabaseClient.js`, `js/cliente.js`

## Error
```
Uncaught ReferenceError: supabase is not defined    at supabaseClient.js:9:26
Uncaught (in promise) ReferenceError: db is not defined    at registrarCliente (cliente.js:18:25)
```

**Tipo:** `referencia_no_definida`: el código usa un nombre que en ese momento no existe en ningún alcance (scope).

## Causa
Los dos errores vienen de lo mismo, como una cadena:

1. `cliente.html:7` carga como `<script>` la URL de la API del proyecto (`https://evvlbrkbftqoifhuloki.supabase.co/rest/v1/`). Esa URL no es la librería: devuelve JSON y no código JavaScript, así que nunca se crea la variable global `supabase`.
2. `supabaseClient.js:9` (`const { createClient } = supabase;`) se rompe. El script se detiene ahí y la línea 10 (`const db = ...`) no se ejecuta nunca.
3. `cliente.js:18` usa `db`, que nunca se creó, y por eso sale el segundo error.

**Concepto:** en la consola, arregla primero el error que salió primero. Los errores que vienen después muchas veces son consecuencia del primero.

## Corrección
```html
<!-- cliente.html: la librería, no la API del proyecto -->
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
```

Hay un segundo problema que todavía no se ve. En `supabaseClient.js:3` se agregó `/rest/v1/` a `SUPABASE_URL`. `createClient` ya le agrega `/rest/v1` y `/auth/v1` por su cuenta, así que la URL tiene que ser solo la base:
```js
const SUPABASE_URL = "https://evvlbrkbftqoifhuloki.supabase.co";
```

---

# Explicación de error 2 — 2026-10-30

**Archivo:** `INPUT/supabase/js/cliente.js`

## Síntoma
Al hacer clic en "Iniciar sesión" la página se recarga, no se inicia la sesión y la consola queda vacía, sin ningún error.

**Tipo:** `logica`: el código se ejecuta sin errores, pero hace algo distinto a lo que se quería.

## Causa
Faltaba el `});` que cierra el listener de `form-registro` (después del `if/else`). El `});` del final del archivo lo cerraba, así que `iniciarSesion`, el listener de `form-login` y `mostrarEstadoSesion()` quedaron **dentro** del listener de registro:
- El listener de login solo se conectaba después de que alguien se registrara.
- Sin listener no se llama a `preventDefault()`, así que el `<form>` hace lo que hace por defecto: recarga la página. Por eso se borra la consola.

**Concepto:** cada `{` abre un bloque (scope). Si se cierra en el lugar equivocado, el código cambia de lugar sin que salga ningún error de sintaxis. Formatear el documento (Shift+Alt+F) e indentar el código hace visible esa estructura.

## Corrección
```js
document.getElementById('form-registro').addEventListener('submit', async (event) => {
  // ...
  if (cliente) { ... } else { ... }
}); // ← este cierre faltaba

async function iniciarSesion(...) { ... } // ahora a nivel superior
```
