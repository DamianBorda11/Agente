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
                <span class="carpeta__sello">${cartas.length}</span>
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

// Dibuja SOLO la carta que está en cartas[indice] dentro del visor,
// actualiza el contador ("Expediente 3 de 9") y prende/apaga los botones
// cuando llegamos al principio o al final del array.
function mostrarCarta(indice) {
    const visor = document.getElementById("carpeta-visor");
    visor.innerHTML = crearHtmlCarta(cartas[indice]);

    const contador = document.getElementById("carpeta-contador");
    contador.textContent = `Expediente ${indice + 1} de ${cartas.length}`;

    document.getElementById("boton-anterior").disabled = indice === 0;
    document.getElementById("boton-siguiente").disabled = indice === cartas.length - 1;
}

// Punto de entrada: primero inyecta el HTML de la carpeta dentro de #raiz,
// y recién ahí puede buscar los botones (todavía no existían) y conectarles
// los clicks.
function iniciar() {
    document.getElementById("raiz").innerHTML = crearHtmlCarpeta();

    const carpeta = document.getElementById("carpeta");

    // Los botones solo mueven el índice y vuelven a llamar a mostrarCarta().
    document.getElementById("boton-anterior").addEventListener("click", () => {
        if (indiceActual > 0) {
            indiceActual--;
            mostrarCarta(indiceActual);
        }
    });

    document.getElementById("boton-siguiente").addEventListener("click", () => {
        if (indiceActual < cartas.length - 1) {
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
    // cerrada) para que aparezca al toque apenas se abra.
    mostrarCarta(indiceActual);
}

iniciar();
