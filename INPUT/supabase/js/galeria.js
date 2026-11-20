// =====================================================================
// galeria.js — catálogo de merch (Mr. Somniel) + carrito de compras.
// Lo usan dos páginas: galeria.html (datos de js/catalogo-local.js) y
// cliente.html (datos de Supabase). Cada una llama iniciarGaleria(fuente)
// con su propia fuente de productos. Estructura:
//   1. Constantes y estado
//   2. Tema (solo oscuro)
//   3. Utilidades (precios, búsquedas)
//   4. Guardar / leer el carrito (localStorage)
//   5. Pintar el catálogo
//   6. Pintar el carrito
//   7. Acciones: cambiar cantidad, agregar, quitar
//   8. Abrir / cerrar el panel
//   9. Eventos e inicio
//   10. Carrito en Supabase (solo con sesión; ver guia_carrito_pedidos_supabase.pdf)
//   11. Checkout: formulario de envío y confirmación del pedido
// =====================================================================

// ---------------------------------------------------------------------
// 1. CONSTANTES Y ESTADO
// ---------------------------------------------------------------------
const CANTIDAD_MIN = 1;
const CANTIDAD_MAX = 10;           // tope por producto; también se limita por el stock (unidades)
const CLAVE_CARRITO = 'somniel-carrito';

const formatoPesos = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0
});

let productos = [];               // el catálogo, tal como llega de obtenerProductos()
let carrito = [];                 // los productos elegidos: [{ id: 4, cantidad: 2 }, ...]
const cantidadesSeleccionadas = {}; // lo que marca el −/+ de cada tarjeta: { 4: 2, 7: 1 }

// Con sesión (cliente.html), el carrito vive en Supabase: pedidos + detalles_pedidos.
// "cantidad" en detalles_pedidos = unidades compradas de ese producto.
let pedidoId = null;       // id del pedido en estado 'carrito' del cliente (null = sin sesión o aún no creado)
const detalleIds = {};     // { producto_id: id de la fila en detalles_pedidos }

// ---------------------------------------------------------------------
// 2. TEMA
// ---------------------------------------------------------------------
// Solo modo oscuro: la tienda es gótica, igual que la landing (index.html).
// Se fija aquí por si quedó guardado 'light' de la versión anterior.
document.documentElement.dataset.theme = 'dark';

// ---------------------------------------------------------------------
// 3. UTILIDADES
// ---------------------------------------------------------------------
function buscarProducto(id) {
  return productos.find(producto => producto.id === id);
}

function buscarEnCarrito(id) {
  return carrito.find(item => item.id === id);
}

// El máximo de cada producto: CANTIDAD_MAX o el stock, lo que sea menor.
function cantidadMaxima(id) {
  const stock = Number(buscarProducto(id)?.unidades) || CANTIDAD_MIN;
  return Math.max(CANTIDAD_MIN, Math.min(CANTIDAD_MAX, stock));
}

// Math.min / Math.max = "encierra" el número entre 1 y el máximo del producto
function limitarCantidad(id, cantidad) {
  return Math.min(cantidadMaxima(id), Math.max(CANTIDAD_MIN, cantidad));
}

// descuento 0.2 = 20 %: se paga el 80 % (1 - 0.2)
function precioUnitario(producto) {
  return Math.round(producto.precio * (1 - (producto.descuento || 0)));
}

function textoCantidad(cantidad) {
  return cantidad === 1 ? '1 ud.' : `${cantidad} uds.`;
}

// ---------------------------------------------------------------------
// 4. GUARDAR / LEER EL CARRITO
// localStorage solo guarda TEXTO: JSON.stringify convierte el array a
// texto y JSON.parse lo devuelve a array. try/catch porque en modo
// privado o con cookies bloqueadas, localStorage puede lanzar un error.
// ---------------------------------------------------------------------
function guardarCarrito() {
  try {
    localStorage.setItem(CLAVE_CARRITO, JSON.stringify(carrito));
  } catch (error) {
    console.warn('No se pudo guardar el carrito:', error);
  }
}

function leerCarrito() {
  try {
    const guardado = JSON.parse(localStorage.getItem(CLAVE_CARRITO));
    if (!Array.isArray(guardado)) return []; // primera visita: getItem da null

    // Lo guardado puede estar viejo: descartamos productos que ya no
    // existen o que ahora están agotados, y corregimos cantidades raras.
    return guardado
      .filter(item => buscarProducto(item.id)?.disponible)
      .map(item => ({ id: item.id, cantidad: limitarCantidad(item.id, Number(item.cantidad) || CANTIDAD_MIN) }));
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------
// 5. PINTAR EL CATÁLOGO
// Se pinta UNA vez. Después, cada cambio actualiza solo su tarjeta
// (actualizarTarjeta): si volviéramos a pintar todo, se repetiría la
// animación de entrada y el botón con el foco del teclado desaparecería.
// ---------------------------------------------------------------------
function crearTarjeta(producto, i) {
  const etiquetas = Array.isArray(producto.categorias) ? producto.categorias : [];
  const conDescuento = producto.descuento > 0;

  // Solo los productos disponibles llevan control de cantidad
  const zonaCompra = producto.disponible
    ? `
      <div class="tarjeta-compra">
        <div class="control-cantidad" role="group" aria-label="Cantidad de ${producto.nombre}">
          <button type="button" class="btn-cantidad" data-accion="restar" data-id="${producto.id}" aria-label="Una unidad menos">−</button>
          <output class="cantidad-valor" aria-live="polite"></output>
          <button type="button" class="btn-cantidad" data-accion="sumar" data-id="${producto.id}" aria-label="Una unidad más">+</button>
        </div>
        <p class="subtotal-tarjeta">Subtotal <strong></strong></p>
        <button type="button" class="btn-agregar" data-accion="agregar" data-id="${producto.id}">Agregar al carrito</button>
      </div>`
    : `
      <div class="tarjeta-compra">
        <button type="button" class="btn-agregar" disabled>Agotado</button>
      </div>`;

  return `
    <article class="tarjeta-producto" data-id="${producto.id}" style="--i: ${i}">
      <div class="tarjeta-imagen ${producto['img-url'] ? '' : 'sin-imagen'} ${producto.disponible ? '' : 'agotado'}">
        ${producto['img-url']
          ? `<img src="${producto['img-url']}" alt="${producto.nombre}" onerror="this.parentElement.classList.add('sin-imagen')">`
          : ''}
        <div class="caratula-placeholder" aria-hidden="true">
          <span class="placeholder-logo">MR. SOMNIEL</span>
          <span class="placeholder-titulo">${producto.nombre}</span>
          <span class="placeholder-categoria">${etiquetas.join(' / ')}</span>
        </div>
        ${producto.disponible ? '' : '<span class="sello-agotado">Agotado</span>'}
      </div>
      <h4>${producto.nombre}</h4>
      <p>${producto.descripcion}</p>
      <dl>
        <dt>Precio</dt>
        <dd>${conDescuento ? `<s>${formatoPesos.format(producto.precio)}</s>` : ''}${formatoPesos.format(precioUnitario(producto))} c/u</dd>
        ${conDescuento ? `<dt>Descuento</dt><dd>${Math.round(producto.descuento * 100)}%</dd>` : ''}
      </dl>
      ${etiquetas.length ? `<p class="categorias">${etiquetas.join(' · ')}</p>` : ''}
      <p class="sticker-firma">Ilustrado a mano · @mr.somniel</p>
      <p class="marca-carrito" hidden></p>
      ${zonaCompra}
    </article>
  `;
}

function pintarGaleria() {
  const lista = document.getElementById('lista-productos');

  if (!productos.length) {
    lista.innerHTML = '<p class="sin-resultados">El catálogo está vacío.</p>';
    return;
  }

  lista.classList.add('animar-entrada');
  lista.innerHTML = productos.map(crearTarjeta).join('');
  productos.forEach(producto => actualizarTarjeta(producto.id));
}

// Pone al día UNA tarjeta: cantidad, subtotal, botones y si está en el carrito.
function actualizarTarjeta(id) {
  const producto = buscarProducto(id);
  const tarjeta = document.querySelector(`.tarjeta-producto[data-id="${id}"]`);
  if (!producto || !tarjeta || !producto.disponible) return;

  const cantidad = cantidadesSeleccionadas[id];
  const enCarrito = buscarEnCarrito(id);

  tarjeta.querySelector('.cantidad-valor').textContent = textoCantidad(cantidad);
  tarjeta.querySelector('.subtotal-tarjeta strong').textContent =
    formatoPesos.format(precioUnitario(producto) * cantidad);
  tarjeta.querySelector('[data-accion="restar"]').disabled = cantidad <= CANTIDAD_MIN;
  tarjeta.querySelector('[data-accion="sumar"]').disabled = cantidad >= cantidadMaxima(id);

  // Si ya está en el carrito: marca visible y el botón pasa a "Actualizar"
  const marca = tarjeta.querySelector('.marca-carrito');
  tarjeta.classList.toggle('en-carrito', Boolean(enCarrito));
  marca.hidden = !enCarrito;
  marca.textContent = enCarrito ? `✓ En tu carrito · ${textoCantidad(enCarrito.cantidad)}` : '';

  const botonAgregar = tarjeta.querySelector('.btn-agregar');
  if (!botonAgregar.classList.contains('agregada')) {
    botonAgregar.textContent = enCarrito ? 'Actualizar cantidad' : 'Agregar al carrito';
  }
}

// ---------------------------------------------------------------------
// 6. PINTAR EL CARRITO
// ---------------------------------------------------------------------
function pintarCarrito() {
  const lista = document.getElementById('lista-carrito');
  const contador = document.getElementById('contador-carrito');
  const total = document.getElementById('total-carrito');
  const botonPagar = document.getElementById('btn-pagar');

  contador.textContent = carrito.length;
  botonPagar.disabled = carrito.length === 0;

  if (!carrito.length) {
    lista.innerHTML = '<p class="carrito-vacio">Tu carrito está vacío. Elige algo del catálogo.</p>';
    total.textContent = formatoPesos.format(0);
    // Con el carrito vacío no tiene sentido seguir viendo el formulario de envío.
    document.getElementById('form-checkout').hidden = true;
    botonPagar.hidden = false;
    return;
  }

  // reduce() recorre el carrito acumulando un solo número: el total
  const suma = carrito.reduce((acumulado, item) => {
    return acumulado + precioUnitario(buscarProducto(item.id)) * item.cantidad;
  }, 0);

  lista.innerHTML = carrito.map(item => {
    const producto = buscarProducto(item.id);
    const unitario = precioUnitario(producto);

    return `
      <article class="item-carrito" data-id="${item.id}">
        <div class="item-cabecera">
          <h4>${producto.nombre}</h4>
          <button type="button" class="btn-quitar" data-accion="quitar" data-id="${item.id}" aria-label="Quitar ${producto.nombre}">✕</button>
        </div>
        <p>${formatoPesos.format(unitario)} c/u</p>
        <div class="item-fila">
          <div class="control-cantidad" role="group" aria-label="Cantidad de ${producto.nombre}">
            <button type="button" class="btn-cantidad" data-accion="restar" data-id="${item.id}" aria-label="Una unidad menos" ${item.cantidad <= CANTIDAD_MIN ? 'disabled' : ''}>−</button>
            <output class="cantidad-valor">${textoCantidad(item.cantidad)}</output>
            <button type="button" class="btn-cantidad" data-accion="sumar" data-id="${item.id}" aria-label="Una unidad más" ${item.cantidad >= cantidadMaxima(item.id) ? 'disabled' : ''}>+</button>
          </div>
          <p class="item-subtotal">${formatoPesos.format(unitario * item.cantidad)}</p>
        </div>
      </article>
    `;
  }).join('');

  total.textContent = formatoPesos.format(suma);
}

// ---------------------------------------------------------------------
// 7. ACCIONES
// ---------------------------------------------------------------------

// En la TARJETA: solo cambia la selección; el carrito no se toca
// hasta que se presiona "Agregar al carrito".
function cambiarCantidadTarjeta(id, cambio) {
  cantidadesSeleccionadas[id] = limitarCantidad(id, cantidadesSeleccionadas[id] + cambio);
  actualizarTarjeta(id);
}

// En el CARRITO: cambia la cantidad de una vez, y la tarjeta se sincroniza.
// Con sesión, primero lo confirma la base (RLS puede bloquear sin dar error:
// por eso se revisa data.length) antes de tocar el estado local.
async function cambiarCantidadCarrito(id, cambio) {
  const item = buscarEnCarrito(id);
  if (!item) return;

  const nuevaCantidad = limitarCantidad(id, item.cantidad + cambio);
  const usuario = await obtenerUsuario();

  if (usuario) {
    const { data, error } = await db
      .from('detalles_pedidos')
      .update({ cantidad: nuevaCantidad })
      .eq('id', detalleIds[id])
      .select();

    if (error || data.length === 0) {
      console.log('Error al cambiar la cantidad:', error);
      return;
    }
  }

  item.cantidad = nuevaCantidad;
  cantidadesSeleccionadas[id] = nuevaCantidad;
  if (!usuario) guardarCarrito();
  pintarCarrito();
  actualizarTarjeta(id);
}

// Agrega o actualiza el producto "id" a exactamente "cantidad" (se reemplaza,
// no se suma). Sin sesión: modo demostración, solo memoria + localStorage.
// Con sesión: inserta o actualiza en detalles_pedidos (el precio lo copia
// un trigger de la base; nunca se envía desde aquí). Devuelve true/false.
async function agregarAlCarrito(id, cantidad) {
  const usuario = await obtenerUsuario();
  const item = buscarEnCarrito(id);

  if (!usuario) {
    if (item) item.cantidad = cantidad; else carrito.push({ id, cantidad });
    guardarCarrito();
    pintarCarrito();
    return true;
  }

  const idCarrito = await obtenerOCrearCarrito(usuario);
  if (idCarrito === null) return false;

  if (detalleIds[id]) {
    const { data, error } = await db
      .from('detalles_pedidos')
      .update({ cantidad })
      .eq('id', detalleIds[id])
      .select();

    if (error || data.length === 0) {
      console.log('Error al actualizar el producto:', error);
      return false;
    }
  } else {
    const { data, error } = await db
      .from('detalles_pedidos')
      .insert([{ pedido_id: idCarrito, producto_id: Number(id), cantidad }])
      .select('id')
      .single();

    if (error) {
      console.log('Error al agregar el producto:', error);
      return false;
    }
    detalleIds[id] = data.id;
  }

  if (item) item.cantidad = cantidad; else carrito.push({ id, cantidad });
  pintarCarrito();
  return true;
}

// Botón "Agregar al carrito" de cada tarjeta: deshabilita mientras espera y
// muestra el resultado (éxito o error) antes de volver a su texto normal.
async function agregar(id, boton) {
  const cantidad = cantidadesSeleccionadas[id];
  boton.disabled = true;

  const ok = await agregarAlCarrito(id, cantidad);

  boton.disabled = false;
  boton.classList.add('agregada');
  boton.textContent = ok ? '✓ Agregado' : 'Error';
  setTimeout(() => {
    boton.classList.remove('agregada');
    actualizarTarjeta(id);
  }, 1200);
  actualizarTarjeta(id);

  const contador = document.getElementById('contador-carrito');
  contador.classList.remove('rebote');
  void contador.offsetWidth;
  contador.classList.add('rebote');
}

async function quitar(id) {
  const usuario = await obtenerUsuario();

  if (usuario) {
    const { data, error } = await db
      .from('detalles_pedidos')
      .delete()
      .eq('id', detalleIds[id])
      .select();

    if (error || data.length === 0) {
      console.log('Error al quitar el producto:', error);
      return; // RLS pudo bloquearlo sin error: no tocamos el carrito local
    }
    delete detalleIds[id];
  }

  carrito = carrito.filter(item => item.id !== id);
  if (!usuario) guardarCarrito();
  pintarCarrito();
  actualizarTarjeta(id);
  // El botón ✕ desapareció con el repintado: dejamos el foco en un lugar seguro
  document.getElementById('btn-cerrar-carrito').focus();
}

// ---------------------------------------------------------------------
// 8. ABRIR / CERRAR EL PANEL
// inert = "esta parte de la página no existe" para el mouse, el teclado
// y el lector de pantalla. Así Tab no se escapa detrás del panel.
// ---------------------------------------------------------------------
const panelCarrito = document.getElementById('panel-carrito');
const overlayCarrito = document.getElementById('overlay-carrito');
const botonCarrito = document.getElementById('btn-carrito');

// Todo lo que está directo en <body> MENOS el panel y su fondo. Así sirve
// igual en galeria.html (header + main) y en cliente.html (sidebar + main),
// sin depender de que la página tenga un <header>.
function bloquearFondo(bloquear) {
  document.querySelectorAll('body > :not(#panel-carrito):not(#overlay-carrito):not(script)')
    .forEach(elemento => { elemento.inert = bloquear; });
}

function abrirCarrito() {
  panelCarrito.classList.add('abierto');
  overlayCarrito.classList.add('activo');
  document.body.classList.add('carrito-abierto');
  bloquearFondo(true);
  botonCarrito.setAttribute('aria-expanded', 'true');
  document.getElementById('btn-cerrar-carrito').focus();
}

function cerrarCarrito() {
  if (!panelCarrito.classList.contains('abierto')) return;

  panelCarrito.classList.remove('abierto');
  overlayCarrito.classList.remove('activo');
  document.body.classList.remove('carrito-abierto');
  bloquearFondo(false);
  botonCarrito.setAttribute('aria-expanded', 'false');
  document.getElementById('mensaje-carrito').textContent = '';
  botonCarrito.focus(); // el foco vuelve a donde estaba antes de abrir
}

// ---------------------------------------------------------------------
// 9. EVENTOS E INICIO
// Delegación de eventos (como en admin.js): un solo listener por zona;
// data-accion dice qué hacer y data-id sobre qué producto.
// ---------------------------------------------------------------------
document.getElementById('lista-productos').addEventListener('click', (event) => {
  const boton = event.target.closest('button[data-accion]');
  if (!boton) return;

  const id = Number(boton.dataset.id); // dataset siempre da texto: "4" → 4
  const accion = boton.dataset.accion;

  if (accion === 'restar') cambiarCantidadTarjeta(id, -1);
  if (accion === 'sumar') cambiarCantidadTarjeta(id, +1);
  if (accion === 'agregar') agregar(id, boton);
});

document.getElementById('lista-carrito').addEventListener('click', async (event) => {
  const boton = event.target.closest('button[data-accion]');
  if (!boton) return;

  const id = Number(boton.dataset.id);
  const accion = boton.dataset.accion;

  if (accion === 'quitar') return quitar(id);

  await cambiarCantidadCarrito(id, accion === 'sumar' ? +1 : -1);
  // pintarCarrito() reemplazó el botón: devolvemos el foco al nuevo,
  // o al de al lado si este quedó desactivado (llegó al mínimo o al máximo)
  const mismo = document.querySelector(`#lista-carrito [data-accion="${accion}"][data-id="${id}"]`);
  const otro = document.querySelector(`#lista-carrito [data-accion="${accion === 'sumar' ? 'restar' : 'sumar'}"][data-id="${id}"]`);
  (mismo && !mismo.disabled ? mismo : otro)?.focus();
});

botonCarrito.addEventListener('click', abrirCarrito);
document.getElementById('btn-cerrar-carrito').addEventListener('click', cerrarCarrito);
overlayCarrito.addEventListener('click', cerrarCarrito);

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') cerrarCarrito();
});

// fuenteProductos = la función que trae el catálogo. Se pasa SIN paréntesis
// (la función misma, no su resultado), y aquí adentro se llama con await:
//   galeria.html → iniciarGaleria(obtenerProductos)  (catálogo local)
//   cliente.html → iniciarGaleria(leerProductos)     (Supabase)
// Este archivo ya no arranca solo: cada página decide cuándo llamarla
// (cliente.html, por ejemplo, solo después de iniciar sesión).
async function iniciarGaleria(fuenteProductos) {
  productos = (await fuenteProductos()) || []; // si la fuente falla y da null, queda vacía
  productos.forEach(producto => { cantidadesSeleccionadas[producto.id] = CANTIDAD_MIN; });

  carrito = leerCarrito();
  // Las tarjetas arrancan mostrando la cantidad que ya tenías en el carrito
  carrito.forEach(item => { cantidadesSeleccionadas[item.id] = item.cantidad; });
  guardarCarrito(); // re-guarda ya limpio (sin productos que dejaron de existir)

  pintarGaleria();
  pintarCarrito();
}

// ---------------------------------------------------------------------
// 10. CARRITO EN SUPABASE (solo con sesión)
// Diseño de dos tablas: pedidos (una fila por compra, estado 'carrito'
// mientras se arma) y detalles_pedidos (una fila por producto, con su
// precio_unitario calculado por la base). Ver guia_carrito_pedidos_supabase.pdf.
// Si "db" no existe o no hay sesión, obtenerUsuario() devuelve null y el
// carrito vive solo en el navegador (localStorage) hasta iniciar sesión.
// ---------------------------------------------------------------------

async function obtenerUsuario() {
  if (typeof db === 'undefined') return null;
  const { data } = await db.auth.getUser();
  return data.user || null;
}

// Busca el pedido de este cliente que está en estado 'carrito'.
// maybeSingle(): si no hay ninguno, devuelve null en vez de fallar.
async function buscarCarrito(usuario) {
  const { data, error } = await db
    .from('pedidos')
    .select('id')
    .eq('cliente_id', usuario.id)
    .eq('estado', 'carrito')
    .maybeSingle();

  if (error) {
    console.log('Error al buscar el carrito:', error);
    return null;
  }
  return data?.id ?? null;
}

// Si ya se conoce pedidoId lo devuelve; si no, busca el carrito existente
// o crea uno nuevo enviando SOLO cliente_id (el estado lo pone la base).
// Si el insert falla con 23505 (otra pestaña ya creó el carrito al mismo
// tiempo), lo busca en vez de tratarlo como error.
async function obtenerOCrearCarrito(usuario) {
  if (pedidoId !== null) return pedidoId;

  const existente = await buscarCarrito(usuario);
  if (existente !== null) {
    pedidoId = existente;
    return pedidoId;
  }

  const { data, error } = await db
    .from('pedidos')
    .insert([{ cliente_id: usuario.id }])
    .select('id')
    .single();

  if (error) {
    if (error.code === '23505') {
      pedidoId = await buscarCarrito(usuario);
      return pedidoId;
    }
    console.log('Error al crear el carrito:', error);
    return null;
  }

  pedidoId = data.id;
  return pedidoId;
}

// Limpia el estado en memoria del carrito (se usa al cerrar sesión y antes
// de reconstruirlo desde la base).
function vaciarCarritoLocal() {
  carrito = [];
  for (const id in detalleIds) delete detalleIds[id];
  pedidoId = null;
  pintarCarrito();
}

// Reconstruye el carrito desde Supabase cuando hay sesión. Se llama DESPUÉS
// de iniciarGaleria() (necesita que "productos" y las tarjetas ya existan).
// Una sola consulta con select anidado (gracias a la clave foránea
// detalles_pedidos.pedido_id) trae el pedido y sus detalles juntos.
async function cargarCarritoDesdeBD() {
  vaciarCarritoLocal();

  const usuario = await obtenerUsuario();
  if (!usuario) return;

  const { data, error } = await db
    .from('pedidos')
    .select('id, detalles_pedidos(id, producto_id, cantidad)')
    .eq('cliente_id', usuario.id)
    .eq('estado', 'carrito')
    .maybeSingle();

  if (error) {
    console.log('Error al cargar el carrito:', error);
    return;
  }
  if (!data) return;

  pedidoId = data.id;
  data.detalles_pedidos.forEach(detalle => {
    const cantidad = limitarCantidad(detalle.producto_id, Number(detalle.cantidad));
    carrito.push({ id: detalle.producto_id, cantidad });
    detalleIds[detalle.producto_id] = detalle.id;
    cantidadesSeleccionadas[detalle.producto_id] = cantidad;
  });

  productos.forEach(producto => actualizarTarjeta(producto.id));
  pintarCarrito();
}

// ---------------------------------------------------------------------
// 11. CHECKOUT: formulario de envío y confirmación del pedido
// ---------------------------------------------------------------------
const botonPagarCheckout = document.getElementById('btn-pagar');
const formCheckout = document.getElementById('form-checkout');
const mensajeCarritoCheckout = document.getElementById('mensaje-carrito');
const checkEnvio = document.getElementById('checkout-envio');
const campoDireccion = document.getElementById('checkout-direccion');
const campoTelefono = document.getElementById('checkout-telefono');

botonPagarCheckout.addEventListener('click', async () => {
  mensajeCarritoCheckout.textContent = '';

  if (!carrito.length) {
    mensajeCarritoCheckout.textContent = 'Tu carrito está vacío.';
    return;
  }

  const usuario = await obtenerUsuario();
  if (!usuario) {
    // innerHTML (y no textContent) porque el mensaje lleva un enlace.
    // Es seguro: el texto es fijo, no viene de lo que escribe el usuario.
    mensajeCarritoCheckout.innerHTML =
      'Para comprar, primero <a href="cliente.html">inicia sesión en Mi cuenta</a>. Tu carrito se queda guardado.';
    return;
  }

  formCheckout.hidden = false;
  botonPagarCheckout.hidden = true;
});

document.getElementById('btn-cancelar-checkout').addEventListener('click', () => {
  formCheckout.hidden = true;
  botonPagarCheckout.hidden = false;
});

// Dirección y teléfono solo son obligatorios si se pide envío a domicilio.
checkEnvio.addEventListener('change', () => {
  campoDireccion.required = checkEnvio.checked;
  campoTelefono.required = checkEnvio.checked;
});

formCheckout.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (pedidoId === null) return;

  const botonConfirmar = document.getElementById('btn-confirmar');
  botonConfirmar.disabled = true;

  const direccion = campoDireccion.value.trim() || null;
  const telefono = campoTelefono.value.trim() || null;
  const observacion = document.getElementById('checkout-observacion').value.trim() || null;

  // El navegador NO calcula el total ni cambia el estado: solo llama a la
  // función de la base, que valida, descuenta stock y fija precios.
  const { data, error } = await db.rpc('confirmar_pedido', {
    p_pedido_id: pedidoId,
    p_envio: checkEnvio.checked,
    p_direccion: direccion,
    p_telefono: telefono,
    p_observacion: observacion
  });

  botonConfirmar.disabled = false;

  if (error) {
    console.log('Error al confirmar el pedido:', error);
    mensajeCarritoCheckout.textContent = error.message;
    return;
  }

  // El total lo calcula la base (vista pedidos_con_total), no el navegador.
  const { data: conTotal } = await db
    .from('pedidos_con_total')
    .select('total')
    .eq('id', data.id)
    .single();

  vaciarCarritoLocal();
  formCheckout.reset();
  formCheckout.hidden = true;
  botonPagarCheckout.hidden = false;
  campoDireccion.required = false;
  campoTelefono.required = false;

  mensajeCarritoCheckout.textContent =
    `Pedido #${data.id} confirmado. Total: ${formatoPesos.format(conTotal?.total ?? 0)}`;
});
