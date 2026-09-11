
// Datos: 12 personajes de DC (6 heroes, 6 villanos), un objeto por carta.
// "imagen" esta vacia en la mayoria - completa un link real para verla en la carta.
let personajesDC = [
    {
        nombre: "Nightwing",
        poderes: ["Artes marciales", "Acrobacia", "Sigilo"],
        descripcion: "Dick Grayson, exlider de los Titanes y ex Robin.",
        bando: "heroe",
        imagen: "https://img.asmedia.epimg.net/resizer/v2/VFQIO2DRLFCLNPC67ZRTRGKRYQ.jpg?auth=ada19732d63f6239811ef45e27f5f7cc611b75db750b46c2d98ee50178502fe2&width=644&height=362&smart=true",
        edad: 24,
        altura: 1.83,
        universo: "DC",
        nivelDeFuerza: 75,
        activo: true,
    },
    {
        nombre: "Batman",
        poderes: ["Inteligencia estrategica", "Artes marciales", "Gadgets"],
        descripcion: "Bruce Wayne, protector de Gotham sin poderes sobrehumanos.",
        bando: "heroe",
        imagen: "",
        edad: 35,
        altura: 1.88,
        universo: "DC",
        nivelDeFuerza: 80,
        activo: true,
    },
    {
        nombre: "Superman",
        poderes: ["Vuelo", "Super fuerza", "Vision de calor"],
        descripcion: "Clark Kent, ultimo hijo de Krypton, reportero en Metropolis.",
        bando: "heroe",
        imagen: "",
        edad: 33,
        altura: 1.91,
        universo: "DC",
        nivelDeFuerza: 99,
        activo: true,
    },
    {
        nombre: "Wonder Woman",
        poderes: ["Super fuerza", "Lazo de la verdad", "Combate cuerpo a cuerpo"],
        descripcion: "Diana Prince, princesa amazona de Themyscira.",
        bando: "heroe",
        imagen: "",
        edad: 30,
        altura: 1.83,
        universo: "DC",
        nivelDeFuerza: 95,
        activo: true,
    },
    {
        nombre: "Flash",
        poderes: ["Super velocidad", "Regeneracion acelerada", "Viaje en el tiempo"],
        descripcion: "Barry Allen, forense de Central City conectado a la Fuerza de Velocidad.",
        bando: "heroe",
        imagen: "",
        edad: 28,
        altura: 1.83,
        universo: "DC",
        nivelDeFuerza: 88,
        activo: true,
    },
    {
        nombre: "Green Lantern",
        poderes: ["Anillo de poder", "Construcciones de energia", "Vuelo"],
        descripcion: "Hal Jordan, piloto de pruebas y miembro del Cuerpo Green Lantern.",
        bando: "heroe",
        imagen: "",
        edad: 32,
        altura: 1.8,
        universo: "DC",
        nivelDeFuerza: 82,
        activo: true,
    },
    {
        nombre: "Joker",
        poderes: ["Manipulacion psicologica", "Quimica de gases toxicos", "Imprevisibilidad"],
        descripcion: "Villano de Gotham sin identidad fija, archienemigo de Batman.",
        bando: "villano",
        imagen: "",
        edad: 45,
        altura: 1.83,
        universo: "DC",
        nivelDeFuerza: 55,
        activo: true,
    },
    {
        nombre: "Harley Quinn",
        poderes: ["Acrobacia", "Combate con mazo", "Imprevisibilidad"],
        descripcion: "Harleen Quinzel, expsiquiatra de Arkham convertida en villana.",
        bando: "villano",
        imagen: "",
        edad: 29,
        altura: 1.7,
        universo: "DC",
        nivelDeFuerza: 60,
        activo: true,
    },
    {
        nombre: "Lex Luthor",
        poderes: ["Genio cientifico", "Poder economico", "Armadura de combate"],
        descripcion: "Empresario de Metropolis y enemigo declarado de Superman.",
        bando: "villano",
        imagen: "",
        edad: 42,
        altura: 1.9,
        universo: "DC",
        nivelDeFuerza: 65,
        activo: true,
    },
    {
        nombre: "Bane",
        poderes: ["Super fuerza (Venom)", "Estrategia militar", "Resistencia"],
        descripcion: "Nacido en la prision de Pena Duro, rompio la espalda de Batman.",
        bando: "villano",
        imagen: "",
        edad: 38,
        altura: 2.03,
        universo: "DC",
        nivelDeFuerza: 90,
        activo: true,
    },
    {
        nombre: "Two-Face",
        poderes: ["Doble identidad", "Decisiones con moneda", "Conocimiento legal"],
        descripcion: "Harvey Dent, exfiscal de Gotham desfigurado por acido.",
        bando: "villano",
        imagen: "",
        edad: 40,
        altura: 1.85,
        universo: "DC",
        nivelDeFuerza: 50,
        activo: true,
    },
    {
        nombre: "Poison Ivy",
        poderes: ["Control de plantas", "Toxinas", "Feromonas"],
        descripcion: "Pamela Isley, bioquimica convertida en villana ecologista.",
        bando: "villano",
        imagen: "",
        edad: 31,
        altura: 1.73,
        universo: "DC",
        nivelDeFuerza: 62,
        activo: true,
    },
];

// Acceder a las propiedades de un objeto: se imprime el primer personaje completo
console.log(personajesDC[0]);

// Arma un elemento <section class="card-container"> a partir de un objeto personaje.
// Se llama una vez por cada elemento de personajesDC (ver el forEach mas abajo).
function crearCarta(personaje) {
    const carta = document.createElement("section");
    carta.className = "card-container";

    // Convierte ["poder1", "poder2"] en "<li>poder1</li><li>poder2</li>"
    const poderesHTML = personaje.poderes
        .map((poder) => `<li>${poder}</li>`)
        .join("");

    // Los villanos reciben la clase extra "badge-villano" para el acento rojo (ver style.css)
    const claseBadge = personaje.bando === "villano" ? "badge badge-villano" : "badge";

    // Rellena el HTML de la carta con un template literal usando los datos del personaje
    carta.innerHTML = `
        <img class="card-img" src="${personaje.imagen}" alt="${personaje.nombre}">
        <div class="card-body">
            <h2>${personaje.nombre}</h2>
            <span class="${claseBadge}">${personaje.bando}</span>
            <p>${personaje.descripcion}</p>
            <ul class="poderes-list">${poderesHTML}</ul>
            <div class="stats-grid">
                <div class="stat">
                    <strong>Edad</strong>
                    <span>${personaje.edad}</span>
                </div>
                <div class="stat">
                    <strong>Altura</strong>
                    <span>${personaje.altura} m</span>
                </div>
                <div class="stat">
                    <strong>Universo</strong>
                    <span>${personaje.universo}</span>
                </div>
                <div class="stat">
                    <strong>Fuerza</strong>
                    <span>${personaje.nivelDeFuerza}</span>
                </div>
            </div>
        </div>
    `;

    // Al hacer click en la carta se abre el modal con el detalle de este personaje
    carta.addEventListener("click", () => mostrarModal(personaje));

    return carta;
}

// Recorre todos los personajes y agrega su carta a la seccion #galeria
const galeria = document.getElementById("galeria");
personajesDC.forEach((personaje) => {
    galeria.appendChild(crearCarta(personaje));
});

// Modal de detalle: se llena con el personaje elegido y se muestra
const modalOverlay = document.getElementById("modalOverlay");
const modalBody = document.getElementById("modalBody");
const modalClose = document.getElementById("modalClose");

function mostrarModal(personaje) {
    const poderesHTML = personaje.poderes
        .map((poder) => `<li>${poder}</li>`)
        .join("");
    const claseBadge = personaje.bando === "villano" ? "badge badge-villano" : "badge";

    modalBody.innerHTML = `
        <img class="card-img" src="${personaje.imagen}" alt="${personaje.nombre}">
        <div class="card-body">
            <h2>${personaje.nombre}</h2>
            <span class="${claseBadge}">${personaje.bando}</span>
            <p>${personaje.descripcion}</p>
            <ul class="poderes-list">${poderesHTML}</ul>
            <div class="stats-grid">
                <div class="stat">
                    <strong>Edad</strong>
                    <span>${personaje.edad}</span>
                </div>
                <div class="stat">
                    <strong>Altura</strong>
                    <span>${personaje.altura} m</span>
                </div>
                <div class="stat">
                    <strong>Universo</strong>
                    <span>${personaje.universo}</span>
                </div>
                <div class="stat">
                    <strong>Fuerza</strong>
                    <span>${personaje.nivelDeFuerza}</span>
                </div>
            </div>
        </div>
    `;

    modalOverlay.classList.add("activo");
}

function cerrarModal() {
    modalOverlay.classList.remove("activo");
}

modalClose.addEventListener("click", cerrarModal);

// Cierra el modal si se hace click fuera de la tarjeta (en el fondo oscuro)
modalOverlay.addEventListener("click", (evento) => {
    if (evento.target === modalOverlay) {
        cerrarModal();
    }
});

// Toggle de modo claro/oscuro: cambia una clase CSS en <body> y actualiza el texto del boton
const btnModoClaro = document.getElementById("btnModoClaro");
btnModoClaro.addEventListener("click", () => {
    document.body.classList.toggle("light-mode");
    btnModoClaro.textContent = document.body.classList.contains("light-mode")
        ? "Modo oscuro"
        : "Modo claro";
});

// Mas ejemplos de como leer propiedades/elementos de arreglo de un mismo objeto
console.log(personajesDC[0].bando);
console.log(personajesDC[0].descripcion);
console.log(personajesDC[0].edad * 3);
console.log(personajesDC[0].poderes[0]);
