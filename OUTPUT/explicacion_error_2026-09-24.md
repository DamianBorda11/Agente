# Explicación de error — 2026-09-24

## Código (consola de gestion.html, vaciar `cartas`)
```js
for (let i = 1; i < cartas.length; i++) {
    cartas.pop()}
```
Síntoma: no da error, pero no borra todas las cartas (quedan aprox. la mitad).

## Tipo de error — `logica`
El código es válido y corre, pero no hace lo que se esperaba: la condición del `for`
depende de un valor que el propio cuerpo del bucle va modificando.

**Causa:** en cada vuelta pasan dos cosas a la vez:
- `i` sube en 1 (`i++`)
- `cartas.length` baja en 1 (`pop()`)

Se acercan de a 2 por vuelta, así que se cruzan a la mitad. Traza con 19 cartas:

| Vuelta | `i` | `cartas.length` antes | ¿`i < length`? |
|---|---|---|---|
| 1 | 1 | 19 | sí → pop |
| 2 | 2 | 18 | sí → pop |
| … | … | … | … |
| 9 | 9 | 11 | sí → pop |
| 10 | 10 | 10 | **no → termina** |

Resultado: 9 borradas, 10 siguen ahí. Además `i` empieza en 1 (un intento menos) y el
cambio no se guarda en `localStorage` ni se redibuja la tabla.

## Corrección
```js
while (cartas.length > 0) {
    cartas.pop();
}
localStorage.setItem("cartas", JSON.stringify(cartas));
iniciarGestion();
```
Si solo querías quitar las 10 del ciclo anterior, el número de vueltas debe ser fijo:
```js
for (let i = 0; i < 10; i++) {
    cartas.pop();
}
```

La idea de fondo: la condición de un bucle se vuelve a evaluar en cada vuelta. Si el cuerpo
modifica algo que la condición lee (aquí `cartas.length`), el límite se mueve mientras
iteras. Con un `for` y un contador fijo, el límite no debe depender de lo que estás cambiando.
