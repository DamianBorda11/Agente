// Copia de las cartas para esta página (solo lectura: index.html no edita nada).
const cartas = cargarCartas();

// Cartas que se recorren con Anterior/Siguiente según el filtro elegido.
// Empieza con todas; aplicarFiltro() la reemplaza por la lista filtrada.
let cartasVisibles = cartas;

// Límites del slider de ataque, sacados de las cartas reales (así se adaptan
// a las que se creen en gestion.html). Si no hay cartas, Math.min() de nada
// da Infinity, por eso en ese caso usamos 0–100.
const valoresAtaque = cartas.map((carta) => carta.ataque);
const ATAQUE_LIMITE_MIN = cartas.length ? Math.min(...valoresAtaque) : 0;
const ATAQUE_LIMITE_MAX = cartas.length ? Math.max(...valoresAtaque) : 100;

// Tipos distintos que existen en las cartas, en orden alfabético. Un Set
// no guarda repetidos: pasamos los 9 tipos (con "Oscuro" varias veces) y
// quedan solo los distintos. Con [...] lo volvemos array para poder ordenarlo.
// localeCompare con "es" ordena bien las tildes (Demoníaco antes que Digital).
const tiposDisponibles = [...new Set(cartas.map((carta) => carta.tipo))]
    .sort((a, b) => a.localeCompare(b, "es"));

// Estado de los tres filtros. Se guardan por separado para que cambiar uno
// no borre a los otros: los tres se aplican juntos.
let filtroActual = "todos";
let ataqueDesde = ATAQUE_LIMITE_MIN;
let ataqueHasta = ATAQUE_LIMITE_MAX;
let filtroTipo = "todos";

// Arma la lista de <li> de habilidades a partir del array datos.habilidades.
// Está separada en su propia función porque es la única parte que repite
// una misma etiqueta varias veces (una por cada habilidad).
function crearHtmlHabilidades(habilidades) {
    return habilidades
        .map((habilidad) => `<li>${habilidad}</li>`)
        .join("");
}

// Arma el HTML completo de UNA carta a partir de su objeto de datos.
// Todo el marcado (antes escrito a mano en el HTML) ahora se genera acá,
// así el archivo index.html queda casi vacío y todo pasa por JavaScript.
function crearHtmlCarta(datos) {
    // Según el booleano "peligroso" elegimos texto y clase distintos para el badge de estado
    const textoEstado = datos.peligroso ? "Peligroso" : "No peligroso";
    const claseEstado = datos.peligroso ? "carta__estado--peligroso" : "carta__estado--seguro";

    return `
        <main class="carta">
            <div class="carta__marco">

                <div class="carta__encabezado">
                    <span class="carta__etiqueta-expediente">Expediente</span>
                    <span class="carta__atributo">★</span>
                </div>

                <div class="carta__foto">
                    <img class="carta__imagen" src="${datos.imagen}" alt="${datos.nombre}">
                </div>

                <div class="carta__datos">
                    <h2 class="carta__nombre">${datos.nombre}</h2>
                    <p class="carta__campo"><span class="carta__campo-etiqueta">Tipo:</span> ${datos.tipo}</p>
                    <span class="carta__estado ${claseEstado}">${textoEstado}</span>
                    <ul class="carta__habilidades">${crearHtmlHabilidades(datos.habilidades)}</ul>
                </div>

                <div class="carta__notas">
                    <span class="carta__notas-etiqueta">Notas del caso</span>
                    <p class="carta__descripcion">${datos.descripcion}</p>
                </div>

                <div class="carta__estadisticas">
                    <span class="carta__estadistica">ATK ${datos.ataque}</span>
                    <span class="carta__estadistica">DEF ${datos.defensa}</span>
                </div>

            </div>
        </main>
    `;
}

// Arma el HTML de la carpeta entera: la pestaña, la tapa (con el sello y
// el aviso de "Click para abrir") y el interior (donde después va a vivir
// la carta actual + los controles). Antes esto estaba escrito a mano en
// index.html; ahora también sale de acá, así el HTML queda vacío de verdad.
function crearHtmlCarpeta() {
    return `
        <div class="carpeta" id="carpeta">
            <span class="carpeta__pestana">Archivo de casos</span>

            <button class="carpeta__tapa pila-de-papeles" id="carpeta-tapa" type="button">
                <span class="carpeta__sello" id="carpeta-sello">${cartasVisibles.length}</span>
                <span class="carpeta__texto">Expedientes</span>
                <span class="carpeta__ayuda">Click para abrir</span>
            </button>

            <div class="carpeta__interior" id="carpeta-interior">
                <div class="carpeta__visor" id="carpeta-visor"></div>

                <div class="carpeta__controles">
                    <button class="carpeta__boton" id="boton-anterior" type="button">← Anterior</button>
                    <span class="carpeta__contador" id="carpeta-contador"></span>
                    <button class="carpeta__boton" id="boton-siguiente" type="button">Siguiente →</button>
                </div>

                <button class="carpeta__cerrar" id="boton-cerrar" type="button">✕ Cerrar carpeta</button>
            </div>
        </div>
    `;
}

// Índice de la carta que se está mostrando ahora mismo dentro de la carpeta.
let indiceActual = 0;

// Dibuja SOLO la carta que está en cartasVisibles[indice] dentro del visor,
// actualiza el contador ("Expediente 3 de 9") y prende/apaga los botones
// cuando llegamos al principio o al final del array.
function mostrarCarta(indice) {
    const visor = document.getElementById("carpeta-visor");
    const contador = document.getElementById("carpeta-contador");

    // Sin cartas no hay cartasVisibles[0]: mostramos un aviso en vez de
    // pasarle undefined a crearHtmlCarta (que fallaría al leer sus datos).
    if (cartasVisibles.length === 0) {
        visor.innerHTML = `<p class="carpeta__vacio">No hay expedientes con este filtro.</p>`;
        contador.textContent = "Sin expedientes";
        document.getElementById("boton-anterior").disabled = true;
        document.getElementById("boton-siguiente").disabled = true;
        return;
    }

    visor.innerHTML = crearHtmlCarta(cartasVisibles[indice]);
    contador.textContent = `Expediente ${indice + 1} de ${cartasVisibles.length}`;

    document.getElementById("boton-anterior").disabled = indice === 0;
    document.getElementById("boton-siguiente").disabled = indice === cartasVisibles.length - 1;
}

// Barra de filtros que va debajo de la carpeta. Cada botón guarda en
// data-filtro qué grupo de cartas muestra.
function crearHtmlFiltros() {
    return `
        <div class="filtros" id="filtros">
            <span class="filtros__titulo">Filtrar por</span>
            <button class="filtros__boton filtros__boton--activo" data-filtro="todos" type="button">Todos</button>
            <button class="filtros__boton" data-filtro="peligrosos" type="button">Peligrosos</button>
            <button class="filtros__boton" data-filtro="seguros" type="button">No peligrosos</button>
            <button class="filtros__boton filtros__boton--restaurar" id="boton-restaurar" type="button">↺ Restaurar</button>
        </div>
    `;
}

// Una marca de regla por carta, ubicada según su ataque. La posición va en
// la variable CSS --p (0 a 100) y data-ataque guarda el valor para poder
// resaltar después las que quedan dentro del rango.
function crearHtmlMarcasAtaque() {
    return cartas
        .map((carta) => `
            <span class="ataque__marca" data-ataque="${carta.ataque}"
                style="--p: ${ataqueAPorcentaje(carta.ataque)}"
                title="${carta.nombre}: ${carta.ataque}"></span>
        `)
        .join("");
}

// Ficha flotante con un slider de rango doble. HTML no trae un range con
// dos manijas, así que se superponen dos <input type="range"> iguales:
// uno maneja el "desde" y el otro el "hasta". Cada manija tiene su burbuja
// con el número, que el JS mueve junto con ella.
function crearHtmlSliderAtaque() {
    return `
        <div class="ficha-lateral ataque" id="ataque">
            <span class="ficha-lateral__titulo">Nivel de amenaza</span>
            <span class="ficha-lateral__sello" id="ataque-sello"></span>

            <div class="ataque__rango" id="ataque-rango">
                <span class="ataque__burbuja ataque__burbuja--desde" id="ataque-burbuja-desde"></span>
                <span class="ataque__burbuja ataque__burbuja--hasta" id="ataque-burbuja-hasta"></span>

                <input class="ataque__input" id="ataque-desde" type="range"
                    min="${ATAQUE_LIMITE_MIN}" max="${ATAQUE_LIMITE_MAX}" value="${ataqueDesde}"
                    aria-label="Ataque mínimo">
                <input class="ataque__input" id="ataque-hasta" type="range"
                    min="${ATAQUE_LIMITE_MIN}" max="${ATAQUE_LIMITE_MAX}" value="${ataqueHasta}"
                    aria-label="Ataque máximo">
            </div>

            <div class="ataque__regla">${crearHtmlMarcasAtaque()}</div>

            <div class="ataque__limites">
                <span>ATK ${ATAQUE_LIMITE_MIN}</span>
                <span>ATK ${ATAQUE_LIMITE_MAX}</span>
            </div>

            <span class="ataque__contador" id="ataque-contador"></span>
        </div>
    `;
}

// Vuelve los tres filtros a su estado inicial. Primero se reinicia todo el
// estado y los controles, y recién al final se filtra UNA sola vez (dentro
// de aplicarRangoAtaque), en vez de volver a dibujar la carta tres veces.
function restaurarFiltros() {
    filtroActual = "todos";
    filtroTipo = "todos";

    document.querySelectorAll(".filtros__boton").forEach((boton) => {
        boton.classList.toggle("filtros__boton--activo", boton.dataset.filtro === "todos");
    });

    document.getElementById("tipo-select").value = "todos";
    document.getElementById("tipo-sello").textContent = "Todos";

    document.getElementById("ataque-desde").value = ATAQUE_LIMITE_MIN;
    document.getElementById("ataque-hasta").value = ATAQUE_LIMITE_MAX;
    aplicarRangoAtaque("hasta");
}

// Cuántas cartas hay de un tipo, para mostrarlo en cada opción del select.
function contarCartasDeTipo(tipo) {
    return cartas.filter((carta) => carta.tipo === tipo).length;
}

// Ficha de la derecha con el <select> de tipos. La primera opción es
// "todos"; el resto sale de tiposDisponibles, una <option> por tipo.
function crearHtmlSelectorTipo() {
    const opciones = tiposDisponibles
        .map((tipo) => `<option value="${tipo}">${tipo} (${contarCartasDeTipo(tipo)})</option>`)
        .join("");

    return `
        <div class="ficha-lateral tipo" id="tipo">
            <span class="ficha-lateral__titulo">Clasificación</span>
            <span class="ficha-lateral__sello" id="tipo-sello">Todos</span>

            <label class="tipo__etiqueta" for="tipo-select">Tipo de entidad</label>
            <div class="tipo__caja">
                <select class="tipo__select" id="tipo-select">
                    <option value="todos">Todos los tipos (${cartas.length})</option>
                    ${opciones}
                </select>
            </div>
        </div>
    `;
}

// Se llama cuando cambia el <select>: guarda el tipo, actualiza el sello
// y vuelve a filtrar.
function aplicarTipo(tipo) {
    filtroTipo = tipo;
    document.getElementById("tipo-sello").textContent = tipo === "todos" ? "Todos" : tipo;
    actualizarCartasVisibles();
}

// Devuelve las cartas que pasan LOS TRES filtros a la vez: peligroso,
// rango de ataque y tipo. No modifica "cartas": filter() crea un array nuevo.
function obtenerCartasFiltradas() {
    return cartas.filter((carta) => {
        const pasaPeligro =
            filtroActual === "todos" ||
            (filtroActual === "peligrosos" && carta.peligroso) ||
            (filtroActual === "seguros" && !carta.peligroso);

        const pasaAtaque = carta.ataque >= ataqueDesde && carta.ataque <= ataqueHasta;

        const pasaTipo = filtroTipo === "todos" || carta.tipo === filtroTipo;

        return pasaPeligro && pasaAtaque && pasaTipo;
    });
}

// Recalcula la lista visible con el estado actual de los dos filtros,
// vuelve a la primera carta y actualiza el sello y el visor.
function actualizarCartasVisibles() {
    cartasVisibles = obtenerCartasFiltradas();
    indiceActual = 0;

    document.getElementById("carpeta-sello").textContent = cartasVisibles.length;

    // El contador de la ficha cuenta con LOS DOS filtros, así coincide con
    // lo que se ve en la carpeta. Singular/plural según la cantidad.
    const cantidad = cartasVisibles.length;
    document.getElementById("ataque-contador").textContent =
        `${cantidad} ${cantidad === 1 ? "expediente" : "expedientes"} en rango`;

    mostrarCarta(indiceActual);
}

// Botones de peligroso: guarda la elección y marca el botón activo.
function aplicarFiltro(filtro) {
    filtroActual = filtro;

    document.querySelectorAll(".filtros__boton").forEach((boton) => {
        boton.classList.toggle("filtros__boton--activo", boton.dataset.filtro === filtro);
    });

    actualizarCartasVisibles();
}

// Pasa un valor de ataque a un número de 0 a 100 (sin "%"): el CSS lo usa
// para ubicar manijas, burbujas, marcas y el tramo rojo de la pista.
function ataqueAPorcentaje(valor) {
    const rangoTotal = ATAQUE_LIMITE_MAX - ATAQUE_LIMITE_MIN;
    // Si todas las cartas tienen el mismo ataque, el rango es 0 y dividir
    // daría NaN: en ese caso pintamos la pista entera.
    if (rangoTotal === 0) {
        return valor === ATAQUE_LIMITE_MIN ? 0 : 100;
    }
    return ((valor - ATAQUE_LIMITE_MIN) / rangoTotal) * 100;
}

// Se llama en CADA movimiento de una manija (evento "input"). "cual" dice
// cuál se movió, para frenar esa y no dejar que cruce a la otra.
function aplicarRangoAtaque(cual) {
    const inputDesde = document.getElementById("ataque-desde");
    const inputHasta = document.getElementById("ataque-hasta");

    // .value de un input siempre es string: sin Number(), "9" > "10" daría true.
    let desde = Number(inputDesde.value);
    let hasta = Number(inputHasta.value);

    if (desde > hasta) {
        if (cual === "desde") {
            desde = hasta;
            inputDesde.value = desde;
        } else {
            hasta = desde;
            inputHasta.value = hasta;
        }
    }

    ataqueDesde = desde;
    ataqueHasta = hasta;

    document.getElementById("ataque-sello").textContent = `${desde}–${hasta}`;
    document.getElementById("ataque-burbuja-desde").textContent = desde;
    document.getElementById("ataque-burbuja-hasta").textContent = hasta;

    // Las variables CSS --desde y --hasta se ponen en la ficha entera: así
    // las heredan la pista, las burbujas y las marcas, todo desde un lugar.
    const ficha = document.getElementById("ataque");
    ficha.style.setProperty("--desde", ataqueAPorcentaje(desde));
    ficha.style.setProperty("--hasta", ataqueAPorcentaje(hasta));

    // Las marcas de las cartas que quedan dentro del rango se ponen rojas.
    document.querySelectorAll(".ataque__marca").forEach((marca) => {
        const valor = Number(marca.dataset.ataque);
        marca.classList.toggle("ataque__marca--activa", valor >= desde && valor <= hasta);
    });

    // Si las dos manijas quedan juntas al máximo, la de "desde" tiene que
    // quedar arriba; si no, no se podría volver a mover hacia la izquierda.
    inputDesde.classList.toggle("ataque__input--arriba", desde === ATAQUE_LIMITE_MAX);

    actualizarCartasVisibles();
}

// Punto de entrada: primero inyecta el HTML de la carpeta dentro de #raiz,
// y recién ahí puede buscar los botones (todavía no existían) y conectarles
// los clicks.
function iniciar() {
    document.getElementById("raiz").innerHTML =
        crearHtmlCarpeta() + crearHtmlFiltros() + crearHtmlSliderAtaque() + crearHtmlSelectorTipo();

    const carpeta = document.getElementById("carpeta");

    // Un solo listener en la barra: detecta qué botón de filtro se tocó.
    document.getElementById("filtros").addEventListener("click", (evento) => {
        const boton = evento.target.closest("[data-filtro]");
        if (boton) {
            aplicarFiltro(boton.dataset.filtro);
        }
    });

    // "input" se dispara en cada paso de la manija mientras se arrastra;
    // "change" solo al soltarla. Por eso usamos "input": filtra en vivo.
    document.getElementById("ataque-desde").addEventListener("input", () => {
        aplicarRangoAtaque("desde");
    });

    document.getElementById("ataque-hasta").addEventListener("input", () => {
        aplicarRangoAtaque("hasta");
    });

    // Restaurar está en la misma barra, pero no tiene data-filtro: el
    // listener de arriba lo ignora (closest devuelve null) y lo maneja este.
    document.getElementById("boton-restaurar").addEventListener("click", restaurarFiltros);

    // En un <select> se usa "change": se dispara una vez, cuando se elige
    // una opción. evento.target es el select y .value la opción elegida.
    document.getElementById("tipo-select").addEventListener("change", (evento) => {
        aplicarTipo(evento.target.value);
    });

    // Los botones solo mueven el índice y vuelven a llamar a mostrarCarta().
    document.getElementById("boton-anterior").addEventListener("click", () => {
        if (indiceActual > 0) {
            indiceActual--;
            mostrarCarta(indiceActual);
        }
    });

    document.getElementById("boton-siguiente").addEventListener("click", () => {
        if (indiceActual < cartasVisibles.length - 1) {
            indiceActual++;
            mostrarCarta(indiceActual);
        }
    });

    // Abrir/cerrar la carpeta: le agregamos o sacamos una clase, y todo el
    // movimiento (la tapa girando, el interior desplegándose) lo hace el CSS
    // con transiciones — acá solo decidimos CUÁNDO pasa.
    document.getElementById("carpeta-tapa").addEventListener("click", () => {
        carpeta.classList.add("carpeta--abierta");
    });

    document.getElementById("boton-cerrar").addEventListener("click", () => {
        carpeta.classList.remove("carpeta--abierta");
    });

    // Dejamos lista la primera carta desde ya (aunque la carpeta esté
    // cerrada) para que aparezca al toque apenas se abra. aplicarRangoAtaque
    // también pinta la etiqueta y la pista del slider con los valores iniciales.
    aplicarRangoAtaque("hasta");
}

iniciar();
