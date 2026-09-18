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
