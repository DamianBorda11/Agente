// Objeto base de ejemplo, tomado como referencia para el formulario.
const productoPrueba = {
  nombre: 'Mouse Gamer X500',
  descripcion: 'Este es un producto de prueba',
  precio: 200.0,
  unidades: 10,
  descuento: 0.1,
  disponible: true,
  categorias: ['tecnologia', 'accesorios'],
  'img-url': 'https://www.omega-store.co/wp-content/uploads/2025/03/MS6610BK.png'
};

// Creamos el formulario desde JavaScript para que el HTML quede limpio.
function crearFormularioProducto() {
  const contenedor = document.getElementById('form-container');

  // Si el contenedor no existe, no intentamos generarlo.
  if (!contenedor) return;

  const form = document.createElement('form');
  form.id = 'form-producto';

  const campos = [
    { id: 'nombre', label: 'Nombre', type: 'text', required: true },
    { id: 'descripcion-input', label: 'Descripción', type: 'textarea', required: true },
    { id: 'precio-input', label: 'Precio', type: 'number', step: '0.01', min: '0', required: true },
    { id: 'unidades-input', label: 'Unidades', type: 'number', min: '0', required: true },
    { id: 'descuento', label: 'Descuento', type: 'number', step: '0.01', min: '0', max: '1' },
    { id: 'categorias', label: 'Categorías', type: 'text', placeholder: 'tecnologia, accesorios' },
    { id: 'img-url', label: 'URL de imagen', type: 'url', placeholder: 'https://example.com/imagen.jpg' }
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
  checkWrap.textContent = 'Disponible: ';

  const disponible = document.createElement('input');
  disponible.id = 'disponible';
  disponible.type = 'checkbox';
  disponible.name = 'disponible';
  disponible.checked = true;

  checkWrap.appendChild(disponible);
  form.appendChild(checkWrap);
  form.appendChild(document.createElement('br'));

  const boton = document.createElement('button');
  boton.type = 'submit';
  boton.textContent = 'Guardar producto';
  form.appendChild(boton);

  contenedor.appendChild(form);

  return form;
}

// Rellena el formulario con los valores del objeto base como ejemplo.
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
    .map(item => item.trim())
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

// Inserta un producto en la tabla de Supabase.
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

// Trae los productos y los muestra en pantalla.
document.getElementById('btn-traer').addEventListener('click', async () => {
  const { data, error } = await db.from('practica-productos').select('*');

  if (error) {
    document.getElementById('resultado').textContent = 'Error: ' + error.message;
    return;
  }


  document.getElementById('resultado').textContent = JSON.stringify(data, null, 2);

  const nombres = data.map(producto => producto.nombre);
  document.getElementById('resultado2').innerHTML =
    '<ul>' + nombres.map(n => `<li>${n}</li>`).join('') + '</ul>';

  const descripcion = data.map(producto => producto.descripcion);
  document.getElementById('descripcion').innerHTML =
    '<ul>' + descripcion.map(d => `<li>${d}</li>`).join('') + '</ul>';

  const precio = data.map(producto => producto.precio);
  document.getElementById('precio').innerHTML =
    '<ul>' + precio.map(p => `<li>${p}</li>`).join('') + '</ul>';

  const unidades = data.map(producto => producto.unidades);
  document.getElementById('unidades').innerHTML =
    '<ul>' + unidades.map(u => `<li>${u}</li>`).join('') + '</ul>';
});

// Generamos el formulario al cargar la página y lo inicializamos con datos de ejemplo.
const formularioProducto = crearFormularioProducto();
llenarFormulario(productoPrueba);

// Escucha el envío del formulario y agrega el producto a la base de datos.
if (formularioProducto) {
  formularioProducto.addEventListener('submit', async (event) => {
    event.preventDefault();

    const datos = obtenerDatosFormulario();
    const respuesta = await agregarProducto(datos);

    if (respuesta) {
      console.log('Producto agregado:', respuesta);
      document.getElementById('notificacion').textContent = 'Producto agregado: ' + JSON.stringify(respuesta, null, 2);
    } else {
      document.getElementById('notificacion').textContent = 'Error al agregar el producto.';
    }
  });
}

// ---------------------------------------------------------------------
// BUSCAR PRODUCTO POR NOMBRE
// ---------------------------------------------------------------------
// Creamos un input y un botón para buscar productos por nombre en Supabase.
function crearBuscadorPorNombre() {
  const contenedor = document.getElementById('form-container');
  if (!contenedor) return;

  const buscador = document.createElement('div');
  buscador.style.marginTop = '20px';

  const input = document.createElement('input');
  input.type = 'text';
  input.id = 'buscar-nombre';
  input.placeholder = 'Buscar por nombre';

  const boton = document.createElement('button');
  boton.type = 'button';
  boton.textContent = 'Buscar';

  boton.addEventListener('click', async () => {
    const texto = input.value.trim();
    const contenedorResultados = document.getElementById('resultado-busqueda-contenido');

    if (!texto) {
      contenedorResultados.textContent = 'Escribe un nombre para buscar.';
      return;
    }

    const productos = await buscarProductosPorNombre(texto);

    if (!productos.length) {
      contenedorResultados.textContent = 'No se encontraron productos con ese nombre.';
      return;
    }

    contenedorResultados.innerHTML = productos.map(producto => `
      <div>
        <strong>${producto.nombre}</strong><br>
        ${producto.descripcion}<br>
        Precio: ${producto.precio}<br>
        Unidades: ${producto.unidades}
      </div>
      <hr>
    `).join('');
  });

  buscador.appendChild(input);
  buscador.appendChild(boton);
  contenedor.appendChild(buscador);
}

// Busca productos cuyo nombre contenga el texto escrito.
async function buscarProductosPorNombre(texto) {
  const { data, error } = await db
    .from('practica-productos')
    .select('*')
    .ilike('nombre', `%${texto}%`);

  if (error) {
    console.log('Error al buscar:', error);
    return [];
  }

  return data;
}

// Si quieres buscar por ID también puedes usar esto.
async function buscarProductoPorId(id) {
  const { data, error } = await db
    .from('practica-productos')
    .select('*')
    .eq('id', id)
    .single();

  if (error) return null;
  return data;
}

crearBuscadorPorNombre();
