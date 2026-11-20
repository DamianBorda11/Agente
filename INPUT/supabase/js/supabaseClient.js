// 2° script. Usa window.supabase (lo crea el CDN, 1° script) para conectarse
// a TU proyecto. Copia estos dos valores de: Supabase → Project Settings → API.
const SUPABASE_URL = "https://evvlbrkbftqoifhuloki.supabase.co"; // solo la base: createClient agrega /rest/v1 y /auth/v1
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV2dmxicmtiZnRxb2lmaHVsb2tpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIwODE4NzgsImV4cCI6MjEwNzY1Nzg3OH0.a863A66zgWH8TkdOLTqMl3Fm6qSc18_Xk_RhOnqQfYw";

// Se llama supabaseClient (y no supabase) porque el CDN ya ocupa el nombre
// global "supabase"; reutilizarlo con const da un SyntaxError de redeclaración.
// Al ser un const de nivel superior en un <script> normal, datos.js lo ve.
const { createClient } = supabase;

// Una sesión SEPARADA para el admin y otra para el cliente.
// Supabase guarda la sesión en localStorage bajo una clave (storageKey).
// Si las dos páginas usan la misma clave, al iniciar sesión en admin.html
// y abrir "Mi cuenta" (cliente.html), el cliente "hereda" la sesión del
// admin y muestra su perfil. Con claves distintas, cada página tiene la suya.
const esPaginaAdmin = location.pathname.endsWith('admin.html');
const CLAVE_SESION = esPaginaAdmin ? 'somniel-sesion-admin' : 'somniel-sesion-cliente';

// Borra la sesión compartida de la versión anterior (clave por defecto de
// Supabase: "sb-<id del proyecto>-auth-token"), para que no quede colgada.
try {
  localStorage.removeItem('sb-evvlbrkbftqoifhuloki-auth-token');
} catch { /* sin almacenamiento disponible: no hay nada que borrar */ }

const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { storageKey: CLAVE_SESION }
});
