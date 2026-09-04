# Explicación de error — 2026-09-04

## Código (botón "Punch", buttom2)
```js
if (document.body.classList.container('dark-mode'))
{darkModeToggle.textContent = 'modo claro'}
  else {darkModeToggle.textContent = 'modo oscuro'}
```

Había dos errores distintos mezclados en el mismo bloque.

## Error 1 — `tipo_de_dato`
`classList.container` no existe como método; el método real es `.contains()`. Al llamar
`.container(...)` sobre `classList`, JavaScript intenta invocar algo que no es una función
→ `TypeError: ... is not a function`.

**Causa:** confusión de nombre entre "container" (contenedor, un sustantivo que no pertenece
a la API) y "contains" (el método real, que pregunta "¿esta clase está en la lista?").

## Error 2 — `referencia_no_definida`
El código usa `darkModeToggle`, una variable que nunca se declaró. El botón sí existe, pero
se guardó en la variable `btnPunch` (línea de arriba), no en `darkModeToggle`.

**Causa:** al copiar/adaptar lógica de otro lado, quedó un nombre de variable que no coincide
con el que realmente se declaró en este archivo.

## Corrección
```js
let btnPunch = document.getElementById("buttom2");
btnPunch.addEventListener("click", function() {
  document.body.classList.toggle('dark-mode');
  if (document.body.classList.contains('dark-mode')) {
    btnPunch.textContent = 'modo claro';
  } else {
    btnPunch.textContent = 'modo oscuro';
  }
});
```
Se cambió `.container` por `.contains`, y `darkModeToggle` por `btnPunch` (la variable que
realmente apunta al botón), para que el propio botón cambie su texto al presionarlo.
