// Datos de acceso a gestion.html. La contraseña NO se guarda en texto plano:
// se guarda su hash SHA-256, así leer este archivo no la revela.
// Para cambiarla, pega esto en la consola (con tu contraseña nueva) y copia
// el resultado en hashContrasena:
//   crypto.subtle.digest("SHA-256", new TextEncoder().encode("NUEVA"))
//       .then((b) => console.log([...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, "0")).join("")));
//
// Object.freeze impide cambiar estos valores desde la consola
// (por ejemplo, reemplazar el hash por el de otra contraseña).
const credenciales = Object.freeze({
    usuario: "admin",
    hashContrasena: "03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4",
});
