// 2° script. Usa window.supabase (lo crea el CDN, 1° script) para conectarse
// a TU proyecto. Copia estos dos valores de: Supabase → Project Settings → API.
const SUPABASE_URL = "https://evvlbrkbftqoifhuloki.supabase.co/rest/v1/";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV2dmxicmtiZnRxb2lmaHVsb2tpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIwODE4NzgsImV4cCI6MjEwNzY1Nzg3OH0.a863A66zgWH8TkdOLTqMl3Fm6qSc18_Xk_RhOnqQfYw";

// Se llama supabaseClient (y no supabase) porque el CDN ya ocupa el nombre
// global "supabase"; reutilizarlo con const da un SyntaxError de redeclaración.
// Al ser un const de nivel superior en un <script> normal, datos.js lo ve.
const { createClient } = supabase;
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
