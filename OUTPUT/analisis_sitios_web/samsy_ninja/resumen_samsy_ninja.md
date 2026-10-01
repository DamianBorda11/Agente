# Resumen — samsy.ninja

**URL:** https://samsy.ninja

Portfolio de "SMSY-Gen02", ingeniero gráfico creativo especializado en WebGPU, WebGL y
three.js. En vez de listar proyectos en una página tradicional, el home es una escena 3D
jugable: una ciudad cyberpunk nocturna llena de carteles de neón en japonés/inglés, que se
explora moviendo un avatar tipo búho con las flechas del teclado y SPACE para saltar.

**Enfoque:** demostrar la habilidad técnica en vivo en lugar de contarla. El HUD muestra en
tiempo real el motor (WebGPU), los FPS y el estado de conexión, como si fuera un videojuego
indie o una demo técnica, no un sitio corporativo.

**Público objetivo:** estudios de experiencias interactivas, agencias creative-tech o
reclutadores del nicho WebGL/WebGPU que valoran ver el código en acción antes que un CV.

**Estructura:** no hay DOM semántico tradicional — todo el contenido vive en un único
`<canvas>` renderizado por WebGPU. Arriba, un HUD fijo con tres accesos: EXPLORE, WORKS y
ABOUT. Abajo a la izquierda, los controles del juego (flechas, SPACE). No hay scroll: es una
sola escena continua, no secciones apiladas.

**UX:** al clickear WORKS no hay carga de página ni recarga — se abre un panel tipo "pantalla"
dentro de la misma escena 3D, con un carrusel de proyectos (flechas prev/next, ej. "RTFKT
Avatar Project"). La interacción tipo juego es memorable pero exige que el visitante entienda
los controles; no hay un atajo obvio para quien solo quiere ver los proyectos rápido.

**UI:** paleta roja/negra sobre fondo oscuro, estética cyberpunk-gamer con ruido/scanlines,
tipografía display premium (forma-djr-display vía Adobe Fonts) y textos en japonés como
detalle de identidad visual.
