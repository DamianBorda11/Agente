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
            </nav>
        `;
    }

    // Tabla con todos los expedientes cargados en cartas (se arma de nuevo cada
    // vez que se muestra, así refleja los que se agreguen desde "Crear").
    function crearHtmlTablaTodos() {
        if (cartas.length === 0) {
            return `
                <h2 class="gestion__titulo-seccion">Todos los expedientes</h2>
                <p class="gestion__mensaje">No hay expedientes cargados.</p>
            `;
        }

        const filas = cartas
            .map((carta, indice) => `
                <tr>
                    <td>${indice + 1}</td>
                    <td>${carta.nombre}</td>
                    <td>${carta.tipo}</td>
                    <td>${carta.ataque}</td>
                    <td>${carta.defensa}</td>
                    <td>${carta.peligroso ? "Sí" : "No"}</td>
                </tr>
            `)
            .join("");

        return `
            <h2 class="gestion__titulo-seccion">Todos los expedientes (${cartas.length})</h2>
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
            document.getElementById("seccion-todos").innerHTML = crearHtmlTablaTodos();
        }

        if (nombre === "eliminar") {
            document.getElementById("seccion-eliminar").innerHTML = crearHtmlTablaEliminar();
        }

        if (nombre === "actualizar") {
            document.getElementById("seccion-actualizar").innerHTML = crearHtmlFormularioActualizar();
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

        if (await verificar(usuario, contrasena)) {
            sesionActiva = true;
            iniciarGestion();
            return;
        }

        document.getElementById("login-contrasena").value = "";
        document.getElementById("login-mensaje").textContent = "Usuario o contraseña incorrectos.";
    }

    function mostrarLogin() {
        const raiz = document.getElementById("gestion-raiz");
        raiz.innerHTML = crearHtmlLogin();

        document.getElementById("form-login").addEventListener("submit", manejarSubmitLogin);
        document.getElementById("login-usuario").focus();
    }

    mostrarLogin();
})();
