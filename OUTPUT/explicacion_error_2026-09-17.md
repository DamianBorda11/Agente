# Explicación de error — 2026-09-17

## Código (botón "Buscar", button5)
```js
function buscarElemento() {
  const valorBuscado = textInput.value.trim().toLowerCase();
  const indice = arr.indexOf(valorBuscado);
  if (indice !== -1) {
    resultado.textContent = "Elemento encontrado en la posición: " + indice;
  } else {
    resultado.textContent = "Elemento no encontrado en el arreglo.";
  }
}
```

## Tipo de error — `logica`
El código corre sin fallar y `button5` sí está bien vinculado — el problema es que la
condición nunca es verdadera para elementos que sí existen.

**Causa:** `indexOf` compara strings de forma exacta, incluyendo mayúsculas/minúsculas.
`valorBuscado` pasa por `.toLowerCase()`, pero `arr` guarda los nombres con su
capitalización original (`"Light"`, `"Misa"`, `"Kira"`...). Buscar `"light"` nunca va
a coincidir con `"Light"` porque para JavaScript son strings distintos.

## Corrección
```js
function buscarElemento() {
  const valorBuscado = textInput.value.trim().toLowerCase();
  const indice = arr.findIndex(item => item.toLowerCase() === valorBuscado);
  if (indice !== -1) {
    resultado.textContent = "Elemento encontrado en la posición: " + indice;
  } else {
    resultado.textContent = "Elemento no encontrado en el arreglo.";
  }
}
```
La idea es normalizar los dos lados de la comparación de la misma forma: si vas a
comparar en minúsculas, tanto el valor buscado como cada elemento del arreglo deben
pasar por `.toLowerCase()` antes de comparar. `findIndex` permite aplicar esa
transformación elemento por elemento, cosa que `indexOf` no permite.
