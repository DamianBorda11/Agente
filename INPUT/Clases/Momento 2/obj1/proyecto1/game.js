// Formulario de ingreso de game.html: valida nombre, alias y contraseña, y
// solo deja continuar si todo cumple.

// Letras válidas: las del inglés más las del español (tildes, ü y ñ).
// Sin esto, "José" o "Ñandú" contarían menos letras de las que tienen.
//
// La expresión regular de la contraseña, parte por parte:
//   ^ ... $                     la regla se aplica al texto COMPLETO
//   (?=(?:.*[letra]){6})        lookahead: mira hacia adelante sin "consumir"
//                               y exige encontrar 6 veces "algo + una letra",
//                               o sea, al menos 6 letras en cualquier lugar
//   (?=(?:.*\d){6})             lo mismo con dígitos: al menos 6 números
//   (?=.*[A-ZÁÉÍÓÚÜÑ])          al menos una mayúscula
//   (?=.*[^letra dígito \s])    al menos un carácter que no sea letra,
//                               número ni espacio: eso es un "especial"
//   \S+                         todo el texto sin espacios
// Los lookaheads (?=...) se pueden encadenar: cada uno revisa una condición
// desde el principio del texto, y la contraseña pasa solo si cumple todas.
const REGEX_CONTRASENA =
    /^(?=(?:.*[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]){6})(?=(?:.*\d){6})(?=.*[A-ZÁÉÍÓÚÜÑ])(?=.*[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9\s])\S+$/;

// Expresión regular del email, parte por parte:
//   ^[A-Za-z0-9._%+-]+     usuario: letras, números y . _ % + - (una o más)
//   @                      exactamente una arroba
//   [A-Za-z0-9.-]+         dominio: letras, números, puntos y guiones
//   \.                     un punto literal (sin la \, "." significa
//                          "cualquier carácter")
//   [A-Za-z]{2,}$          terminación de 2 letras o más: com, co, info...
// No cubre el 100% de los emails que permite el estándar (ese regex es
// enorme), pero sí los reales de uso diario y rechaza los errores típicos.
const REGEX_EMAIL = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

// Las mismas condiciones, pero separadas, SOLO para marcar en vivo cuál
// falta. La que decide si se puede continuar es REGEX_CONTRASENA.
const REGLAS_CONTRASENA = {
    letras: /(?:.*[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]){6}/,
    numeros: /(?:.*\d){6}/,
    mayuscula: /[A-ZÁÉÍÓÚÜÑ]/,
    especial: /[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9\s]/,
    espacios: /^\S+$/,
};

const formulario = document.getElementById("form-registro");
const inputNombre = document.getElementById("registro-nombre");
const inputAlias = document.getElementById("registro-alias");
const inputEmail = document.getElementById("registro-email");
const inputContrasena = document.getElementById("registro-contrasena");
const mensaje = document.getElementById("registro-mensaje");

// Recorre las reglas y prende/apaga la marca de cada <li>. Object.entries
// convierte el objeto en pares [nombre, regex] para poder recorrerlo.
function actualizarReglas(contrasena) {
    Object.entries(REGLAS_CONTRASENA).forEach(([nombreRegla, regex]) => {
        const item = document.querySelector(`[data-regla="${nombreRegla}"]`);
        item.classList.toggle("registro__regla--cumplida", regex.test(contrasena));
    });
}

// Devuelve el texto del primer error, o "" si todo está bien.
// .trim() quita espacios de los bordes: "   " no cuenta como nombre.
function validarFormulario(nombre, alias, email, contrasena) {
    if (nombre === "") {
        return "Escribe tu nombre.";
    }
    if (alias === "") {
        return "Escribe tu alias.";
    }
    if (email === "") {
        return "Escribe tu email.";
    }
    if (!REGEX_EMAIL.test(email)) {
        return "El email no es válido. Ejemplo: nombre@dominio.com";
    }
    if (!REGEX_CONTRASENA.test(contrasena)) {
        return "La contraseña no cumple todos los requisitos.";
    }
    return "";
}

// Leer y guardar usuarios ahora lo hace usuarios.js (almacenUsuarios),
// que comparten game.html y gestion.html.

// Cambia de pantalla: oculta el formulario y muestra la bienvenida.
// textContent (no innerHTML) para que lo que escribió el usuario se
// muestre como texto y nunca se interprete como HTML.
function mostrarBienvenida(usuario, esNuevo) {
    document.getElementById("bienvenida-alias").textContent = usuario.alias;
    document.getElementById("bienvenida-detalle").textContent = esNuevo
        ? `Expediente creado a nombre de ${usuario.nombre}.`
        : `Expediente de ${usuario.nombre} reabierto.`;

    document.getElementById("pantalla-login").hidden = true;
    document.getElementById("pantalla-bienvenida").hidden = false;

    // Avisa al resto de la página que hay sesión, con un evento propio.
    // game.js no necesita saber que memoria.js existe: solo "grita" el
    // evento, y quien lo escuche (memoria.js) reacciona. El hash de la
    // contraseña NO se incluye: el juego no lo necesita. El id sí: con él
    // memoria.js guarda cada intento a nombre de este usuario.
    document.dispatchEvent(new CustomEvent("sesion-iniciada", {
        detail: { id: usuario.id, nombre: usuario.nombre, alias: usuario.alias, email: usuario.email },
    }));
}

// Decide qué pasa con datos que ya pasaron las validaciones de formato:
//   - email existe y alias + contraseña coinciden → login
//   - email existe pero algo no coincide          → error, no entra
//   - email no existe                             → confirm para registrarse
async function ingresarORegistrar(nombre, alias, email, contrasena) {
    const usuarios = await almacenUsuarios.obtenerUsuarios();

    // Solo se compara el hash: la contraseña en texto plano no se guarda
    // ni se compara nunca.
    const hashContrasena = await calcularHash(contrasena);

    // find devuelve el primer usuario que cumple, o undefined si ninguno.
    const existente = usuarios.find((usuario) => usuario.email === email);

    if (existente) {
        if (existente.alias === alias && existente.hashContrasena === hashContrasena) {
            mostrarBienvenida(existente, false);
        } else {
            // No se dice CUÁL de los dos falló: eso le daría pistas a
            // alguien que está probando contraseñas ajenas.
            mensaje.textContent = "Alias o contraseña incorrectos.";
        }
        return;
    }

    // confirm() frena la página hasta que se elige: true = Aceptar, false = Cancelar.
    const quiereRegistrarse = confirm(
        `No hay ninguna cuenta con ${email}.\n¿Deseas registrarte con estos datos?`
    );

    if (!quiereRegistrarse) {
        mensaje.textContent = "Registro cancelado.";
        return;
    }

    // El almacén le asigna el id y devuelve el usuario ya creado
    const nuevoUsuario = await almacenUsuarios.registrarUsuario({ nombre, alias, email, hashContrasena });
    mostrarBienvenida(nuevoUsuario, true);
}

// "input" se dispara con cada tecla: la lista de requisitos se actualiza
// mientras se escribe.
inputContrasena.addEventListener("input", () => {
    actualizarReglas(inputContrasena.value);
});

// El listener es async porque adentro espera (await) a fetch y al hash.
formulario.addEventListener("submit", async (evento) => {
    // Por defecto, un submit recarga la página. preventDefault lo frena:
    // así decidimos nosotros si se continúa o no.
    evento.preventDefault();

    const nombre = inputNombre.value.trim();
    const alias = inputAlias.value.trim();
    // El email se guarda y compara en minúsculas: Ana@Mail.com y
    // ana@mail.com son la misma cuenta.
    const email = inputEmail.value.trim().toLowerCase();
    const contrasena = inputContrasena.value;

    const error = validarFormulario(nombre, alias, email, contrasena);

    if (error !== "") {
        mensaje.textContent = error;
        return;
    }

    // Mientras se espera la respuesta, el botón se desactiva para que un
    // doble clic no registre al mismo usuario dos veces.
    const boton = formulario.querySelector("button[type='submit']");
    boton.disabled = true;
    mensaje.textContent = "";

    try {
        await ingresarORegistrar(nombre, alias, email, contrasena);
    } finally {
        // finally corre siempre, haya salido bien o mal.
        boton.disabled = false;
        inputContrasena.value = "";
        actualizarReglas("");
    }
});
