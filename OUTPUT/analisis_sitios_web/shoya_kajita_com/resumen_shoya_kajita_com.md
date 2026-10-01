# Resumen — shoya-kajita.com

**URL:** https://shoya-kajita.com

Portfolio personal de Shoya Kajita, desarrollador web y creador CG en Japón. El contenido
gira en torno a su trabajo: implementación frontend con WebGL y modelado en Blender para
piezas interactivas. El home no lista proyectos directamente, funciona como una pantalla de
presentación (hero) con el texto glitch "HELLO WORLD", su nombre y el rol, que invita a
navegar a ABOUT, WORKS o ARTWORK desde un menú lateral fijo.

El enfoque es claramente experimental y autoral: muestra el oficio del propio desarrollador
(interacción por reconocimiento de mano vía cámara, modo puntero/touch alternativo, sonido
activable) más que vender un servicio. El público objetivo son estudios, reclutadores o
clientes del rubro CG/interactive dev que valoran una demo técnica como carta de presentación.

**Estructura:** nav fija a la izquierda (HOME, ABOUT, WORKS, ARTWORK) siempre visible, logo
arriba, toggles de modo de interacción ("Hand"/"Sound") abajo a la izquierda. El home en sí
es una única sección hero full-screen; el resto de las páginas (works, about, artwork) se
cargan por rutas separadas.

**UX:** ofrece dos modos de interacción explicados paso a paso (JA/EN) antes de activarlos:
control por gestos de mano (cámara) o puntero/touch convencional, con aclaraciones de
privacidad (detección local, sin guardar video) y de que los links externos no funcionan en
modo mano. Esto añade fricción inicial pero refuerza el posicionamiento técnico del autor.

**UI:** estética oscura, minimalista-editorial, con textura de fondo tipo agua/óxido en loop,
tipografía condensada en mayúsculas (Roboto Flex) y micro-interacciones (scroll suavizado,
texto distorsionado tipo glitch).
