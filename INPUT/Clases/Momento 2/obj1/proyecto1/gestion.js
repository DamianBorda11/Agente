// Todo el archivo vive dentro de una función que se ejecuta sola (IIFE).
// Nada de lo que se declara adentro es global: desde la consola no se puede
// leer ni llamar cartas, siguienteId, sesionActiva, iniciarGestion, etc.
(() => {
    "use strict";

    // Referencia privada a la función de login.js, tomada al cargar la página.
    const verificar = verificarLogin;

    // Copia privada de las cartas (ya no es el array global de data.js).
    let cartas = cargarCartas();

    // Id que recibirá la próxima carta creada. Se calcula a partir del id más
    // alto que ya existe, así no se repite aunque se recargue la página.
    let siguienteId = cartas.length > 0
        ? Math.max(...cartas.map((carta) => carta.id)) + 1
        : 1;

    // Solo pasa a true dentro de manejarSubmitLogin, con credenciales válidas.
    let sesionActiva = false;

    // Guardia que usa cada operación del CRUD: si no hay sesión, no hace nada.
    function haySesion() {
        if (!sesionActiva) {
            console.warn("Operación bloqueada: primero inicia sesión.");
        }
        return sesionActiva;
    }

    function guardarCartas() {
        localStorage.setItem("cartas", JSON.stringify(cartas));
    }

    // Arma el sidebar con un botón por cada proceso CRUD, más "Mostrar todos".
    function crearHtmlSidebar() {
        return `
            <nav class="gestion__sidebar">
                <span class="gestion__sidebar-titulo">Gestión</span>
                <button class="gestion__item gestion__item--activo" data-seccion="todos" type="button">Mostrar todos</button>
                <button class="gestion__item" data-seccion="crear" type="button">Crear</button>
                <button class="gestion__item" data-seccion="ver" type="button">Ver uno</button>
                <button class="gestion__item" data-seccion="actualizar" type="button">Actualizar</button>
                <button class="gestion__item" data-seccion="eliminar" type="button">Eliminar</button>
                <button class="gestion__item" data-seccion="usuarios" type="button">Usuarios</button>
            </nav>
        `;
    }

    // Arma la fila <tr> de UNA carta. La columna # muestra carta.id (y no la
    // posición en el array) para que siga siendo correcta en listas filtradas.
    function crearHtmlFila(carta) {
        return `
            <tr>
                <td>${carta.id}</td>
                <td>${carta.nombre}</td>
                <td>${carta.tipo}</td>
                <td>${carta.ataque}</td>
                <td>${carta.defensa}</td>
                <td>${carta.peligroso ? "Sí" : "No"}</td>
            </tr>
        `;
    }

    // Pinta en #seccion-todos la tabla con los objetos de listaObjetos.
    // Recibe la lista por parámetro (no usa cartas), así sirve para cualquier
    // array: todas, solo peligrosas, un resultado de búsqueda, etc.
    // Asignar innerHTML reemplaza todo lo anterior, así que llamarla varias
    // veces no duplica filas.
    function renderizarObjetos(listaObjetos) {
        const seccion = document.getElementById("seccion-todos");

        if (listaObjetos.length === 0) {
            seccion.innerHTML = `
                <h2 class="gestion__titulo-seccion">Todos los expedientes</h2>
                <p class="gestion__mensaje">No hay expedientes cargados.</p>
            `;
            return;
        }

        const filas = listaObjetos.map(crearHtmlFila).join("");

        seccion.innerHTML = `
            <h2 class="gestion__titulo-seccion">Todos los expedientes (${listaObjetos.length})</h2>
            <table class="gestion__tabla">
                <thead>
                    <tr>
                        <th>#</th>
                        <th>Nombre</th>
                        <th>Tipo</th>
                        <th>ATK</th>
                        <th>DEF</th>
                        <th>Peligroso</th>
                    </tr>
                </thead>
                <tbody>${filas}</tbody>
            </table>
        `;
    }

    // --- Usuarios registrados desde game.html ---

    // Los datos de usuarios los escribió cualquiera en game.html, así que
    // antes de meterlos en innerHTML se "escapan": < > & " ' pasan a ser
    // entidades (&lt; etc.) y se muestran como texto. Sin esto, un alias
    // como <img src=x onerror=alert(1)> se ejecutaría al abrir esta tabla.
    function escaparHtml(texto) {
        return String(texto)
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#39;");
    }

    // Leer usuarios e intentos lo hace usuarios.js (almacenUsuarios), el
    // mismo que usa game.html: así las dos páginas nunca se desincronizan.

    function formatearTiempo(totalSegundos) {
        const mm = String(Math.floor(totalSegundos / 60)).padStart(2, "0");
        const ss = String(totalSegundos % 60).padStart(2, "0");
        return `${mm}:${ss}`;
    }

    // La fecha se guarda en ISO (UTC); acá se muestra en hora local y en
    // formato colombiano: "25/09/2026, 10:42".
    function formatearFecha(fechaIso) {
        return new Date(fechaIso).toLocaleString("es-CO", {
            dateStyle: "short",
            timeStyle: "short",
        });
    }

    // Mejor marca: menos intentos; si empatan, menos tiempo.
    function textoMejorMarca(intentos) {
        if (intentos.length === 0) {
            return "—";
        }
        const mejor = [...intentos].sort(
            (a, b) => a.numeroIntentos - b.numeroIntentos || a.tiempoSegundos - b.tiempoSegundos
        )[0];
        return `${mejor.numeroIntentos} int. · ${formatearTiempo(mejor.tiempoSegundos)}`;
    }

    function crearHtmlFilaUsuario(usuario) {
        return `
            <tr>
                <td>${escaparHtml(usuario.id)}</td>
                <td>${escaparHtml(usuario.nombre)}</td>
                <td>${escaparHtml(usuario.alias)}</td>
                <td>${escaparHtml(usuario.email)}</td>
                <td class="gestion__celda-hash">${escaparHtml(usuario.hashContrasena)}</td>
                <td>${usuario.intentos.length}</td>
                <td>${textoMejorMarca(usuario.intentos)}</td>
                <td>${usuario.origen}</td>
            </tr>
        `;
    }

    // Una fila por intento, con el alias de su usuario. Los números vienen
    // de localStorage (se pueden editar desde la consola), así que también
    // pasan por escaparHtml.
    function crearHtmlFilaIntento(intento, usuario) {
        return `
            <tr>
                <td>${escaparHtml(intento.id)}</td>
                <td>${escaparHtml(usuario.alias)} (#${escaparHtml(usuario.id)})</td>
                <td>${formatearFecha(intento.fecha)}</td>
                <td>${escaparHtml(intento.numeroIntentos)}</td>
                <td>${formatearTiempo(intento.tiempoSegundos)}</td>
                <td>${escaparHtml(intento.pares)}</td>
            </tr>
        `;
    }

    // Arma usuarios.json completo y lo descarga. Un Blob es un "archivo en
    // memoria"; createObjectURL le da una URL temporal, y un <a download>
    // invisible hace que el navegador lo baje en vez de abrirlo.
    async function descargarUsuariosJson() {
        if (!haySesion()) {
            return;
        }
        const contenido = await almacenUsuarios.generarJson();
        const archivo = new Blob([contenido], { type: "application/json" });
        const url = URL.createObjectURL(archivo);

        const enlace = document.createElement("a");
        enlace.href = url;
        enlace.download = "usuarios.json";
        enlace.click();

        // La URL temporal ocupa memoria hasta que se libera. Se espera un
        // instante para no cortar la descarga que recién empezó.
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    }

    // Pinta en #seccion-usuarios la tabla de usuarios y el historial de
    // intentos. Es async porque espera a fetch; mostrarSeccion la llama sin
    // await: la sección se muestra y las tablas aparecen apenas llegan los datos.
    async function renderizarUsuarios() {
        const seccion = document.getElementById("seccion-usuarios");
        seccion.innerHTML = `
            <h2 class="gestion__titulo-seccion">Usuarios registrados</h2>
            <p class="gestion__mensaje">Cargando…</p>
        `;

        const usuarios = await almacenUsuarios.obtenerUsuarios();

        if (usuarios.length === 0) {
            seccion.innerHTML = `
                <h2 class="gestion__titulo-seccion">Usuarios registrados</h2>
                <p class="gestion__mensaje">Todavía no hay usuarios registrados.</p>
            `;
            return;
        }

        const filasUsuarios = usuarios.map(crearHtmlFilaUsuario).join("");

        // flatMap: por cada usuario, sus intentos (cada uno con su usuario al
        // lado), todo en una sola lista. Después, del más reciente al más viejo.
        const filasIntentos = usuarios
            .flatMap((usuario) => usuario.intentos.map((intento) => ({ intento, usuario })))
            .sort((a, b) => b.intento.fecha.localeCompare(a.intento.fecha))
            .map(({ intento, usuario }) => crearHtmlFilaIntento(intento, usuario))
            .join("");

        seccion.innerHTML = `
            <h2 class="gestion__titulo-seccion">Usuarios registrados (${usuarios.length})</h2>
            <p class="gestion__mensaje">
                La contraseña se muestra como quedó guardada: su hash SHA-256.
                La contraseña original no se guarda en ningún lado.
            </p>
            <div class="gestion__tabla-scroll">
                <table class="gestion__tabla">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Nombre</th>
                            <th>Alias</th>
                            <th>Email</th>
                            <th>Contraseña (hash)</th>
                            <th>Intentos</th>
                            <th>Mejor marca</th>
                            <th>Origen</th>
                        </tr>
                    </thead>
                    <tbody>${filasUsuarios}</tbody>
                </table>
            </div>

            <h2 class="gestion__titulo-seccion gestion__titulo-seccion--separado">Historial de intentos</h2>
            ${filasIntentos === ""
                ? `<p class="gestion__mensaje">Todavía nadie completó el juego.</p>`
                : `
                <div class="gestion__tabla-scroll">
                    <table class="gestion__tabla">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Usuario</th>
                                <th>Fecha</th>
                                <th>Intentos</th>
                                <th>Tiempo</th>
                                <th>Pares</th>
                            </tr>
                        </thead>
                        <tbody>${filasIntentos}</tbody>
                    </table>
                </div>
            `}

            <div class="gestion__exportar">
                <button class="gestion__boton" id="btn-exportar-usuarios" type="button">Descargar usuarios.json</button>
                <p class="gestion__mensaje">
                    El navegador no puede escribir en usuarios.json. Descárgalo y
                    reemplaza el archivo del proyecto para que quede actualizado.
                </p>
            </div>
        `;

        document.getElementById("btn-exportar-usuarios").addEventListener("click", descargarUsuariosJson);
    }

    // Tabla de expedientes con un botón "Eliminar" por fila (se arma de nuevo
    // cada vez que se muestra, para reflejar altas/bajas recientes).
    function crearHtmlTablaEliminar() {
        if (cartas.length === 0) {
            return `
                <h2 class="gestion__titulo-seccion">Eliminar expediente</h2>
                <p class="gestion__mensaje">No hay expedientes cargados.</p>
            `;
        }

        const filas = cartas
            .map((carta, indice) => `
                <tr>
                    <td>${indice + 1}</td>
                    <td>${carta.nombre}</td>
                    <td>${carta.tipo}</td>
                    <td><button class="gestion__boton gestion__boton--eliminar" type="button" data-indice="${indice}">Eliminar</button></td>
                </tr>
            `)
            .join("");

        return `
            <h2 class="gestion__titulo-seccion">Eliminar expediente</h2>
            <table class="gestion__tabla">
                <thead>
                    <tr>
                        <th>#</th>
                        <th>Nombre</th>
                        <th>Tipo</th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>${filas}</tbody>
            </table>
            <p class="gestion__mensaje" id="eliminar-mensaje"></p>
        `;
    }

    // Delegado: cualquier click dentro de #seccion-eliminar que caiga en un
    // botón con data-indice elimina esa carta del array.
    function manejarClickEliminar(evento) {
        if (!haySesion()) {
            return;
        }

        const boton = evento.target.closest("[data-indice]");
        if (!boton) {
            return;
        }

        const indice = Number(boton.dataset.indice);
        const nombre = cartas[indice].nombre;

        if (!confirm(`¿Eliminar "${nombre}"? Esta acción no se puede deshacer.`)) {
            return;
        }

        const [eliminada] = cartas.splice(indice, 1);
        guardarCartas();

        mostrarSeccion("eliminar");
        document.getElementById("eliminar-mensaje").textContent = `Se eliminó "${eliminada.nombre}".`;
    }

    // Select con un <option> por carta (value = índice en el array) más el
    // formulario de edición, oculto hasta que se elige un expediente.
    function crearHtmlFormularioActualizar() {
        if (cartas.length === 0) {
            return `
                <h2 class="gestion__titulo-seccion">Actualizar expediente</h2>
                <p class="gestion__mensaje">No hay expedientes cargados.</p>
            `;
        }

        const opciones = cartas
            .map((carta, indice) => `<option value="${indice}">${carta.nombre}</option>`)
            .join("");

        return `
            <h2 class="gestion__titulo-seccion">Actualizar expediente</h2>
            <label class="gestion__campo">
                <span class="gestion__etiqueta">Elegí un expediente</span>
                <select class="gestion__input" id="actualizar-select">
                    <option value="">-- Selecciona --</option>
                    ${opciones}
                </select>
            </label>

            <form class="gestion__formulario" id="form-actualizar" hidden>
                <label class="gestion__campo">
                    <span class="gestion__etiqueta">Nombre</span>
                    <input class="gestion__input" id="actualizar-nombre" type="text" required>
                </label>

                <label class="gestion__campo">
                    <span class="gestion__etiqueta">Imagen (URL)</span>
                    <input class="gestion__input" id="actualizar-imagen" type="url" required>
                </label>

                <label class="gestion__campo">
                    <span class="gestion__etiqueta">Tipo</span>
                    <input class="gestion__input" id="actualizar-tipo" type="text" required>
                </label>

                <label class="gestion__campo">
                    <span class="gestion__etiqueta">Habilidades (separadas por coma)</span>
                    <input class="gestion__input" id="actualizar-habilidades" type="text">
                </label>

                <label class="gestion__campo">
                    <span class="gestion__etiqueta">Descripción</span>
                    <textarea class="gestion__input gestion__textarea" id="actualizar-descripcion" rows="4"></textarea>
                </label>

                <label class="gestion__campo">
                    <span class="gestion__etiqueta">Ataque</span>
                    <input class="gestion__input" id="actualizar-ataque" type="number" min="0" max="100" required>
                </label>

                <label class="gestion__campo">
                    <span class="gestion__etiqueta">Defensa</span>
                    <input class="gestion__input" id="actualizar-defensa" type="number" min="0" max="100" required>
                </label>

                <label class="gestion__campo gestion__campo--checkbox">
                    <input id="actualizar-peligroso" type="checkbox">
                    <span class="gestion__etiqueta">Peligroso</span>
                </label>

                <button class="gestion__boton" type="submit">Guardar cambios</button>
                <p class="gestion__mensaje" id="actualizar-mensaje"></p>
            </form>
        `;
    }

    // Carga los datos de cartas[indice] en el formulario y lo muestra.
    function rellenarFormularioActualizar(indice) {
        const carta = cartas[indice];
        const form = document.getElementById("form-actualizar");

        form.dataset.indice = indice;
        document.getElementById("actualizar-nombre").value = carta.nombre;
        document.getElementById("actualizar-imagen").value = carta.imagen;
        document.getElementById("actualizar-tipo").value = carta.tipo;
        document.getElementById("actualizar-habilidades").value = carta.habilidades.join(", ");
        document.getElementById("actualizar-descripcion").value = carta.descripcion;
        document.getElementById("actualizar-ataque").value = carta.ataque;
        document.getElementById("actualizar-defensa").value = carta.defensa;
        document.getElementById("actualizar-peligroso").checked = carta.peligroso;
        document.getElementById("actualizar-mensaje").textContent = "";

        form.hidden = false;
    }

    // Delegado sobre #seccion-actualizar: reacciona solo al cambio del select.
    function manejarCambioSelectActualizar(evento) {
        if (evento.target.id !== "actualizar-select") {
            return;
        }

        if (evento.target.value === "") {
            document.getElementById("form-actualizar").hidden = true;
            return;
        }

        rellenarFormularioActualizar(Number(evento.target.value));
    }

    // Sobrescribe cartas[indice] con los valores actuales del formulario.
    function manejarSubmitActualizar(evento) {
        if (evento.target.id !== "form-actualizar") {
            return;
        }
        evento.preventDefault();

        if (!haySesion()) {
            return;
        }

        const indice = Number(evento.target.dataset.indice);
        const nombreNuevo = document.getElementById("actualizar-nombre").value;

        if (!confirm(`¿Guardar los cambios en "${nombreNuevo}"?`)) {
            return;
        }

        const habilidades = document.getElementById("actualizar-habilidades").value
            .split(",")
            .map((habilidad) => habilidad.trim())
            .filter((habilidad) => habilidad !== "");

        // Se conserva el id original: actualizar no debe cambiar la identidad de la carta.
        cartas[indice] = {
            id: cartas[indice].id,
            nombre: document.getElementById("actualizar-nombre").value,
            imagen: document.getElementById("actualizar-imagen").value,
            descripcion: document.getElementById("actualizar-descripcion").value,
            habilidades,
            tipo: document.getElementById("actualizar-tipo").value,
            ataque: Number(document.getElementById("actualizar-ataque").value),
            defensa: Number(document.getElementById("actualizar-defensa").value),
            peligroso: document.getElementById("actualizar-peligroso").checked,
        };

        guardarCartas();

        const opcion = document.querySelector(`#actualizar-select option[value="${indice}"]`);
        if (opcion) {
            opcion.textContent = cartas[indice].nombre;
        }

        document.getElementById("actualizar-mensaje").textContent = `Se actualizó "${cartas[indice].nombre}".`;
    }

    // Formulario de "Crear": un campo por cada propiedad del objeto carta.
    function crearHtmlFormularioCrear() {
        return `
            <h2 class="gestion__titulo-seccion">Crear expediente</h2>
            <form class="gestion__formulario" id="form-crear">
                <label class="gestion__campo">
                    <span class="gestion__etiqueta">Nombre</span>
                    <input class="gestion__input" id="crear-nombre" type="text" required>
                </label>

                <label class="gestion__campo">
                    <span class="gestion__etiqueta">Imagen (URL)</span>
                    <input class="gestion__input" id="crear-imagen" type="url" required>
                </label>

                <label class="gestion__campo">
                    <span class="gestion__etiqueta">Tipo</span>
                    <input class="gestion__input" id="crear-tipo" type="text" required>
                </label>

                <label class="gestion__campo">
                    <span class="gestion__etiqueta">Habilidades (separadas por coma)</span>
                    <input class="gestion__input" id="crear-habilidades" type="text" placeholder="Sigilo, Agilidad, ...">
                </label>

                <label class="gestion__campo">
                    <span class="gestion__etiqueta">Descripción</span>
                    <textarea class="gestion__input gestion__textarea" id="crear-descripcion" rows="4"></textarea>
                </label>

                <label class="gestion__campo">
                    <span class="gestion__etiqueta">Ataque</span>
                    <input class="gestion__input" id="crear-ataque" type="number" min="0" max="100" required>
                </label>

                <label class="gestion__campo">
                    <span class="gestion__etiqueta">Defensa</span>
                    <input class="gestion__input" id="crear-defensa" type="number" min="0" max="100" required>
                </label>

                <label class="gestion__campo gestion__campo--checkbox">
                    <input id="crear-peligroso" type="checkbox">
                    <span class="gestion__etiqueta">Peligroso</span>
                </label>

                <button class="gestion__boton" type="submit">Agregar expediente</button>
                <p class="gestion__mensaje" id="crear-mensaje"></p>
            </form>
        `;
    }

    // Arma el layout completo: sidebar + una sección de contenido por cada
    // opción (las que faltan quedan vacías hasta que armemos su CRUD).
    function crearHtmlGestion() {
        return `
            <div class="gestion">
                ${crearHtmlSidebar()}
                <main class="gestion__contenido">
                    <section class="gestion__seccion" id="seccion-todos"></section>
                    <section class="gestion__seccion" id="seccion-crear" hidden>${crearHtmlFormularioCrear()}</section>
                    <section class="gestion__seccion" id="seccion-ver" hidden></section>
                    <section class="gestion__seccion" id="seccion-actualizar" hidden></section>
                    <section class="gestion__seccion" id="seccion-eliminar" hidden></section>
                    <section class="gestion__seccion" id="seccion-usuarios" hidden></section>
                </main>
            </div>
        `;
    }

    // Lee el formulario de "Crear", arma un objeto carta y lo agrega al array.
    function manejarSubmitCrear(evento) {
        evento.preventDefault();

        if (!haySesion()) {
            return;
        }

        const nombre = document.getElementById("crear-nombre").value;

        if (!confirm(`¿Agregar "${nombre}" a los expedientes?`)) {
            return;
        }

        const habilidades = document.getElementById("crear-habilidades").value
            .split(",")
            .map((habilidad) => habilidad.trim())
            .filter((habilidad) => habilidad !== "");

        const nuevaCarta = {
            id: siguienteId,
            nombre: document.getElementById("crear-nombre").value,
            imagen: document.getElementById("crear-imagen").value,
            descripcion: document.getElementById("crear-descripcion").value,
            habilidades,
            tipo: document.getElementById("crear-tipo").value,
            ataque: Number(document.getElementById("crear-ataque").value),
            defensa: Number(document.getElementById("crear-defensa").value),
            peligroso: document.getElementById("crear-peligroso").checked,
        };

        cartas.push(nuevaCarta);
        siguienteId++;
        guardarCartas();

        document.getElementById("form-crear").reset();
        document.getElementById("crear-mensaje").textContent = `Se agregó "${nuevaCarta.nombre}" a los expedientes.`;
    }

    // Muestra solo la sección elegida y marca su botón como activo en el sidebar.
    function mostrarSeccion(nombre) {
        if (!haySesion()) {
            return;
        }

        if (nombre === "todos") {
            renderizarObjetos(cartas);
        }

        if (nombre === "eliminar") {
            document.getElementById("seccion-eliminar").innerHTML = crearHtmlTablaEliminar();
        }

        if (nombre === "actualizar") {
            document.getElementById("seccion-actualizar").innerHTML = crearHtmlFormularioActualizar();
        }

        if (nombre === "usuarios") {
            renderizarUsuarios();
        }

        document.querySelectorAll(".gestion__seccion").forEach((seccion) => {
            seccion.hidden = seccion.id !== `seccion-${nombre}`;
        });

        document.querySelectorAll(".gestion__item").forEach((boton) => {
            boton.classList.toggle("gestion__item--activo", boton.dataset.seccion === nombre);
        });
    }

    function iniciarGestion() {
        if (!haySesion()) {
            return;
        }

        const raiz = document.getElementById("gestion-raiz");
        raiz.innerHTML = crearHtmlGestion();

        document.querySelectorAll(".gestion__item").forEach((boton) => {
            boton.addEventListener("click", () => mostrarSeccion(boton.dataset.seccion));
        });

        document.getElementById("form-crear").addEventListener("submit", manejarSubmitCrear);
        document.getElementById("seccion-eliminar").addEventListener("click", manejarClickEliminar);

        document.getElementById("seccion-actualizar").addEventListener("change", manejarCambioSelectActualizar);
        document.getElementById("seccion-actualizar").addEventListener("submit", manejarSubmitActualizar);

        mostrarSeccion("todos");
    }

    // Formulario de acceso: es lo único que se muestra hasta validar credenciales.
    function crearHtmlLogin() {
        return `
            <div class="login">
                <form class="gestion__formulario login__caja" id="form-login">
                    <h2 class="gestion__titulo-seccion">Acceso restringido</h2>

                    <label class="gestion__campo">
                        <span class="gestion__etiqueta">Usuario</span>
                        <input class="gestion__input" id="login-usuario" type="text" autocomplete="username" required>
                    </label>

                    <label class="gestion__campo">
                        <span class="gestion__etiqueta">Contraseña</span>
                        <input class="gestion__input" id="login-contrasena" type="password" autocomplete="current-password" required>
                    </label>

                    <button class="gestion__boton" type="submit">Entrar</button>
                    <p class="gestion__mensaje login__error" id="login-mensaje"></p>
                </form>
            </div>
        `;
    }

    // Pide a login.js que verifique los datos. Solo si son correctos se activa
    // la sesión y se arma el CRUD; si no, el HTML de gestión nunca llega a
    // insertarse en la página.
    async function manejarSubmitLogin(evento) {
        evento.preventDefault();

        const usuario = document.getElementById("login-usuario").value.trim();
        const contrasena = document.getElementById("login-contrasena").value;
        const mensaje = document.getElementById("login-mensaje");

        let datosCorrectos;
        try {
            datosCorrectos = await verificar(usuario, contrasena);
        } catch (error) {
            // crypto.subtle solo existe en contextos seguros (https, localhost
            // o file://). Si la página se abre por http con una IP de red, falla.
            console.error(error);
            mensaje.textContent = "No se pudo verificar: abre la página desde localhost o como archivo local.";
            return;
        }

        if (datosCorrectos) {
            sesionActiva = true;
            iniciarGestion();
            return;
        }

        document.getElementById("login-contrasena").value = "";
        mensaje.textContent = "Usuario o contraseña incorrectos.";
    }

    function mostrarLogin() {
        const raiz = document.getElementById("gestion-raiz");
        raiz.innerHTML = crearHtmlLogin();

        document.getElementById("form-login").addEventListener("submit", manejarSubmitLogin);
        document.getElementById("login-usuario").focus();
    }

    mostrarLogin();
})();
