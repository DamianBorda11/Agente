---
name: explicar-errores
description: Explica un mensaje de error de código en lenguaje claro, identifica su causa y la registra en WORK-MEMORY/registro_errores.csv para detectar qué temas repasar. Use when the user pastes an error message, describes a bug, or asks what concept to review based on mistakes they keep making.
---

Cuando se active esta skill:

1. Si el estudiante no pegó ya el mensaje de error completo y el fragmento de código, pídeselos
   (o usa `INPUT/fragmento_codigo_con_error.md` como ejemplo si es una demostración).
2. Identifica el tipo de error y elige exactamente uno de estos 4 valores fijos (nunca inventes
   otro ni uses texto libre, porque el paso 7 depende de que este valor sea idéntico entre casos
   del mismo tipo): `sintaxis`, `referencia_no_definida`, `tipo_de_dato`, `logica`. Explica en una
   frase qué significa ese tipo de error en general, antes de entrar al caso puntual.
3. Señala la línea o parte exacta del código que lo causa y por qué.
4. Sugiere la corrección, pero explica el concepto detrás — el objetivo es que el estudiante
   entienda, no que copie una solución.
5. Guarda una copia breve de la explicación en `OUTPUT/explicacion_error_[fecha].md`.
6. Agrega una fila nueva a `WORK-MEMORY/registro_errores.csv` (créalo con el encabezado si todavía
   no existe) con estas columnas, en este orden:
   - `fecha` — fecha de hoy.
   - `error` — el mensaje textual del error (ej. `ReferenceError: posX is not defined`).
   - `tipo_error` — el slug elegido en el paso 2 (`sintaxis` / `referencia_no_definida` /
     `tipo_de_dato` / `logica`). Nunca el mensaje textual — este campo es lo que el paso 7 agrupa,
     así que debe ser idéntico entre errores de la misma causa raíz aunque el mensaje cambie
     (ej. `posX` vs `mouseXPos` no definida son ambos `referencia_no_definida`).
   - `explicacion` — la causa general del tipo de error, en una frase.
   - `estrategia_de_acompanamiento` — cómo guiaste al estudiante (ej. "se le pidió ubicar dónde
     debía declararse la variable antes de dar la corrección").
   - `ejemplo_de_solucion` — un fragmento corto de código ya corregido.
   - `solucion` — una frase de qué se hizo para resolverlo.

   Si el archivo ya existe con un encabezado antiguo que no tiene `tipo_error`, migralo antes de
   agregar la fila nueva: agrega la columna al encabezado (después de `error`) y completa el valor
   de `tipo_error` en las filas existentes infiriéndolo de su columna `error`.
7. Revisa `WORK-MEMORY/registro_errores.csv`: si ya hay 3 o más filas con el mismo valor en la
   columna `tipo_error` (no compares el texto de la columna `error`, que varía de caso a caso),
   dilo explícitamente y sugiere qué tema repasar — esta es la parte que ayuda a mejorar el
   conocimiento, no solo a corregir el error de hoy.
