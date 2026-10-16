document.getElementById('btn-traer').addEventListener('click', async () => {

  // async/await, igual que en los Pasos 2 y 3: necesitamos esperar la
  // respuesta real de Supabase antes de poder usar "data".
  // El nombre va EXACTO como aparece en Table Editor (con guion).
  const { data, error } = await db.from('practica-productos').select('*');

  const resultado = document.getElementById('resultado');

  if (error) {
    resultado.textContent = 'Error: ' + error.message;
    return;
  }

  // Con RLS activo y sin policy de select, Supabase responde [] sin error.
  if (data.length === 0) {
    resultado.textContent = 'No llegaron productos (¿falta la policy de select?).';
    return;
  }

  // map() es SINCRÓNICO — no lleva await. Solo transforma el array "data"
  // que ya está en memoria. Cada producto se vuelve una tarjeta <article>.
  const tarjetas = data.map(producto => {
    // Corchetes porque la columna tiene guion: producto.img-url sería
    // "producto.img MENOS url" para JS.
    const imagen = producto['img-url'];

    const precioFinal = Math.round(producto.precio * (1 - producto.descuento));
    const hayDescuento = producto.descuento > 0;
    const agotado = !producto.disponible || producto.unidades === 0;

    return `
      <article class="card">
        <img src="${imagen}" alt="${producto.nombre}" loading="lazy">
        <div class="card-body">
          <span class="badge ${agotado ? 'badge-off' : 'badge-on'}">
            ${agotado ? 'Agotado' : 'Disponible'}
          </span>
          <h2>${producto.nombre}</h2>
          <p class="descripcion">${producto.descripcion}</p>
          <p class="precio">
            $${precioFinal.toLocaleString('es-CO')}
            ${hayDescuento ? `<s>$${producto.precio.toLocaleString('es-CO')}</s>
                              <span class="descuento">-${Math.round(producto.descuento * 100)}%</span>` : ''}
          </p>
          <p class="unidades">${producto.unidades} unidades</p>
          <ul class="chips">
            ${producto.categorias.map(c => `<li>${c}</li>`).join('')}
          </ul>
        </div>
      </article>`;
  });

  resultado.innerHTML = `<div class="galeria">${tarjetas.join('')}</div>`;
});
