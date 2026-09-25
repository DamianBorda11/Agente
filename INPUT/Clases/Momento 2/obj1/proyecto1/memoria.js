// Juego de memoria de game.html, adaptado de "cardGame" de Julian Bejarano
// (https://codepen.io/julianbejarano/pen/myrzjBG), licencia MIT:
//   Copyright (c) 2026 Julian Bejarano. Permission is hereby granted, free
//   of charge, to any person obtaining a copy of this software... (texto
//   completo en EjemploJuego/cardgame/LICENSE.txt)
//
// Cambios respecto del original: usa las cartas de cargarCartas() (data.js o
// localStorage), la cantidad de pares se adapta a lo que haya, el reverso se
// dibuja con CSS (el link de imagen original ya venció), se corrige el error
// de reiniciar durante el volteo y se guarda el récord de cada usuario.
//
// Todo vive dentro de una IIFE, igual que gestion.js: nada queda global.
(() => {
    "use strict";

    const MIN_PARES = 2;        // con menos no hay juego posible
    const MAX_PARES = 9;        // tope: si gestion.html creó 20, se eligen 9 al azar
    const ESPERA_FALLO = 900;   // ms que se ven dos cartas distintas antes de ocultarse
    const SEGUNDOS_PELIGRO = 120; // a partir de acá el reloj se pone rojo

    // --- Estado de la partida ---
    let usuarioActual = null;   // llega con el evento "sesion-iniciada" de game.js
    let totalPares = 0;
    let carta1 = null;          // elementos <button> de las dos cartas del turno
    let carta2 = null;
    let esperando = false;      // true mientras dos cartas distintas están a la vista
    let paresEncontrados = 0;
    let intentos = 0;
    let segundos = 0;
    let idTimer = null;         // id de setInterval del reloj (null = no arrancó)
    let idVolteo = null;        // id de setTimeout de voltearDeNuevo

    const tablero = document.getElementById("memoria-tablero");

    // --- Utilidades ---

    // Fisher-Yates: recorre de atrás hacia adelante e intercambia cada
    // elemento con uno al azar de los que quedan. Trabaja sobre una copia
    // ([...array]) para no desordenar el original.
    function mezclar(array) {
        const copia = [...array];
        for (let i = copia.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            // Intercambio con desestructuración: sin variable temporal
            [copia[i], copia[j]] = [copia[j], copia[i]];
        }
        return copia;
    }

    function formatearTiempo(totalSegundos) {
        const mm = String(Math.floor(totalSegundos / 60)).padStart(2, "0");
        const ss = String(totalSegundos % 60).padStart(2, "0");
        return `${mm}:${ss}`;
    }

    // Columnas de la grilla según la cantidad de cartas: la primera de estas
    // que divide exacto (18 → 6 × 3, 8 → 4 × 2). Si ninguna divide, 4.
    function calcularColumnas(totalCartas) {
        return [6, 4, 3].find((columnas) => totalCartas % columnas === 0) || 4;
    }

    // --- Reloj ---

    function iniciarTimer() {
        clearInterval(idTimer);
        idTimer = setInterval(() => {
            segundos++;
            const reloj = document.getElementById("memoria-tiempo");
            reloj.textContent = formatearTiempo(segundos);
            reloj.classList.toggle("memoria__hud-valor--peligro", segundos >= SEGUNDOS_PELIGRO);
        }, 1000);
    }

    function detenerTimer() {
        clearInterval(idTimer);
        idTimer = null;
    }

    // --- Récord ---
    // Ya no se guarda aparte: se calcula con el historial de intentos del
    // usuario (usuarios.js). Solo se comparan partidas con la misma cantidad
    // de pares, porque ganar con 4 no es comparable con ganar con 9.

    // true si a es mejor que b: menos intentos; si empatan, menos tiempo.
    function esMejorQue(a, b) {
        return a.numeroIntentos < b.numeroIntentos
            || (a.numeroIntentos === b.numeroIntentos && a.tiempoSegundos < b.tiempoSegundos);
    }

    // La mejor partida de una lista, o null si está vacía. reduce recorre la
    // lista quedándose en cada paso con la mejor de las dos.
    function mejorIntento(intentosLista) {
        return intentosLista.reduce(
            (mejor, intento) => (mejor === null || esMejorQue(intento, mejor) ? intento : mejor),
            null
        );
    }

    // --- Tablero ---

    // Elige las cartas de la partida. cargarCartas() devuelve lo guardado por
    // gestion.html o los 9 originales de data.js.
    function elegirCartas() {
        const todas = cargarCartas();
        if (todas.length < MIN_PARES) {
            return null;
        }
        return mezclar(todas).slice(0, MAX_PARES);
    }

    // Crea UNA carta. El esqueleto es HTML fijo (sin datos), y los datos se
    // cargan después con textContent y src: así un nombre con < o " se
    // muestra como texto y nunca se interpreta como HTML.
    // Es un <button> para que se pueda jugar también con Tab + Enter.
    function crearCarta(datos) {
        const carta = document.createElement("button");
        carta.type = "button";
        carta.className = "memoria__carta";
        carta.dataset.id = datos.id;
        carta.setAttribute("aria-label", "Expediente oculto");

        carta.innerHTML = `
            <span class="memoria__carta-interior">
                <span class="memoria__cara memoria__cara--dorso">
                    <span class="memoria__dorso-sello">?</span>
                    <span class="memoria__dorso-texto">Clasificado</span>
                </span>
                <span class="memoria__cara memoria__cara--frente">
                    <img class="memoria__foto" alt="">
                    <span class="memoria__info">
                        <span class="memoria__nombre"></span>
                        <span class="memoria__tipo"></span>
                    </span>
                </span>
            </span>
        `;

        const foto = carta.querySelector(".memoria__foto");
        // Si la imagen no carga (link roto), se esconde y el nombre ocupa su lugar
        foto.addEventListener("error", () => {
            carta.querySelector(".memoria__cara--frente").classList.add("memoria__cara--sin-foto");
        });
        foto.src = datos.imagen;

        carta.querySelector(".memoria__nombre").textContent = datos.nombre;
        carta.querySelector(".memoria__tipo").textContent = datos.tipo;
        // Se guarda para el aria-label cuando se da vuelta
        carta.dataset.nombre = datos.nombre;

        return carta;
    }

    function actualizarHud() {
        document.getElementById("memoria-intentos").textContent = intentos;
        document.getElementById("memoria-pares").textContent = `${paresEncontrados}/${totalPares}`;
    }

    // Arranca (o reinicia) una partida desde cero.
    function renderizarTablero() {
        // Cancelar lo que haya quedado pendiente de la partida anterior. Sin
        // clearTimeout, un voltearDeNuevo programado se ejecutaría DESPUÉS
        // de reiniciar, con carta1 ya en null → TypeError (el error del
        // ejemplo original).
        clearTimeout(idVolteo);
        detenerTimer();

        carta1 = null;
        carta2 = null;
        esperando = false;
        paresEncontrados = 0;
        intentos = 0;
        segundos = 0;

        const reloj = document.getElementById("memoria-tiempo");
        reloj.textContent = "00:00";
        reloj.classList.remove("memoria__hud-valor--peligro");
        document.getElementById("memoria-victoria").hidden = true;

        const aviso = document.getElementById("memoria-aviso");
        const cartasPartida = elegirCartas();

        if (cartasPartida === null) {
            tablero.innerHTML = "";
            totalPares = 0;
            actualizarHud();
            aviso.textContent = `Se necesitan al menos ${MIN_PARES} expedientes para jugar. Agrégalos desde gestion.html.`;
            aviso.hidden = false;
            return;
        }

        aviso.hidden = true;
        totalPares = cartasPartida.length;
        actualizarHud();

        // Cada carta dos veces, todo mezclado
        const mazo = mezclar([...cartasPartida, ...cartasPartida]);

        tablero.style.setProperty("--columnas", calcularColumnas(mazo.length));
        tablero.replaceChildren(...mazo.map(crearCarta));
    }

    // --- Jugada ---

    function darVuelta(carta) {
        carta.classList.add("memoria__carta--volteada");
        carta.setAttribute("aria-label", carta.dataset.nombre);
    }

    function ocultar(carta) {
        carta.classList.remove("memoria__carta--volteada");
        carta.setAttribute("aria-label", "Expediente oculto");
    }

    function manejarClic(carta) {
        if (esperando) return;
        if (carta.classList.contains("memoria__carta--volteada")) return;
        if (carta.classList.contains("memoria__carta--encontrada")) return;

        // El reloj arranca con la primera carta, no al cargar el tablero:
        // así no se cuenta el tiempo que uno tarda en empezar.
        if (idTimer === null) {
            iniciarTimer();
        }

        darVuelta(carta);

        // Primera carta del turno: se guarda y se espera la segunda
        if (!carta1) {
            carta1 = carta;
            return;
        }

        carta2 = carta;
        intentos++;
        actualizarHud();

        // dataset siempre es string: "3" === "3" compara bien
        if (carta1.dataset.id === carta2.dataset.id) {
            procesarParEncontrado();
        } else {
            esperando = true;
            idVolteo = setTimeout(voltearDeNuevo, ESPERA_FALLO);
        }
    }

    function procesarParEncontrado() {
        [carta1, carta2].forEach((carta) => {
            carta.classList.remove("memoria__carta--volteada");
            carta.classList.add("memoria__carta--encontrada");
            // disabled: ya no se puede clickear ni enfocar con Tab
            carta.disabled = true;
        });

        paresEncontrados++;
        actualizarHud();
        limpiarSeleccion();

        if (paresEncontrados === totalPares) {
            detenerTimer();
            idVolteo = setTimeout(mostrarVictoria, 500);
        }
    }

    function voltearDeNuevo() {
        ocultar(carta1);
        ocultar(carta2);
        limpiarSeleccion();
    }

    function limpiarSeleccion() {
        carta1 = null;
        carta2 = null;
        esperando = false;
    }

    // --- Victoria ---

    // El rango se calcula con intentos por par, así sirve igual para 4 que
    // para 9 pares. 1 intento por par = memoria perfecta.
    function calcularRango() {
        const intentosPorPar = intentos / totalPares;
        if (intentosPorPar <= 1.5) return "Cazador experto";
        if (intentosPorPar <= 2.5) return "Investigador";
        return "Detective novato";
    }

    // Guarda el intento y arma el texto del récord comparando con las
    // partidas ANTERIORES del usuario con la misma cantidad de pares.
    async function guardarIntentoYCompararRecord() {
        const { intento, historial } = await almacenUsuarios.registrarIntento(usuarioActual.id, {
            numeroIntentos: intentos,
            tiempoSegundos: segundos,
            pares: totalPares,
        });

        const anteriores = historial.filter((i) => i.id !== intento.id && i.pares === intento.pares);
        const recordAnterior = mejorIntento(anteriores);

        if (!recordAnterior) {
            return "Primer caso cerrado: este es tu récord.";
        }

        const textoAnterior =
            `${recordAnterior.numeroIntentos} intentos en ${formatearTiempo(recordAnterior.tiempoSegundos)}`;

        return esMejorQue(intento, recordAnterior)
            ? `¡Nuevo récord! Antes: ${textoAnterior}.`
            : `Tu récord: ${textoAnterior}.`;
    }

    async function mostrarVictoria() {
        document.getElementById("victoria-rango").textContent = calcularRango();
        document.getElementById("victoria-tiempo").textContent = formatearTiempo(segundos);
        document.getElementById("victoria-intentos").textContent = intentos;
        document.getElementById("victoria-pares").textContent = `${paresEncontrados}/${totalPares}`;

        const textoRecord = document.getElementById("victoria-record");
        textoRecord.textContent = "";

        // El modal se muestra ya; el récord aparece apenas termina de guardarse
        document.getElementById("memoria-victoria").hidden = false;
        document.getElementById("memoria-jugar-de-nuevo").focus();

        if (!usuarioActual) {
            return;
        }

        try {
            textoRecord.textContent = await guardarIntentoYCompararRecord();
        } catch (error) {
            console.error("No se pudo guardar el intento:", error);
            textoRecord.textContent = "No se pudo guardar este intento.";
        }
    }

    // --- Conexión con la página ---

    // game.js lanza este evento al iniciar sesión o registrarse.
    document.addEventListener("sesion-iniciada", (evento) => {
        usuarioActual = evento.detail;
    });

    document.getElementById("btn-abrir-juego").addEventListener("click", () => {
        document.getElementById("pantalla-bienvenida").hidden = true;
        document.getElementById("pantalla-juego").hidden = false;
        document.getElementById("memoria-jugador").textContent =
            usuarioActual ? `Agente ${usuarioActual.alias}` : "";
        renderizarTablero();
    });

    // Un solo listener en el tablero para todas las cartas (delegación):
    // closest sube desde lo que se tocó (la foto, el nombre...) hasta el
    // <button> de la carta. Sirve aunque las cartas se vuelvan a crear.
    tablero.addEventListener("click", (evento) => {
        const carta = evento.target.closest(".memoria__carta");
        if (carta) {
            manejarClic(carta);
        }
    });

    document.getElementById("memoria-reiniciar").addEventListener("click", renderizarTablero);
    document.getElementById("memoria-jugar-de-nuevo").addEventListener("click", renderizarTablero);
})();
