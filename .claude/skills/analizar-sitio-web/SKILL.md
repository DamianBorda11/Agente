---
name: analizar-sitio-web
description: Analiza un sitio web de referencia y produce resumen, estructura semántica en XML y una fila para la matriz comparativa. Use when the user gives a site URL (or has one open in el browser panel) and wants a reference/competitive analysis of it.
---

Cuando se active esta skill, siempre entregás los 3 productos juntos (resumen, XML y fila de matriz)
nunca solo uno de ellos, aunque el usuario solo haya pedido "analizá este sitio".

1. **Conseguí el sitio.** Si ya hay una pestaña abierta en el browser panel con el sitio, usá esa
   pestaña directamente (no la recargues ni navegues a otro lado). Si te dieron una URL, abrila en
   el browser panel. Recorré más de una pantalla del home si hace falta scroll para ver todas las
   secciones.

2. **Inspeccioná con las herramientas del browser panel**, no adivines:
   - `get_page_text` / `read_page` para el contenido y la jerarquía semántica (header, nav, main,
     section, footer).
   - `javascript_tool` (solo lectura, para inspección) para detectar: meta tag `generator`, clases o
     globals de frameworks (`React`, `Vue`, `_next`, `window.Webflow`, etc.), librerías de animación
     cargadas (`gsap`, `AOS`, `framer-motion`, `lottie`, `ScrollTrigger`, etc.) y fuentes tipográficas
     (`font-family` computado del `body`/títulos, o links a Google Fonts/Adobe Fonts).
   - Un screenshot o `zoom` si necesitás confirmar estilo visual o tipografía a simple vista.

3. **Derivá el slug del sitio** a partir del hostname: minúsculas, sin `www.`, puntos reemplazados
   por `_` (ej. `https://www.pentagram.com/work` → `pentagram_com`). Este slug se usa para nombrar
   los 2 archivos del paso 4, así que tiene que ser el mismo en los tres entregables.

4. **Generá los 3 entregables**, siempre marcados con encabezados claros `### 1. Resumen`,
   `### 2. Estructura XML`, `### 3. Fila de matriz` tanto en tu respuesta al usuario como al
   guardarlos:

   **1. Resumen (`OUTPUT/analisis_sitios_landing/resumenes/resumen_[slug].md`)**
   Menos de 300 palabras, cubriendo: contenido del sitio, enfoque, público objetivo, estructura,
   UX y UI. Prosa corrida o con subtítulos cortos, formato `.md`.

   **2. Estructura semántica (`OUTPUT/analisis_sitios_landing/xml/estructura_[slug].xml`)**
   Usá exactamente este esquema — no inventes etiquetas nuevas, solo repetí `<section>` y
   `<enlace>` las veces que haga falta y completá los atributos y el contenido:

   ```xml
   <sitio nombre="..." url="...">
     <header>
       <logo>...</logo>
       <nav tipo="fija | hamburguesa | mega-menu | overlay-fullscreen">
         <enlace>...</enlace>
       </nav>
     </header>
     <main>
       <section tipo="hero">...</section>
       <section tipo="...">...</section>
     </main>
     <footer>
       <redes>...</redes>
       <contacto>...</contacto>
     </footer>
   </sitio>
   ```
   - `nav tipo` es un valor fijo: elegí exactamente uno de `fija`, `hamburguesa`, `mega-menu`,
     `overlay-fullscreen` (nunca inventes otro, para que la matriz sea comparable entre sitios).
   - `section tipo` describe el propósito de cada sección del home en una palabra (ej. `hero`,
     `features`, `testimonios`, `precios`, `galeria`, `equipo`, `faq`, `cta`), en el orden real en
     que aparecen.
   - El contenido de `logo`, `enlace`, `redes` y `contacto` es el texto o descripción breve de lo
     que hay ahí, no HTML crudo del sitio.

   **3. Fila de matriz (`OUTPUT/analisis_sitios_landing/matriz_comparativa.csv`)**
   Si el archivo no existe todavía, creálo con esta línea de encabezado exacta primero:
   `url ; tipo_de_sitio ; cms_o_builder ; libreria_animacion ; libreria_frontend ; patron_navegacion ; num_secciones_home ; transicion_entre_paginas ; tipografia_principal ; estilo_visual ; fortaleza_ux ; oportunidad_mejora ; nombre_archivo_md ; nombre_archivo_xml`

   Después agregá (append, sin borrar ni reordenar las filas anteriores) una fila nueva con
   exactamente esos 14 campos en ese orden, separados por `" ; "`:
   - `url` — la URL analizada.
   - `tipo_de_sitio` — ej. landing page, e-commerce, portfolio, SaaS, blog institucional.
   - `cms_o_builder` — ej. WordPress, Webflow, Framer, Shopify, custom/vanilla. Si no se puede
     determinar con evidencia, usá `no_identificado` (nunca lo inventes).
   - `libreria_animacion` — ej. GSAP, AOS, Framer Motion, Lottie, CSS-only, ninguna.
   - `libreria_frontend` — ej. React, Vue, Next.js, vanilla JS, jQuery.
   - `patron_navegacion` — el mismo valor que usaste en `nav tipo` del XML (`fija`, `hamburguesa`,
     `mega-menu` o `overlay-fullscreen`), para que quede consistente entre los dos archivos.
   - `num_secciones_home` — cantidad de `<section>` que pusiste dentro de `<main>` en el XML.
   - `transicion_entre_paginas` — ej. ninguna, fade, slide, loader animado.
   - `tipografia_principal` — nombre de la fuente tipográfica principal detectada.
   - `estilo_visual` — ej. minimalista, brutalista, corporativo, maximalista, editorial.
   - `fortaleza_ux` — una fortaleza concreta de UX, en pocas palabras.
   - `oportunidad_mejora` — una oportunidad de mejora concreta, en pocas palabras.
   - `nombre_archivo_md` — el nombre de archivo del paso 1 (ej. `resumen_pentagram_com.md`), sin la
     ruta de carpeta.
   - `nombre_archivo_xml` — el nombre de archivo del paso 2 (ej. `estructura_pentagram_com.xml`),
     sin la ruta de carpeta.

5. Si algún dato no se puede verificar con lo que viste en el sitio (ej. CMS detrás de un sitio muy
   ofuscado), decilo explícitamente con `no_identificado` en ese campo en vez de adivinar — no
   rompas el conteo de 14 campos ni el separador `" ; "` por eso.
