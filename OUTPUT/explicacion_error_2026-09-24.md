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

---

## Código (credenciales.js, login rechaza admin / 123456)
```js
const credenciales = Object.freeze({
    usuario: "admin",
    hashContrasena: "123456",
});
```
Síntoma: con usuario `admin` y contraseña `123456` sale "Usuario o contraseña incorrectos".

## Tipo de error — `logica`
No hay error en consola: el código corre, pero la comparación nunca puede dar `true`
porque se comparan dos cosas de distinto formato.

**Causa:** `verificarLogin` no compara contraseña con contraseña, compara **hash con hash**:
```js
const hashEscrito = await calcularHash(contrasena); // "123456" → "8d969eef...6c92"
return hashEscrito === credenciales.hashContrasena;  // "8d969eef...6c92" === "123456" → false
```
En `hashContrasena` se guardó el texto plano `"123456"`, no su hash.

## Corrección
```js
hashContrasena: "8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92",
```
(Se obtiene con la línea que está en el comentario de credenciales.js, cambiando "NUEVA" por la contraseña.)

La idea de fondo: cuando dos valores se comparan con `===`, ambos lados tienen que pasar por
la misma transformación. Si uno se hashea (o se pasa a minúsculas, o se convierte a número)
y el otro no, nunca coinciden aunque "representen" lo mismo.
