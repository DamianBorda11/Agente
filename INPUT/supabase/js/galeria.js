// =====================================================================
// galeria.js — estantería VHS + carrito de rentas.
// Lo usan dos páginas: galeria.html (datos de js/catalogo-local.js) y
// cliente.html (datos de Supabase). Cada una llama iniciarGaleria(fuente)
// con su propia fuente de productos. Estructura:
//   1. Constantes y estado
//   2. Tema oscuro / claro
//   3. Utilidades (precios, búsquedas)
//   4. Guardar / leer el carrito (localStorage)
//   5. Pintar la estantería
//   6. Pintar el carrito
//   7. Acciones: cambiar noches, rentar, quitar
//   8. Abrir / cerrar el panel
//   9. Eventos e inicio
// =====================================================================

// ---------------------------------------------------------------------
// 1. CONSTANTES Y ESTADO
// ---------------------------------------------------------------------
const NOCHES_MIN = 1;
const NOCHES_MAX = 7;
const CLAVE_CARRITO = 'videoclub-carrito';

const formatoPesos = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0
});

let productos = [];               // el catálogo, tal como llega de obtenerProductos()
let carrito = [];                 // las rentas: [{ id: 4, noches: 2 }, ...]
const nochesSeleccionadas = {};   // lo que marca el −/+ de cada tarjeta: { 4: 2, 7: 1 }

// ---------------------------------------------------------------------
// 2. TEMA OSCURO / CLARO (misma clave 'tema' que admin.js: se comparte)
// ---------------------------------------------------------------------
const botonTema = document.getElementById('btn-tema');

function leerTema() {
  try {
    return localStorage.getItem('tema') || 'dark';
  } catch {
    return 'dark'; // navegador en modo privado o con almacenamiento bloqueado
  }
}

function actualizarBotonTema() {
  const esOscuro = document.documentElement.dataset.theme === 'dark';
  botonTema.textContent = esOscuro ? '☀ Modo claro' : '☾ Modo oscuro';
  botonTema.setAttribute('aria-pressed', String(!esOscuro));
}

document.documentElement.dataset.theme = leerTema();
actualizarBotonTema();

botonTema.addEventListener('click', () => {
  const nuevoTema = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  document.documentElement.dataset.theme = nuevoTema;
  try { localStorage.setItem('tema', nuevoTema); } catch { /* sin almacenamiento: solo dura esta visita */ }
  actualizarBotonTema();

  document.body.classList.remove('interferencia');
  void document.body.offsetWidth; // reflow: permite repetir la animación
  document.body.classList.add('interferencia');
});

// ---------------------------------------------------------------------
// 3. UTILIDADES
// ---------------------------------------------------------------------
function buscarProducto(id) {
  return productos.find(producto => producto.id === id);
}

function buscarEnCarrito(id) {
  return carrito.find(item => item.id === id);
}

// Math.min / Math.max = "encierra" el número entre 1 y 7
function limitarNoches(noches) {
  return Math.min(NOCHES_MAX, Math.max(NOCHES_MIN, noches));
}

// descuento 0.2 = 20 %: se paga el 80 % (1 - 0.2)
function precioPorNoche(producto) {
  return Math.round(producto.precio * (1 - (producto.descuento || 0)));
}

function textoNoches(noches) {
  return noches === 1 ? '1 noche' : `${noches} noches`;
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

    // Lo guardado puede estar viejo: descartamos películas que ya no
    // existen o que ahora están rentadas, y corregimos noches raras.
    return guardado
      .filter(item => buscarProducto(item.id)?.disponible)
      .map(item => ({ id: item.id, noches: limitarNoches(Number(item.noches) || NOCHES_MIN) }));
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------
// 5. PINTAR LA ESTANTERÍA
// Se pinta UNA vez. Después, cada cambio actualiza solo su tarjeta
// (actualizarTarjeta): si volviéramos a pintar todo, se repetiría la
// animación de entrada y el botón con el foco del teclado desaparecería.
// ---------------------------------------------------------------------
function crearTarjeta(producto, i) {
  const generos = Array.isArray(producto.categorias) ? producto.categorias : [];
  const conDescuento = producto.descuento > 0;

  // Solo las películas disponibles llevan control de noches
  const zonaRenta = producto.disponible
    ? `
      <div class="tarjeta-renta">
        <div class="control-noches" role="group" aria-label="Noches de renta de ${producto.nombre}">
          <button type="button" class="btn-noches" data-accion="restar" data-id="${producto.id}" aria-label="Una noche menos">−</button>
          <output class="noches-valor" aria-live="polite"></output>
          <button type="button" class="btn-noches" data-accion="sumar" data-id="${producto.id}" aria-label="Una noche más">+</button>
        </div>
        <p class="subtotal-tarjeta">Subtotal <strong></strong></p>
        <button type="button" class="btn-rentar" data-accion="rentar" data-id="${producto.id}">Rentar</button>
      </div>`
    : `
      <div class="tarjeta-renta">
        <button type="button" class="btn-rentar" disabled>No disponible</button>
      </div>`;

  return `
    <article class="tarjeta-producto" data-id="${producto.id}" style="--i: ${i}">
      <div class="tarjeta-imagen ${producto['img-url'] ? '' : 'sin-imagen'} ${producto.disponible ? '' : 'rentada'}">
        ${producto['img-url']
          ? `<img src="${producto['img-url']}" alt="Póster de ${producto.nombre}" onerror="this.parentElement.classList.add('sin-imagen')">`
          : ''}
        <div class="caratula-vhs" aria-hidden="true">
          <span class="vhs-logo">VHS</span>
          <span class="vhs-titulo">${producto.nombre}</span>
          <span class="vhs-genero">${generos.join(' / ')}</span>
        </div>
        ${producto.disponible ? '' : '<span class="sello-rentada">Rentada</span>'}
      </div>
      <h4>${producto.nombre}</h4>
      <p>${producto.descripcion}</p>
      <dl>
        <dt>Renta</dt>
        <dd>${conDescuento ? `<s>${formatoPesos.format(producto.precio)}</s>` : ''}${formatoPesos.format(precioPorNoche(producto))} / noche</dd>
        ${conDescuento ? `<dt>Descuento</dt><dd>${Math.round(producto.descuento * 100)}%</dd>` : ''}
      </dl>
      ${generos.length ? `<p class="categorias">${generos.join(' · ')}</p>` : ''}
      <p class="sticker-rebobinar">¡Rebobine antes de devolver!</p>
      <p class="marca-carrito" hidden></p>
      ${zonaRenta}
    </article>
  `;
}

function pintarGaleria() {
  const lista = document.getElementById('lista-productos');

  if (!productos.length) {
    lista.innerHTML = '<p class="sin-resultados">La estantería está vacía.</p>';
    return;
  }

  lista.classList.add('animar-entrada');
  lista.innerHTML = productos.map(crearTarjeta).join('');
  productos.forEach(producto => actualizarTarjeta(producto.id));
}

// Pone al día UNA tarjeta: noches, subtotal, botones y si está en el carrito.
function actualizarTarjeta(id) {
  const producto = buscarProducto(id);
  const tarjeta = document.querySelector(`.tarjeta-producto[data-id="${id}"]`);
  if (!producto || !tarjeta || !producto.disponible) return;

  const noches = nochesSeleccionadas[id];
  const enCarrito = buscarEnCarrito(id);

  tarjeta.querySelector('.noches-valor').textContent = textoNoches(noches);
  tarjeta.querySelector('.subtotal-tarjeta strong').textContent =
    formatoPesos.format(precioPorNoche(producto) * noches);
  tarjeta.querySelector('[data-accion="restar"]').disabled = noches <= NOCHES_MIN;
  tarjeta.querySelector('[data-accion="sumar"]').disabled = noches >= NOCHES_MAX;

  // Si ya está en el carrito: marca visible y el botón pasa a "Actualizar"
  const marca = tarjeta.querySelector('.marca-carrito');
  tarjeta.classList.toggle('en-carrito', Boolean(enCarrito));
  marca.hidden = !enCarrito;
  marca.textContent = enCarrito ? `✓ En tus rentas · ${textoNoches(enCarrito.noches)}` : '';

  const botonRentar = tarjeta.querySelector('.btn-rentar');
  if (!botonRentar.classList.contains('agregada')) {
    botonRentar.textContent = enCarrito ? 'Actualizar noches' : 'Rentar';
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
    lista.innerHTML = '<p class="carrito-vacio">Aún no tienes rentas. Elige una película de la estantería.</p>';
    total.textContent = formatoPesos.format(0);
    return;
  }

  // reduce() recorre el carrito acumulando un solo número: el total
  const suma = carrito.reduce((acumulado, item) => {
    return acumulado + precioPorNoche(buscarProducto(item.id)) * item.noches;
  }, 0);

  lista.innerHTML = carrito.map(item => {
    const producto = buscarProducto(item.id);
    const porNoche = precioPorNoche(producto);

    return `
      <article class="item-carrito" data-id="${item.id}">
        <div class="item-cabecera">
          <h4>${producto.nombre}</h4>
          <button type="button" class="btn-quitar" data-accion="quitar" data-id="${item.id}" aria-label="Quitar ${producto.nombre}">✕</button>
        </div>
        <p>${formatoPesos.format(porNoche)} / noche</p>
        <div class="item-fila">
          <div class="control-noches" role="group" aria-label="Noches de renta de ${producto.nombre}">
            <button type="button" class="btn-noches" data-accion="restar" data-id="${item.id}" aria-label="Una noche menos" ${item.noches <= NOCHES_MIN ? 'disabled' : ''}>−</button>
            <output class="noches-valor">${textoNoches(item.noches)}</output>
            <button type="button" class="btn-noches" data-accion="sumar" data-id="${item.id}" aria-label="Una noche más" ${item.noches >= NOCHES_MAX ? 'disabled' : ''}>+</button>
          </div>
          <p class="item-subtotal">${formatoPesos.format(porNoche * item.noches)}</p>
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
// hasta que se presiona "Rentar".
function cambiarNochesTarjeta(id, cambio) {
  nochesSeleccionadas[id] = limitarNoches(nochesSeleccionadas[id] + cambio);
  actualizarTarjeta(id);
}

// En el CARRITO: cambia la renta de una vez, y la tarjeta se sincroniza.
function cambiarNochesCarrito(id, cambio) {
  const item = buscarEnCarrito(id);
  if (!item) return;

  item.noches = limitarNoches(item.noches + cambio);
  nochesSeleccionadas[id] = item.noches;
  guardarCarrito();
  pintarCarrito();
  actualizarTarjeta(id);
}

// Una película = una entrada. Si ya estaba, se REEMPLAZAN las noches.
function rentar(id, boton) {
  const noches = nochesSeleccionadas[id];
  const item = buscarEnCarrito(id);

  if (item) {
    item.noches = noches;
  } else {
    carrito.push({ id, noches });
  }

  guardarCarrito();
  pintarCarrito();

  // Feedback: el botón confirma durante 1,2 s y la burbuja del contador salta
  boton.classList.add('agregada');
  boton.textContent = '✓ Agregada';
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

function quitar(id) {
  carrito = carrito.filter(item => item.id !== id);
  guardarCarrito();
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
// data-accion dice qué hacer y data-id sobre qué película.
// ---------------------------------------------------------------------
document.getElementById('lista-productos').addEventListener('click', (event) => {
  const boton = event.target.closest('button[data-accion]');
  if (!boton) return;

  const id = Number(boton.dataset.id); // dataset siempre da texto: "4" → 4
  const accion = boton.dataset.accion;

  if (accion === 'restar') cambiarNochesTarjeta(id, -1);
  if (accion === 'sumar') cambiarNochesTarjeta(id, +1);
  if (accion === 'rentar') rentar(id, boton);
});

document.getElementById('lista-carrito').addEventListener('click', (event) => {
  const boton = event.target.closest('button[data-accion]');
  if (!boton) return;

  const id = Number(boton.dataset.id);
  const accion = boton.dataset.accion;

  if (accion === 'quitar') return quitar(id);

  cambiarNochesCarrito(id, accion === 'sumar' ? +1 : -1);
  // pintarCarrito() reemplazó el botón: devolvemos el foco al nuevo,
  // o al de al lado si este quedó desactivado (llegó a 1 o a 7)
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

// Pago: solo visual hasta conectar Supabase
document.getElementById('btn-pagar').addEventListener('click', () => {
  document.getElementById('mensaje-carrito').textContent =
    '> El pago se conectará con Supabase más adelante.';
});

// fuenteProductos = la función que trae el catálogo. Se pasa SIN paréntesis
// (la función misma, no su resultado), y aquí adentro se llama con await:
//   galeria.html → iniciarGaleria(obtenerProductos)  (catálogo local)
//   cliente.html → iniciarGaleria(leerProductos)     (Supabase)
// Este archivo ya no arranca solo: cada página decide cuándo llamarla
// (cliente.html, por ejemplo, solo después de iniciar sesión).
async function iniciarGaleria(fuenteProductos) {
  productos = (await fuenteProductos()) || []; // si la fuente falla y da null, queda vacía
  productos.forEach(producto => { nochesSeleccionadas[producto.id] = NOCHES_MIN; });

  carrito = leerCarrito();
  // Las tarjetas arrancan mostrando las noches que ya tenías en el carrito
  carrito.forEach(item => { nochesSeleccionadas[item.id] = item.noches; });
  guardarCarrito(); // re-guarda ya limpio (sin películas que dejaron de existir)

  pintarGaleria();
  pintarCarrito();
}
