# Explicación de error — 2026-08-27

## Código
```js
for (let i = 0 ; i > 10 ; i++){
  console.log (i+1);
}
```

## Tipo de error
`logica` — no hay excepción ni mensaje de error; el bucle simplemente no ejecuta nada.

## Causa
La condición del `for` (`i > 10`) se evalúa antes de cada vuelta. Como `i` arranca en `0`,
`0 > 10` es `false` desde el primer chequeo, así que el bucle nunca entra.

## Corrección
```js
for (let i = 0; i < 10; i++) {
  console.log(i + 1);
}
```
Para contar hacia arriba desde 0, la condición debe ser `i < 10` (¿sigo por debajo del
límite?), no `i > 10` (¿ya lo superé?).
