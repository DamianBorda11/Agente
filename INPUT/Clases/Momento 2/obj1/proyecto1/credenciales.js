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
    hashContrasena: "8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92",
});
