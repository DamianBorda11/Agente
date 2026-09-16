// Array de objetos: cada objeto es una carta con todos sus datos.
// Esto es lo único que cambia entre una carta y otra; el HTML de cada
// carta lo arma la función crearHtmlCarta() a partir de estos datos.
const cartas = [
    {
        nombre: "Ticci Toby",
        imagen: "https://i.pinimg.com/736x/78/f7/39/78f739458a78aef2f3c82f404c04c741.jpg",
        descripcion: "Ticci Toby es un joven con tics nerviosos y un pasado traumático que, tras varios sucesos violentos, se convierte en proxy de Slender Man.",
        habilidades: ["Agilidad", "Sigilo", "Insensibilidad congénita"],
        tipo: "Psíquico",
        ataque: 85,
        defensa: 98,
        peligroso: true,
    },
    {
        nombre: "Jeff the Killer",
        imagen: "https://i.pinimg.com/736x/70/cc/b9/70ccb915960ab882d97b5673c2642084.jpg",
        descripcion: "Un adolescente desfigurado por un incendio que, tras perder la cordura, recorre las noches en busca de nuevas víctimas mientras susurra su frase característica.",
        habilidades: ["Sonrisa perturbadora", "Fuerza sobrehumana", "Insomnio permanente"],
        tipo: "Oscuro",
        ataque: 90,
        defensa: 70,
        peligroso: true,
    },
    {
        nombre: "Jane the Killer",
        imagen: "https://i.pinimg.com/736x/57/6d/db/576ddba5f739e23ce779237c08932562.jpg",
        descripcion: "Rival jurada de Jeff, quedó desfigurada tras enfrentarlo y ahora lo persigue por venganza, moviéndose entre las sombras con precisión quirúrgica.",
        habilidades: ["Sigilo", "Cuchillos arrojadizos", "Determinación implacable"],
        tipo: "Oscuro",
        ataque: 80,
        defensa: 75,
        peligroso: false,
    },
    {
        nombre: "Eyeless Jack",
        imagen: "https://i.pinimg.com/736x/f1/22/f0/f122f010437279a47565e84571422d01.jpg",
        descripcion: "Una entidad sin ojos que se alimenta de riñones humanos durante la noche, dejando tras de sí escenas quirúrgicas imposibles de explicar.",
        habilidades: ["Visión sin ojos", "Regeneración", "Cirugía improvisada"],
        tipo: "Sobrenatural",
        ataque: 75,
        defensa: 80,
        peligroso: true,
    },
    {
        nombre: "Suicidal Liu",
        imagen: "https://i.pinimg.com/736x/a7/21/e5/a721e55e68b081a5854ce3f02a124acc.jpg",
        descripcion: "El hermano mayor de Jeff, atormentado por la culpa y el trauma tras el incendio que lo desfiguró, lucha contra episodios de autolesión y una ira que a veces no puede controlar.",
        habilidades: ["Fuerza física", "Resiliencia al dolor", "Inestabilidad impredecible"],
        tipo: "Oscuro",
        ataque: 85,
        defensa: 50,
        peligroso: false,
    },
    {
        nombre: "Nina the Killer",
        imagen: "https://i.pinimg.com/736x/20/10/0a/20100ab13827010b742fe4e3fec7bef0.jpg",
        descripcion: "Una admiradora obsesionada con Jeff the Killer que imita su modus operandi con garras improvisadas, dejando un rastro de imitación macabra por donde pasa.",
        habilidades: ["Sigilo obsesivo", "Garras de acero", "Vigilancia constante"],
        tipo: "Oscuro",
        ataque: 78,
        defensa: 68,
        peligroso: true,
    },
    {
        nombre: "BEN Drowned",
        imagen: "https://i.pinimg.com/736x/ab/2e/c7/ab2ec716acd5e86f25d03134a07a75b0.jpg",
        descripcion: "El espíritu de un niño ahogado quedó atrapado en un cartucho de videojuego, manipulando consolas y datos para atraer a nuevas víctimas.",
        habilidades: ["Manipulación de datos", "Posesión de consolas", "Ilusiones"],
        tipo: "Digital",
        ataque: 70,
        defensa: 55,
        peligroso: true,
    },
    {
        nombre: "Sonic.exe",
        imagen: "https://i.pinimg.com/736x/6a/81/59/6a815924ae60db11994034771ee03a82.jpg",
        descripcion: "Una versión corrompida de Sonic que habita un cartucho maldito, atormentando a quien lo juega y manipulando el mundo del juego a su antojo.",
        habilidades: ["Manipulación del juego", "Velocidad sobrenatural", "Terror psicológico"],
        tipo: "Digital",
        ataque: 95,
        defensa: 60,
        peligroso: true,
    },
    {
        nombre: "Laughing Jack",
        imagen: "https://i.pinimg.com/736x/81/17/b0/8117b0f35849c3d39b8375ec73ffa88d.jpg",
        descripcion: "Un payaso demoníaco invocado por la imaginación de un niño, que conserva su apariencia juguetona mientras acecha a quienes se cruzan en su camino.",
        habilidades: ["Invocación de juguetes malditos", "Risa hipnótica", "Inmortalidad"],
        tipo: "Demoníaco",
        ataque: 88,
        defensa: 66,
        peligroso: true,
    },
];

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
