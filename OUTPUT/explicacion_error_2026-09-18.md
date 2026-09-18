# Explicación de error — 2026-09-18

## Código (botón "Eliminar por nombre", button6)
```js
<button id="button6">Eliminar por nombre</button>
...
function eliminarElemento() {
   let valorBuscado = textInput.value.trim().toLowerCase();
   if (valorBuscado === "") {
     resultado.textContent = "Por favor, ingrese un valor para eliminar.";
     return;
   }
   let indice = arr.findIndex(item => item.toLowerCase() === valorBuscado);
   if (indice !== -1) {
     resultado.textContent = "Elemento eliminado de la posición:" + indice;
    arr.splice(indice, 1);
   }
   else {
     resultado.textContent = "Elemento no encontrado en el arreglo.";
   }
  }
```

## Tipo de error — `logica`
La función en sí está bien escrita: busca el índice con `findIndex` (ya normalizado con
`.toLowerCase()`, como corrigieron ayer en `buscarElemento`) y usa `splice` para eliminar
en esa posición. El problema no está adentro de la función, sino en que nunca se ejecuta.

**Causa:** `button6` nunca queda conectado a `eliminarElemento`. Compará con los otros
botones del archivo:
- `button2` → `button2.addEventListener("click", eliminarUltimo)`
- `button5` → `button5.addEventListener("click", buscarElemento)`
- `button3` → tiene `onclick="eliminarPrimero()"` directo en el HTML

`button6` no tiene ninguna de las dos cosas. Al hacer clic, el navegador no sabe que debe
llamar a `eliminarElemento`, así que la función queda declarada pero nunca corre. Por eso
"no funciona": no es que falle, es que nunca se dispara.

## Corrección
```js
const button6 = document.getElementById("button6"); // ya existía

button6.addEventListener("click", eliminarElemento);
```
Agregá esa línea junto a los demás `addEventListener` (por ejemplo, después de la línea de
`button5.addEventListener`).

La idea de fondo: declarar una función no hace que se ejecute sola. JavaScript necesita un
punto de disparo explícito — un `addEventListener`, un `onclick` en el HTML, o una llamada
directa como `mostrarLista()` al final del script. Cada botón de esta página necesita su
propio cable hacia su función; si falta ese cable, la lógica de adentro no importa.

---

## Código (botón "Cambiar elemento", button7)
```js
<button id="button7">Cambiar elemento</button>
...
function cambiarElemento() {
 let valorBuscado = textInput.value.trim().toLowerCase();
   if (valorBuscado === "") {
     resultado.textContent = "Por favor, ingrese un valor para eliminar.";
     return;
   }
   let indice = arr.findIndex(item => item.toLowerCase() === valorBuscado);
   if (indice !== -1) {
     let nuevoValor = prompt("Ingrese el nuevo valor para reemplazar '" + arr[indice] + "':");
     if (nuevoValor !== null && nuevoValor.trim() !== "") {
       arr[indice] = nuevoValor.trim().toLowerCase();
       resultado.textContent = "Elemento en la posición " + indice + " cambiado a: " + arr[indice];
       mostrarLista();
     } else {
       resultado.textContent = "No se ingresó un nuevo valor válido.";
     }
   } else {
     resultado.textContent = "Elemento no encontrado en el arreglo.";
   }
}
```

## Tipo de error — `logica`
Es exactamente el mismo problema que `eliminarElemento` (arriba, mismo día): la función
está bien escrita — busca el índice, pide el nuevo valor con `prompt`, valida que no esté
vacío y actualiza el arreglo — pero nunca corre, porque nada la dispara.

**Causa:** no existe ningún `button7.addEventListener(...)` en el script. Revisá la lista
de listeners que sí están:
```js
button2.addEventListener("click", eliminarUltimo);
button4.addEventListener("click", mostrarLista);
button5.addEventListener("click", buscarElemento);
button6.addEventListener("click", eliminarElemento);
```
`button7` no aparece ahí. Por eso al hacer clic en "Cambiar elemento" no pasa nada (y no
tira ningún error en consola — simplemente nadie llamó a la función).

## Corrección
```js
button7.addEventListener("click", cambiarElemento);
```
Agregala junto a las otras cuatro líneas de `addEventListener`.

**Para que no se repita:** cada vez que agregues un botón nuevo con su función, escribí las
dos cosas juntas (declarar el botón → escribir la función → conectar el listener) en el
mismo momento, en vez de dejar el `addEventListener` para el final. Es el mismo patrón que
te faltó hace un rato con `button6`.
