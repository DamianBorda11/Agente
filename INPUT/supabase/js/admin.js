// Pestañas "Iniciar sesión" / "Registrarme": muestra un formulario y oculta el otro.
document.querySelectorAll('.tab-acceso').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab-acceso').forEach(t => t.setAttribute('aria-selected', String(t === tab)));
    document.querySelectorAll('.form-tab').forEach(form => {
      form.hidden = form.dataset.tab !== tab.dataset.tab;
    });
  });
});

document.getElementById('form-registro-admin').addEventListener('submit', async (evento) => {
  evento.preventDefault();
  const form = evento.target;

  const { data, error } = await db.auth.signUp({
    email: form.elements['admin-registro-correo'].value,
    password: form.elements['admin-registro-password'].value,
  });

  if (error) {
    document.getElementById('estado-sesion-admin').innerText = 'Error al registrar: ' + error.message;
    return;
  }

  const { error: errorPerfil } = await db.from('admins_practica').insert([{
    id: data.user.id,
    nombre: form.elements['admin-registro-nombre'].value.trim(),
    correo: form.elements['admin-registro-correo'].value.trim(),
  }]);

  if (errorPerfil) {
    document.getElementById('estado-sesion-admin').innerText = 'Cuenta creada, pero falló el perfil: ' + errorPerfil.message;
    return;
  }

  document.getElementById('estado-sesion-admin').innerText = 'Cuenta de administrador creada. Ya puedes iniciar sesión.';
  form.reset();
  document.querySelector('.tab-acceso[data-tab="login"]').click();
});

document.getElementById('form-login-admin').addEventListener('submit', async (evento) => {
  evento.preventDefault();
  const form = evento.target;

  const { error } = await db.auth.signInWithPassword({
    email: form.elements['admin-login-correo'].value,
    password: form.elements['admin-login-password'].value,
  });

  if (error) {
    document.getElementById('estado-sesion-admin').innerText = 'Error al iniciar sesión: ' + error.message;
    return;
  }

  form.reset();
  mostrarEstadoSesionAdmin();
});

async function mostrarEstadoSesionAdmin() {
  const { data } = await db.auth.getUser();
  const estado = document.getElementById('estado-sesion-admin');

  // Importante: tener sesión no basta — confirmamos que además exista
  // su fila en admins_practica. Sin sesión ni siquiera preguntamos.
  let perfil = null;
  if (data.user) {
    const respuesta = await db.from('admins_practica').select('nombre').eq('id', data.user.id).single();
    perfil = respuesta.data;
  }

  // Un solo booleano decide qué se ve: acceso (registro/login) o panel CRUD.
  const esAdmin = Boolean(data.user && perfil);
  document.getElementById('zona-acceso-admin').hidden = esAdmin;
  document.getElementById('panel-admin').hidden = !esAdmin;
  // Logout visible con CUALQUIER sesión: así quien entró sin perfil de admin puede salir.
  document.getElementById('btn-logout-admin').hidden = !data.user;

  if (!data.user) {
    estado.innerText = 'No has iniciado sesión.';
  } else if (esAdmin) {
    estado.innerText = 'Sesión iniciada como ' + perfil.nombre + ' (admin).';
    // Ya no hace falta un botón "Ver estantería": en cuanto se confirma el
    // acceso de admin, el catálogo se trae solo.
    cargarProductos(true);
  } else {
    estado.innerText = 'Sesión iniciada, pero sin perfil de administrador.';
  }
}

document.getElementById('btn-logout-admin').addEventListener('click', async () => {
  await db.auth.signOut();
  limpiarPanelAdmin();
  mostrarEstadoSesionAdmin();
});

// Al cerrar sesión, borra los datos ya pintados: ocultar con hidden no los
// quita del DOM, seguirían visibles en el inspector (F12).
function limpiarPanelAdmin() {
  productosCargados = [];
  document.getElementById('lista-productos').innerHTML = '';
  document.getElementById('resultado').textContent = '';
  document.getElementById('json-crudo').hidden = true;
  document.getElementById('filtros').hidden = true;
  document.getElementById('notificacion').textContent = '';
  terminarEdicion();
}

mostrarEstadoSesionAdmin();










// =====================================================================
// VIDEOCLUB — catálogo de películas en renta (CRUD con Supabase)
// Usa la tabla "practica-productos". Cada columna guarda un dato de la película:
//   nombre      → título (año)
//   descripcion → director y sinopsis
//   precio      → renta por noche, en pesos colombianos
//   unidades    → copias en la tienda
//   disponible  → true = en estante, false = rentada
//   categorias  → géneros, ej. ['tim burton', 'terror']
//   img-url     → póster (opcional; sin él se dibuja una carátula VHS)
// =====================================================================

// ---------------------------------------------------------------------
// MODO OSCURO / CLARO
// ---------------------------------------------------------------------
// El tema se guarda en localStorage para recordarlo al recargar.
// No hace falta esperar a DOMContentLoaded: este archivo se carga al final
// del <body>, así que el botón ya existe cuando el código corre.
document.documentElement.dataset.theme = localStorage.getItem('tema') || 'dark';

const botonTema = document.getElementById('btn-tema');

function actualizarBotonTema() {
  const esOscuro = document.documentElement.dataset.theme === 'dark';
  // El botón muestra el modo al que vas a cambiar
  botonTema.textContent = esOscuro ? '☀ Modo claro' : '☾ Modo oscuro';
  botonTema.setAttribute('aria-pressed', String(!esOscuro));
}

actualizarBotonTema();

botonTema.addEventListener('click', () => {
  const nuevoTema = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  document.documentElement.dataset.theme = nuevoTema;
  localStorage.setItem('tema', nuevoTema);
  actualizarBotonTema();

  // Interferencia de pantalla al cambiar de tema. El reflow (offsetWidth)
  // entre quitar y poner la clase permite repetir la animación en cada clic.
  document.body.classList.remove('interferencia');
  void document.body.offsetWidth;
  document.body.classList.add('interferencia');
});

// Formatea un número como pesos colombianos: 5000 → "$ 5.000".
// Intl.NumberFormat ya conoce el formato de cada país (puntos de miles, símbolo).
const formatoPesos = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0
});

// Creamos el formulario desde JavaScript para que el HTML quede limpio.
function crearFormularioProducto() {
  const contenedor = document.getElementById('form-container');

  // Si el contenedor no existe, no intentamos generarlo.
  if (!contenedor) return;

  const form = document.createElement('form');
  form.id = 'form-producto';

  const campos = [
    { id: 'nombre', label: 'Título (año)', type: 'text', required: true, placeholder: 'Beetlejuice (1988)' },
    { id: 'descripcion-input', label: 'Director y sinopsis', type: 'textarea', required: true },
    { id: 'precio-input', label: 'Renta por noche (COP)', type: 'number', step: '100', min: '0', required: true, placeholder: '5000' },
    { id: 'unidades-input', label: 'Copias', type: 'number', min: '0', required: true, placeholder: '2' },
    { id: 'descuento', label: 'Descuento (0 a 1)', type: 'number', step: '0.01', min: '0', max: '1', placeholder: '0.1' },
    { id: 'categorias', label: 'Géneros', type: 'text', placeholder: 'terror, romance' },
    { id: 'img-url', label: 'URL del póster', type: 'url', placeholder: 'https://example.com/poster.jpg' }
  ];

  // Recorrer cada campo y crear sus etiquetas e inputs dinámicamente.
  campos.forEach(campo => {
    const label = document.createElement('label');
    label.textContent = campo.label + ': ';

    let input;

    if (campo.type === 'textarea') {
      input = document.createElement('textarea');
      input.required = Boolean(campo.required);
    } else {
      input = document.createElement('input');
      input.type = campo.type;
      input.required = Boolean(campo.required);
      input.step = campo.step || '';
      input.min = campo.min || '';
      input.max = campo.max || '';
      input.placeholder = campo.placeholder || '';
    }

    input.id = campo.id;
    input.name = campo.id;

    label.appendChild(input);
    form.appendChild(label);
    form.appendChild(document.createElement('br'));
  });

  // Checkbox separado porque se comporta distinto a un input de texto.
  const checkWrap = document.createElement('label');
  checkWrap.textContent = 'En estante (disponible para rentar): ';

  const disponible = document.createElement('input');
  disponible.id = 'disponible';
  disponible.type = 'checkbox';
  disponible.name = 'disponible';
  disponible.checked = true;

  checkWrap.appendChild(disponible);
  form.appendChild(checkWrap);
  form.appendChild(document.createElement('br'));

  // Los dos botones van juntos en una fila.
  const acciones = document.createElement('div');
  acciones.className = 'form-acciones';

  const boton = document.createElement('button');
  boton.type = 'submit';
  boton.id = 'btn-guardar';
  boton.textContent = 'Agregar película';

  // Cancelar solo se muestra mientras se edita una película.
  const cancelar = document.createElement('button');
  cancelar.type = 'button';
  cancelar.id = 'btn-cancelar';
  cancelar.textContent = 'Cancelar';
  cancelar.hidden = true;

  acciones.appendChild(boton);
  acciones.appendChild(cancelar);
  form.appendChild(acciones);

  contenedor.appendChild(form);

  return form;
}

// Rellena el formulario con los datos de una película (se usa al editar).
function llenarFormulario(producto) {
  const nombre = document.getElementById('nombre');
  const descripcion = document.getElementById('descripcion-input');
  const precio = document.getElementById('precio-input');
  const unidades = document.getElementById('unidades-input');
  const descuento = document.getElementById('descuento');
  const disponible = document.getElementById('disponible');
  const categorias = document.getElementById('categorias');
  const imgUrl = document.getElementById('img-url');

  if (nombre) nombre.value = producto.nombre || '';
  if (descripcion) descripcion.value = producto.descripcion || '';
  if (precio) precio.value = producto.precio ?? 0;
  if (unidades) unidades.value = producto.unidades ?? 0;
  if (descuento) descuento.value = producto.descuento ?? 0;
  if (disponible) disponible.checked = Boolean(producto.disponible);
  if (categorias) {
    categorias.value = Array.isArray(producto.categorias)
      ? producto.categorias.join(', ')
      : (producto.categorias || '');
  }
  if (imgUrl) imgUrl.value = producto['img-url'] || '';
}

// Recolecta los datos ingresados en el formulario para insertarlos en Supabase.
function obtenerDatosFormulario() {
  const categorias = document.getElementById('categorias').value
    .split(',')
    .map(item => item.trim().toLowerCase()) // minúsculas: "Terror" y "terror" cuentan como el mismo género
    .filter(Boolean);

  return {
    nombre: document.getElementById('nombre').value.trim(),
    descripcion: document.getElementById('descripcion-input').value.trim(),
    precio: Number(document.getElementById('precio-input').value),
    unidades: Number(document.getElementById('unidades-input').value),
    descuento: Number(document.getElementById('descuento').value || 0),
    disponible: document.getElementById('disponible').checked,
    categorias,
    'img-url': document.getElementById('img-url').value.trim()
  };
}

// Inserta una película en la tabla de Supabase.
async function agregarProducto(datos) {
  const { data, error } = await db
    .from('practica-productos')
    .insert([datos])
    .select();

  if (error) {
    console.log('Error al agregar:', error);
    return null;
  }

  return data?.[0] ?? null;
}

// Trae las películas y las muestra en pantalla.
// Es una función con nombre para poder volver a llamarla después de editar o borrar.
// animar = true solo cuando se presiona el botón: al refrescar después de editar
// no queremos que todas las tarjetas vuelvan a aparecer de nuevo.
async function cargarProductos(animar = false) {
  // .order('id'): sin esto la base de datos no garantiza ningún orden, y una
  // película recién actualizada suele "saltar" al final de la lista.
  const { data, error } = await db
    .from('practica-productos')
    .select('*')
    .order('id', { ascending: true });

  const lista = document.getElementById('lista-productos');

  if (error) {
    lista.textContent = 'Error: ' + error.message;
    return;
  }

  // JSON crudo para depurar: queda guardado en el desplegable "Ver JSON".
  document.getElementById('resultado').textContent = JSON.stringify(data, null, 2);
  document.getElementById('json-crudo').hidden = false;
  document.getElementById('filtros').hidden = false;

  // Guardamos las películas en memoria: los filtros trabajan sobre esta copia
  // sin volver a consultar a Supabase.
  productosCargados = data;
  llenarPillsCategorias(data);
  aplicarFiltros(animar);
}

// ---------------------------------------------------------------------
// FILTROS DEL CATÁLOGO (en el navegador, sobre productosCargados)
// Este es el ÚNICO buscador: el filtro "Buscar" revisa título y sinopsis.
// ---------------------------------------------------------------------
let productosCargados = [];

// Quita tildes y pasa a minúsculas: así "fantasia" encuentra "Fantasía".
// normalize('NFD') separa cada letra de su tilde; el regex borra las tildes.
function normalizar(texto) {
  return String(texto ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

// Género y disponibilidad son botones (pills), no <select>: no tienen un
// ".value" propio, así que guardamos la selección actual de cada uno aquí.
const filtrosPill = { categoria: '', disponible: '' };

// Un solo clic marca ese botón como activo (y solo ese) dentro de su grupo,
// guarda el valor elegido y vuelve a filtrar.
function configurarPills(contenedorId, grupo) {
  document.getElementById(contenedorId).addEventListener('click', (evento) => {
    const boton = evento.target.closest('.pill');
    if (!boton) return;

    filtrosPill[grupo] = boton.dataset.valor;
    document.querySelectorAll(`#${contenedorId} .pill`).forEach(p => p.classList.toggle('activo', p === boton));
    aplicarFiltros();
  });
}

configurarPills('filtro-categoria-pills', 'categoria');
configurarPills('filtro-disponible-pills', 'disponible');

// Rellena los botones de género con los que existen en los datos, sin repetir.
// Set = colección que descarta duplicados automáticamente.
function llenarPillsCategorias(productos) {
  const contenedor = document.getElementById('filtro-categoria-pills');
  const seleccionActual = filtrosPill.categoria; // para no perder la elección al refrescar

  const categorias = new Set(productos.flatMap(p => Array.isArray(p.categorias) ? p.categorias : []));

  contenedor.innerHTML = '<button type="button" class="pill" data-valor="">Todos</button>' +
    [...categorias].sort().map(c => `<button type="button" class="pill" data-valor="${c}">${c}</button>`).join('');

  // Si el género ya no existe (se borró esa película), vuelve a "Todos".
  const valorValido = categorias.has(seleccionActual) ? seleccionActual : '';
  filtrosPill.categoria = valorValido;
  contenedor.querySelectorAll('.pill').forEach(p => p.classList.toggle('activo', p.dataset.valor === valorValido));
}

// Lee los filtros, filtra, ordena y pinta. Se llama en cada cambio de un filtro.
function aplicarFiltros(animar = false) {
  const texto = normalizar(document.getElementById('filtro-texto').value.trim());
  const categoria = filtrosPill.categoria;
  const disponibilidad = filtrosPill.disponible;
  const precioMin = document.getElementById('filtro-precio-min').value;
  const precioMax = document.getElementById('filtro-precio-max').value;
  const orden = document.getElementById('filtro-orden').value;

  // filter() se queda solo con las películas que cumplen TODAS las condiciones.
  // Cada condición "vacía" devuelve true, o sea, no filtra nada.
  const filtrados = productosCargados.filter(p => {
    const coincideTexto = !texto ||
      normalizar(p.nombre).includes(texto) ||
      normalizar(p.descripcion).includes(texto);

    const coincideCategoria = !categoria ||
      (Array.isArray(p.categorias) && p.categorias.includes(categoria));

    const coincideDisponible = !disponibilidad ||
      (disponibilidad === 'si' ? p.disponible : !p.disponible);

    // Ojo: '' es "sin límite"; por eso no basta con Number(precioMin).
    const coincidePrecio =
      (precioMin === '' || p.precio >= Number(precioMin)) &&
      (precioMax === '' || p.precio <= Number(precioMax));

    return coincideTexto && coincideCategoria && coincideDisponible && coincidePrecio;
  });

  // sort() cambia el arreglo original, por eso ordenamos una copia ([...]).
  const ordenados = [...filtrados].sort((a, b) => {
    if (orden === 'precio-asc') return a.precio - b.precio;
    if (orden === 'precio-desc') return b.precio - a.precio;
    if (orden === 'nombre') return a.nombre.localeCompare(b.nombre, 'es');
    return a.id - b.id;
  });

  document.getElementById('contador-productos').textContent =
    `Mostrando ${ordenados.length} de ${productosCargados.length} películas`;

  pintarTarjetas(ordenados, animar);
}

// Escuchamos "input" en todo el contenedor: los eventos suben (burbujean)
// desde cada campo, así un solo listener atiende a todos los filtros.
document.getElementById('filtros').addEventListener('input', () => aplicarFiltros());

document.getElementById('btn-limpiar-filtros').addEventListener('click', () => {
  document.getElementById('filtros').querySelectorAll('input, select').forEach(campo => {
    campo.value = '';
  });
  document.getElementById('filtro-orden').value = 'id';

  filtrosPill.categoria = '';
  filtrosPill.disponible = '';
  document.querySelectorAll('.pill').forEach(p => p.classList.toggle('activo', p.dataset.valor === ''));

  aplicarFiltros();
});

// ---------------------------------------------------------------------
// VISTA DEL CATÁLOGO: CUADRÍCULA O LISTA
// La preferencia se guarda en localStorage, igual que el tema claro/oscuro.
// ---------------------------------------------------------------------
function aplicarVistaCatalogo(vista) {
  document.getElementById('lista-productos').classList.toggle('vista-lista', vista === 'lista');
  document.getElementById('btn-vista-grid').setAttribute('aria-pressed', String(vista === 'grid'));
  document.getElementById('btn-vista-lista').setAttribute('aria-pressed', String(vista === 'lista'));
}

aplicarVistaCatalogo(localStorage.getItem('vista-catalogo') || 'grid');

document.getElementById('btn-vista-grid').addEventListener('click', () => {
  localStorage.setItem('vista-catalogo', 'grid');
  aplicarVistaCatalogo('grid');
});

document.getElementById('btn-vista-lista').addEventListener('click', () => {
  localStorage.setItem('vista-catalogo', 'lista');
  aplicarVistaCatalogo('lista');
});

// Dibuja las tarjetas (cajas VHS) de las películas que recibe.
function pintarTarjetas(productos, animar = false) {
  const lista = document.getElementById('lista-productos');

  if (!productosCargados.length) {
    lista.innerHTML = '<p class="sin-resultados">La estantería está vacía.</p>';
    return;
  }

  if (!productos.length) {
    lista.innerHTML = '<p class="sin-resultados">Ninguna película coincide con los filtros.</p>';
    return;
  }

  lista.classList.toggle('animar-entrada', animar);

  // Una tarjeta por película: todos sus datos quedan juntos.
  // --i es la posición de la tarjeta: el CSS la usa para que aparezcan una tras otra.
  lista.innerHTML = productos.map((producto, i) => {
    const generos = Array.isArray(producto.categorias) ? producto.categorias : [];

    return `
    <article class="tarjeta-producto" data-id="${producto.id}" style="--i: ${i}">
      <div class="tarjeta-imagen ${producto['img-url'] ? '' : 'sin-imagen'} ${producto.disponible ? '' : 'rentada'}">
        ${producto['img-url']
          ? `<img src="${producto['img-url']}" alt="Póster de ${producto.nombre}" onerror="this.parentElement.classList.add('sin-imagen')">`
          : ''}
        <!-- Carátula VHS: solo se ve si no hay póster o si la URL está rota -->
        <div class="caratula-vhs" aria-hidden="true">
          <span class="vhs-logo">VHS</span>
          <span class="vhs-titulo">${producto.nombre}</span>
          <span class="vhs-genero">${generos.join(' / ')}</span>
        </div>
        <!-- Sello sobre la carátula: solo se dibuja si la película está rentada -->
        ${producto.disponible ? '' : '<span class="sello-rentada">Rentada</span>'}
      </div>
      <div class="tarjeta-info">
        <h4>${producto.nombre}</h4>
        <p class="precio-lista">${formatoPesos.format(producto.precio)} / noche</p>
        <p>${producto.descripcion}</p>
        <dl>
          <dt>Renta</dt><dd>${formatoPesos.format(producto.precio)} / noche</dd>
          <dt>Copias</dt><dd>${producto.unidades}</dd>
          ${producto.descuento ? `<dt>Descuento</dt><dd>${Math.round(producto.descuento * 100)}%</dd>` : ''}
        </dl>
        ${generos.length ? `<p class="categorias">${generos.join(' · ')}</p>` : ''}
        <span class="estado ${producto.disponible ? 'disponible' : 'agotado'}">
          ${producto.disponible ? 'En estante' : 'Rentada'}
        </span>
        <p class="sticker-rebobinar">¡Rebobine antes de devolver!</p>
        <div class="tarjeta-acciones">
          <button type="button" class="btn-editar" data-id="${producto.id}">Editar</button>
          <button type="button" class="btn-eliminar" data-id="${producto.id}" data-nombre="${producto.nombre}">Eliminar</button>
        </div>
      </div>
    </article>
  `;
  }).join('');
}

// Cada vez que cambia el texto de la notificación, reinicia su animación.
// Quitar la clase, forzar un reflow (offsetWidth) y volver a ponerla
// hace que el navegador la trate como una animación nueva.
const notificacionEl = document.getElementById('notificacion');
new MutationObserver(() => {
  notificacionEl.classList.remove('transmision');
  void notificacionEl.offsetWidth;
  notificacionEl.classList.add('transmision');
}).observe(notificacionEl, { childList: true, characterData: true, subtree: true });

// Generamos el formulario al cargar la página (vacío, listo para escribir).
const formularioProducto = crearFormularioProducto();

// ---------------------------------------------------------------------
// MOSTRAR/OCULTAR EL FORMULARIO ("Mostrador")
// ---------------------------------------------------------------------
// Empieza oculto (ver admin.html) para que la lista tenga todo el espacio;
// se abre con este botón o solo al editar una película.
function abrirFormulario() {
  document.getElementById('form-container').hidden = false;
  document.getElementById('btn-toggle-form').textContent = '✕ Cerrar formulario';
}

function cerrarFormulario() {
  document.getElementById('form-container').hidden = true;
  document.getElementById('btn-toggle-form').textContent = '+ Agregar película';
}

document.getElementById('btn-toggle-form').addEventListener('click', () => {
  const abierto = !document.getElementById('form-container').hidden;
  if (abierto) cerrarFormulario(); else abrirFormulario();
});

// ---------------------------------------------------------------------
// MODO EDICIÓN
// ---------------------------------------------------------------------
// null = el formulario CREA una película nueva.
// un id = el formulario ACTUALIZA esa película.
let idEnEdicion = null;

// Carga una película en el formulario y pasa a modo "actualizar".
async function empezarEdicion(id) {
  const producto = await buscarProductoPorId(id);

  if (!producto) {
    document.getElementById('notificacion').textContent = 'No se encontró la película a editar.';
    return;
  }

  idEnEdicion = producto.id;
  llenarFormulario(producto);

  document.getElementById('btn-guardar').textContent = 'Actualizar película';
  document.getElementById('btn-cancelar').hidden = false;
  formularioProducto.classList.add('editando');
  abrirFormulario();
  formularioProducto.scrollIntoView({ behavior: 'smooth' });
}

// Vuelve a modo "crear", limpia el formulario y lo oculta de nuevo.
function terminarEdicion() {
  idEnEdicion = null;
  formularioProducto.reset();
  document.getElementById('disponible').checked = true;

  document.getElementById('btn-guardar').textContent = 'Agregar película';
  document.getElementById('btn-cancelar').hidden = true;
  formularioProducto.classList.remove('editando');
  cerrarFormulario();
}

// Escucha el envío del formulario: actualiza si hay id en edición, si no, agrega.
if (formularioProducto) {
  document.getElementById('btn-cancelar').addEventListener('click', terminarEdicion);

  formularioProducto.addEventListener('submit', async (event) => {
    event.preventDefault();

    const datos = obtenerDatosFormulario();
    const notificacion = document.getElementById('notificacion');

    if (idEnEdicion !== null) {
      const respuesta = await modificarProducto(idEnEdicion, datos);

      if (respuesta) {
        console.log('Película actualizada:', respuesta);
        notificacion.textContent = 'Película actualizada: ' + JSON.stringify(respuesta, null, 2);
        terminarEdicion();
        refrescarCatalogo();
      } else {
        notificacion.textContent = 'Error al actualizar la película (revisa la consola y la política RLS de update).';
      }
      return;
    }

    const respuesta = await agregarProducto(datos);

    if (respuesta) {
      console.log('Película agregada:', respuesta);
      notificacion.textContent = 'Película agregada: ' + JSON.stringify(respuesta, null, 2);
      formularioProducto.reset();
      document.getElementById('disponible').checked = true;
      refrescarCatalogo();
    } else {
      notificacion.textContent = 'Error al agregar la película.';
    }
  });
}

// Después de crear, actualizar o borrar, recarga las tarjetas
// (solo si el catálogo ya se cargó alguna vez) para que se vean los datos nuevos.
function refrescarCatalogo() {
  if (!document.getElementById('json-crudo').hidden) cargarProductos();
}

// Delegación de eventos: un solo listener en el contenedor atiende a todos
// los botones Editar y Eliminar, aunque se creen después con innerHTML.
function manejarAccionesProducto(event) {
  const botonEditar = event.target.closest('.btn-editar');
  if (botonEditar) return empezarEdicion(botonEditar.dataset.id);

  // Eliminar no borra directo: primero muestra la advertencia en la misma tarjeta.
  const botonEliminar = event.target.closest('.btn-eliminar');
  if (botonEliminar) {
    const item = botonEliminar.closest('.tarjeta-producto');
    return mostrarConfirmacion(item, botonEliminar.dataset.id, botonEliminar.dataset.nombre);
  }

  const botonConfirmar = event.target.closest('.btn-confirmar-eliminar');
  if (botonConfirmar) return confirmarEliminacion(botonConfirmar.dataset.id, botonConfirmar.dataset.nombre);

  const botonCancelar = event.target.closest('.btn-cancelar-eliminar');
  if (botonCancelar) botonCancelar.closest('.confirmar-eliminar').remove();
}

// Crea la capa "¿Seguro?" ENCIMA de la tarjeta.
// Como los botones se crean con innerHTML, los atiende la misma delegación de eventos.
function mostrarConfirmacion(item, id, nombre) {
  if (!item || item.querySelector('.confirmar-eliminar')) return; // ya está abierta

  const capa = document.createElement('div');
  capa.className = 'confirmar-eliminar';
  capa.innerHTML = `
    <p class="confirmar-alerta">⚠ Alerta del sistema</p>
    <p class="confirmar-pregunta">¿Sacar "${nombre}" del catálogo?</p>
    <p class="confirmar-nota">Esta acción no se puede deshacer.</p>
    <div class="confirmar-botones">
      <button type="button" class="btn-confirmar-eliminar" data-id="${id}" data-nombre="${nombre}">Confirmar</button>
      <button type="button" class="btn-cancelar-eliminar">Cancelar</button>
    </div>
  `;
  item.appendChild(capa);
}

document.getElementById('lista-productos').addEventListener('click', manejarAccionesProducto);

// Se llama desde el botón Confirmar de la capa: aquí sí se borra.
async function confirmarEliminacion(id, nombre) {
  const notificacion = document.getElementById('notificacion');
  const seElimino = await eliminarProducto(id);

  if (seElimino) {
    notificacion.textContent = `Película eliminada: ${nombre}`;
    // Si justo estabas editando esa película, el formulario vuelve a modo "crear".
    if (String(idEnEdicion) === String(id)) terminarEdicion();

    // Animación de "falla digital" en la tarjeta antes de volver a pintar la lista.
    document.querySelector(`.tarjeta-producto[data-id="${id}"]`)?.classList.add('desintegrando');
    await new Promise(resolve => setTimeout(resolve, 700)); // dura lo mismo que la animación en CSS

    refrescarCatalogo();
  } else {
    notificacion.textContent = 'No se pudo eliminar (revisa la consola y la política RLS de delete).';
    // Cierra la capa de confirmación para que la tarjeta vuelva a la normalidad.
    document.querySelectorAll('.confirmar-eliminar').forEach(capa => capa.remove());
  }
}

// ---------------------------------------------------------------------
// FUNCIONES DE SUPABASE (Read por id, Update, Delete)
// ---------------------------------------------------------------------

// Trae una sola película por su id (se usa al presionar Editar).
async function buscarProductoPorId(id) {
  const { data, error } = await db
    .from('practica-productos')
    .select('*')
    .eq('id', id)
    .single();

  if (error) return null;
  return data;
}

// Actualiza solo las propiedades que vengan en "cambios" de la película con ese id.
async function modificarProducto(id, cambios) {
  const { data, error } = await db
    .from('practica-productos')
    .update(cambios)
    .eq('id', id)
    .select();

  if (error) {
    console.log('Error al modificar:', error);
    return null;
  }

  // Si el id no existe o RLS bloquea la fila, data llega como [] sin error.
  return data?.[0] ?? null;
}

// Borra la película con ese id. Devuelve true solo si de verdad se borró una fila.
async function eliminarProducto(id) {
  const { data, error } = await db
    .from('practica-productos')
    .delete()
    .eq('id', id)
    .select(); // pide de vuelta las filas borradas para poder contarlas

  if (error) {
    console.log('Error al eliminar:', error);
    return false;
  }

  // Sin error NO significa que se borró: si RLS bloquea o el id no existe,
  // Supabase borra 0 filas y responde data = [].
  return data.length > 0;
}
