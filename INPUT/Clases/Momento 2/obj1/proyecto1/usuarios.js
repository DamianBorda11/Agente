// Almacén de usuarios e intentos, compartido por game.js, memoria.js y
// gestion.js. Es el ÚNICO archivo que sabe dónde y cómo se guardan.
//
// De dónde salen los datos:
//   - usuarios.json      → se LEE con fetch. El navegador no puede escribirlo.
//   - localStorage       → lo que se crea desde la página:
//       "usuariosRegistrados" → usuarios nuevos (sin sus intentos)
//       "intentosGuardados"   → intentos de CUALQUIER usuario, cada uno con
//                                usuarioId para saber de quién es
// obtenerUsuarios() junta todo con la misma forma que usuarios.json, y
// generarJson() arma el archivo completo para descargarlo y reemplazar el viejo.
//
// Patrón "módulo": la función se ejecuta una vez y devuelve SOLO lo que
// otros archivos pueden usar. Lo demás (claves, helpers) queda privado.
const almacenUsuarios = (() => {
    "use strict";

    const CLAVE_USUARIOS = "usuariosRegistrados";
    const CLAVE_INTENTOS = "intentosGuardados";

    // Lee un array guardado en localStorage. Si no hay nada o el texto está
    // roto, devuelve [] en vez de romper la página.
    function leerLista(clave) {
        try {
            return JSON.parse(localStorage.getItem(clave)) || [];
        } catch (error) {
            console.error(`No se pudo leer "${clave}" de localStorage:`, error);
            return [];
        }
    }

    function guardarLista(clave, lista) {
        localStorage.setItem(clave, JSON.stringify(lista));
    }

    // Devuelve el array de usuarios del archivo, o null si no se pudo leer.
    // null (y no []) para distinguir "el archivo no tiene usuarios" de "no se
    // pudo leer": en el segundo caso no se deben generar ids, porque podrían
    // repetir los del archivo.
    async function cargarUsuariosDelJson() {
        try {
            const respuesta = await fetch("usuarios.json");
            // fetch NO lanza error con un 404: hay que revisar .ok a mano.
            if (!respuesta.ok) {
                throw new Error(`HTTP ${respuesta.status}`);
            }
            const datos = await respuesta.json();
            return datos.usuarios;
        } catch (error) {
            console.error("No se pudo leer usuarios.json (¿abriste la página con Live Server?):", error);
            return null;
        }
    }

    // El id más alto de una lista + 1. Con la lista vacía, Math.max(0) da 0 → 1.
    // El 0 inicial evita que Math.max() sin argumentos devuelva -Infinity.
    function siguienteId(lista) {
        return Math.max(0, ...lista.map((elemento) => elemento.id || 0)) + 1;
    }

    // Los usuarios registrados ANTES de que existieran los ids no tienen id:
    // se les asigna uno (continuando después del más alto) y se guarda.
    // Solo se hace si el JSON se leyó bien, para no chocar con sus ids.
    function asignarIdsFaltantes(delJson, locales) {
        if (locales.every((usuario) => usuario.id)) {
            return locales;
        }
        let proximo = siguienteId([...delJson, ...locales]);
        const conIds = locales.map((usuario) => (usuario.id ? usuario : { ...usuario, id: proximo++ }));
        guardarLista(CLAVE_USUARIOS, conIds);
        return conIds;
    }

    // Junta usuarios.json + localStorage y le pone a cada usuario la lista
    // completa de sus intentos, ordenada por fecha.
    // "origen" dice de dónde vino cada usuario (solo para mostrarlo en
    // gestion.html; no se exporta).
    async function obtenerUsuarios() {
        const respuestaJson = await cargarUsuariosDelJson();
        const jsonLeido = respuestaJson !== null;
        // ?? usa [] solo si respuestaJson es null o undefined
        const delJson = respuestaJson ?? [];
        let locales = leerLista(CLAVE_USUARIOS);

        if (jsonLeido) {
            locales = asignarIdsFaltantes(delJson, locales);
        }

        // Si ya exportaste y reemplazaste usuarios.json, los mismos usuarios
        // e intentos siguen también en localStorage: se descartan los que ya
        // están en el archivo (mismo id) para no mostrarlos dos veces.
        const idsJson = new Set(delJson.map((usuario) => usuario.id));
        const soloLocales = locales.filter((usuario) => !idsJson.has(usuario.id));

        const idsIntentosJson = new Set(
            delJson.flatMap((usuario) => (usuario.intentos || []).map((intento) => intento.id))
        );
        const intentosLocales = leerLista(CLAVE_INTENTOS)
            .filter((intento) => !idsIntentosJson.has(intento.id));

        const juntar = (usuario, origen) => {
            const propios = intentosLocales
                .filter((intento) => intento.usuarioId === usuario.id)
                // usuarioId sobra dentro de la lista de su propio usuario
                .map(({ usuarioId, ...resto }) => resto);

            return {
                ...usuario,
                intentos: [...(usuario.intentos || []), ...propios]
                    .sort((a, b) => a.fecha.localeCompare(b.fecha)),
                origen,
            };
        };

        return [
            ...delJson.map((usuario) => juntar(usuario, "usuarios.json")),
            ...soloLocales.map((usuario) => juntar(usuario, "localStorage")),
        ];
    }

    // Crea un usuario nuevo con id autogenerado. Devuelve el usuario creado.
    async function registrarUsuario({ nombre, alias, email, hashContrasena }) {
        const todos = await obtenerUsuarios();
        const nuevo = { id: siguienteId(todos), nombre, alias, email, hashContrasena };

        const locales = leerLista(CLAVE_USUARIOS);
        locales.push(nuevo);
        guardarLista(CLAVE_USUARIOS, locales);

        return { ...nuevo, intentos: [], origen: "localStorage" };
    }

    // Guarda una partida completada. El id del intento es único en TODO el
    // sistema (no por usuario), así cada intento se puede identificar solo.
    // Devuelve el intento creado y el historial completo del usuario.
    async function registrarIntento(usuarioId, { numeroIntentos, tiempoSegundos, pares }) {
        const todos = await obtenerUsuarios();
        const todosLosIntentos = todos.flatMap((usuario) => usuario.intentos);

        const intento = {
            id: siguienteId(todosLosIntentos),
            // ISO 8601 ("2026-09-25T15:42:10.000Z"): el formato estándar para
            // fechas en JSON. Está en UTC y se ordena bien como texto.
            fecha: new Date().toISOString(),
            numeroIntentos,
            tiempoSegundos,
            pares,
        };

        const guardados = leerLista(CLAVE_INTENTOS);
        guardados.push({ ...intento, usuarioId });
        guardarLista(CLAVE_INTENTOS, guardados);

        const usuario = todos.find((u) => u.id === usuarioId);
        return { intento, historial: [...(usuario?.intentos || []), intento] };
    }

    // Arma el contenido completo de usuarios.json (con 4 espacios de sangría,
    // como el archivo original). Se quita "origen", que es solo para mostrar.
    async function generarJson() {
        const usuarios = (await obtenerUsuarios()).map(({ origen, ...usuario }) => usuario);
        return JSON.stringify({ usuarios }, null, 4);
    }

    // Lo que otros archivos pueden usar
    return { obtenerUsuarios, registrarUsuario, registrarIntento, generarJson };
})();
