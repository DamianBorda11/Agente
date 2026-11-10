// Pestañas "Iniciar sesión" / "Registrarme": muestra un formulario y oculta el otro.
document.querySelectorAll('.tab-acceso').forEach(tab => {
tab.addEventListener('click', () => {
document.querySelectorAll('.tab-acceso').forEach(t => t.setAttribute('aria-selected', String(t === tab)));
document.querySelectorAll('.form-tab').forEach(form => {
form.hidden = form.dataset.tab !== tab.dataset.tab;
});
});
});

async function registrarCliente(nombre, correo, contrasena) {
// db.auth.signUp() NO toca ninguna tabla tuya todavía — habla directo con
// el sistema de autenticación interno de Supabase (algo así como una
// tabla especial, auth.users, que tú no administras a mano). Le mandas
// correo y contraseña, y Supabase por detrás: valida el formato del
// correo, guarda la contraseña de forma segura (nunca en texto plano),
// y crea un identificador único nuevo (un uuid) para esta persona.
//
// El resultado llega en dos partes, igual que en todas las llamadas a
// Supabase que ya conoces (data / error):
// - data.user → los datos del usuario recién creado. data.user.id
// es el uuid real — EL MISMO que vamos a usar como id
// en clientes_practica, dos líneas más abajo.
// - data.session → si tu proyecto exige confirmar el correo antes de
// dejar entrar (ver guía, sección 7), esto llega en
// null: el usuario ya existe, pero todavía no hay
// sesión iniciada hasta que confirme.
const { data, error } = await db.auth.signUp({
email: correo,
password: contrasena,
});
// Mismo patrón de "revisar error antes de seguir" que ya usaste en el
// CRUD de productos — si signUp() falló (correo repetido, contraseña
// muy corta, etc.), ni siquiera intentamos el segundo paso.
if (error) {
console.log('Error al registrar:', error);
return null;
}
// Ahora sí tocamos una tabla tuya: clientes_practica. Este insert() es
// igual al que ya usaste en agregarProducto() — la única diferencia es
// que aquí SÍ mandamos el id a mano (data.user.id), en vez de dejar que
// Supabase lo autogenere, porque este id tiene que coincidir exactamente
// con el que Auth le acaba de asignar al usuario.
const { data: cliente, error: errorCliente } = await db
.from('clientes_practica')
.insert([{ id: data.user.id, nombre, correo, rol: 'cliente' }])
.select();
if (errorCliente) {
console.log('Error al crear el perfil:', errorCliente);
return null;
}
return cliente[0];
}
// 'submit' es el evento que dispara un <form> cuando alguien hace clic en
// su botón de tipo submit (o presiona Enter dentro de un campo). Por
// defecto, ese evento hace que el navegador RECARGUE la página entera —
// comportamiento heredado de cuando los formularios mandaban sus datos a
// otra página de servidor, décadas atrás. Como aquí todo lo manejamos con
// JavaScript (sin recargar nada), hay que apagar ese comportamiento a
// propósito.
document.getElementById('form-registro').addEventListener('submit', async (event) => {
// event.preventDefault() le dice al navegador "no hagas lo que harías
// normalmente con este evento" — en este caso, no recargues la página.
// Sin esta línea, la página se refrescaría apenas se hiciera clic en
// "Crear cuenta", y perderías cualquier mensaje que fueras a mostrar.
event.preventDefault();
// event.target es el elemento que disparó el evento — en un 'submit',
// siempre es el propio <form>. Lo guardamos en una variable para poder
// usarlo más abajo (form.reset()) sin tener que volver a buscarlo.
const form = event.target;
const cliente = await registrarCliente(
document.getElementById('registro-nombre').value.trim(),
document.getElementById('registro-correo').value.trim(),
document.getElementById('registro-password').value
);
if (cliente) {
document.getElementById('estado-sesion').textContent =
'Cuenta creada. Ahora inicia sesión con ese correo y contraseña.';
form.reset(); // vacía los 3 campos del formulario, para la próxima persona
document.querySelector('.tab-acceso[data-tab="login"]').click();
} else {
document.getElementById('estado-sesion').textContent =
'No se pudo crear la cuenta. Revisa la consola.';
}
});

async function iniciarSesion(correo, contrasena) {
// db.auth.signInWithPassword() es para alguien que YA se registró antes
// (sección 4.1) — no crea ningún usuario nuevo, solo verifica que el
// correo y la contraseña coincidan con uno que ya existe en Auth.
//
// Lo importante pasa "por detrás", sin que se vea en este código: si la
// verificación sale bien, el cliente de Supabase (la variable db, la
// misma de siempre) GUARDA la sesión internamente — normalmente en el
// almacenamiento del navegador — y, desde este momento, la adjunta sola
// a cada petición futura que hagas con db, sea a productos_practica, a
// clientes_practica o a cualquier otra tabla. No hay que "pasarle" el
// usuario a mano a ninguna otra función.
const { data, error } = await db.auth.signInWithPassword({
email: correo,
password: contrasena,
});
if (error) {
console.log('Error al iniciar sesión:', error);
return null;
}
// Aquí data.user también trae el id real del usuario — el mismo valor
// que auth.uid() va a devolver dentro de cualquier política de RLS
// mientras esta sesión siga activa.
return data.user;
}
// Mismo patrón explicado en el formulario de registro: 'submit' es el
// evento del <form>, y hay que apagar la recarga automática de página.
document.getElementById('form-login').addEventListener('submit', async (event) => {
event.preventDefault(); // evita que el navegador recargue la página
const form = event.target; // el propio <form>, guardado para usar después
const usuario = await iniciarSesion(
document.getElementById('login-correo').value.trim(),
document.getElementById('login-password').value
);
if (usuario) {
form.reset();
mostrarEstadoSesion(); // definida en la sección 5
} else {
document.getElementById('estado-sesion').textContent =
'Correo o contraseña incorrectos.';
}

});

async function mostrarEstadoSesion() {
const { data } = await db.auth.getUser();
const estado = document.getElementById('estado-sesion');
// Con sesión: se oculta registro/login y aparece el panel con sidebar.
// Sin sesión: al revés. Un solo booleano decide los dos bloques.
const conSesion = Boolean(data.user);
document.getElementById('panel-cuenta').hidden = conSesion;
document.getElementById('app-cliente').hidden = !conSesion;
if (conSesion) {
estado.textContent = `Sesión iniciada como ${data.user.email}`;
document.getElementById('sidebar-usuario').textContent = data.user.email;
// Primero LEER, después mostrar: los campos se llenan con lo que hay en la tabla.
const perfil = await leerPerfil(data.user.id);
if (perfil) {
llenarFormularioPerfil(perfil);
} else {
document.getElementById('perfil-mensaje').textContent =
'No se pudo leer tu perfil (revisa la consola y la política RLS de select).';
}
} else {
estado.textContent = 'No has iniciado sesión.';
}
}

// ---------------------------------------------------------------------
// PERFIL: leer y actualizar la fila del cliente en clientes_practica
// ---------------------------------------------------------------------

// Trae la fila del cliente con ese id (el mismo uuid que le dio Auth).
// .single() = esperamos exactamente UNA fila: si llegan 0 (no existe, o
// RLS la oculta), Supabase lo devuelve como error en vez de un arreglo vacío.
async function leerPerfil(id) {
const { data, error } = await db
.from('clientes_practica')
.select('id, nombre, correo, telefono, direccion, rol')
.eq('id', id)
.single();
if (error) {
console.log('Error al leer el perfil:', error);
return null;
}
return data;
}

// Pone los datos leídos en los campos del formulario.
function llenarFormularioPerfil(perfil) {
document.getElementById('perfil-nombre').value = perfil.nombre || '';
document.getElementById('perfil-correo').value = perfil.correo || '';
document.getElementById('perfil-telefono').value = perfil.telefono || '';
document.getElementById('perfil-direccion').value = perfil.direccion || '';
document.getElementById('perfil-rol').value = perfil.rol || '';
}

// Actualiza los datos editables (nombre, telefono, direccion) del cliente
// con sesión iniciada. correo y rol NO van aquí: se muestran, pero no se tocan.
// El id no viene del formulario sino de la sesión: así nadie puede
// "apuntar" a la fila de otra persona cambiando un campo oculto.
async function actualizarPerfil(cambios) {
const { data: sesion } = await db.auth.getUser();
if (!sesion.user) return null;
const { data, error } = await db
.from('clientes_practica')
.update(cambios)
.eq('id', sesion.user.id)
.select(); // pide la fila actualizada para confirmar que sí cambió
if (error) {
console.log('Error al actualizar el perfil:', error);
return null;
}
// Sin error NO significa que se actualizó: si RLS bloquea, llega data = [].
return data?.[0] ?? null;
}

document.getElementById('form-perfil').addEventListener('submit', async (event) => {
event.preventDefault();
const mensaje = document.getElementById('perfil-mensaje');
const perfil = await actualizarPerfil({
nombre: document.getElementById('perfil-nombre').value.trim(),
telefono: document.getElementById('perfil-telefono').value.trim(),
direccion: document.getElementById('perfil-direccion').value.trim(),
});
if (perfil) {
llenarFormularioPerfil(perfil); // muestra lo que quedó guardado en la tabla
mensaje.textContent = 'Datos actualizados.';
} else {
mensaje.textContent = 'No se pudo actualizar (revisa la consola y la política RLS de update).';
}
});
// ---------------------------------------------------------------------
// SIDEBAR: cada ítem muestra la sección (.vista) cuyo id está en data-vista
// ---------------------------------------------------------------------

// Muestra una sola vista y marca su ítem como activo; oculta las demás.
function mostrarVista(idVista) {
document.querySelectorAll('.vista').forEach(vista => {
vista.hidden = vista.id !== idVista;
});
document.querySelectorAll('.sidebar-item').forEach(item => {
item.classList.toggle('activo', item.dataset.vista === idVista);
});
}

// Delegación de eventos: un solo listener en el <nav> atiende a todos los
// ítems, también a los que agregues después en el HTML.
document.querySelector('.sidebar-nav').addEventListener('click', (event) => {
const item = event.target.closest('.sidebar-item');
if (item) mostrarVista(item.dataset.vista);
});

// Al cargar la página, revisa si ya había una sesión activa
mostrarEstadoSesion();

document.getElementById('btn-logout').addEventListener('click', async () => {
await db.auth.signOut();
mostrarEstadoSesion();
});