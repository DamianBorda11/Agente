// Verificación de login para gestion.html. Solo responde si los datos son
// correctos (true/false); quien decide abrir el CRUD es gestion.js.
//
// Se declaran con const (y no con function) para que no se puedan reemplazar
// desde la consola: "verificarLogin = async () => true" da TypeError.

// Convierte un texto en su hash SHA-256 (64 caracteres hexadecimales).
// Es de un solo sentido: del hash no se puede volver a la contraseña.
// Es async porque crypto.subtle.digest devuelve una Promise.
const calcularHash = async (texto) => {
    const bytes = new TextEncoder().encode(texto);
    const hashBuffer = await crypto.subtle.digest("SHA-256", bytes);
    return Array.from(new Uint8Array(hashBuffer))
        .map((byte) => byte.toString(16).padStart(2, "0"))
        .join("");
};

// Compara el usuario y el hash de la contraseña escrita con credenciales.js.
const verificarLogin = async (usuario, contrasena) => {
    const hashEscrito = await calcularHash(contrasena);
    return usuario === credenciales.usuario && hashEscrito === credenciales.hashContrasena;
};
