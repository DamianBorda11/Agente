// =====================================================================
// catalogo-local.js — catálogo de respaldo de la galería (si Supabase falla).
// Son los mismos 5 productos de sql/somniel_productos.sql, con las MISMAS
// columnas que la tabla "practica-productos". Así, cuando conectes
// Supabase, galeria.js no cambia: solo cambia obtenerProductos().
//
// TODO: precios y stock son valores de ejemplo — cámbialos por los reales
// (aquí Y en sql/somniel_productos.sql, para que coincidan).
// =====================================================================

const catalogoLocal = [
  {
    id: 1,
    nombre: 'Poster Yeyo (A3)',
    descripcion: 'Impresión en papel mate de 200 g, 29,7 × 42 cm. Ilustración original de @mr.somniel.',
    precio: 35000,
    unidades: 10,
    descuento: 0,
    disponible: true,
    categorias: ['posters'],
    'img-url': 'assets/art/art-01.jpg'
  },
  {
    id: 2,
    nombre: 'Poster Guiño (A3)',
    descripcion: 'Impresión en papel mate de 200 g, 29,7 × 42 cm. Fondo azul con trazos naranja y amarillo.',
    precio: 35000,
    unidades: 8,
    descuento: 0.1,
    disponible: true,
    categorias: ['posters'],
    'img-url': 'assets/art/art-02.jpg'
  },
  {
    id: 3,
    nombre: 'Pack de stickers Punks (x5)',
    descripcion: 'Cinco stickers troquelados de vinilo resistente al agua, de 6 a 8 cm cada uno.',
    precio: 12000,
    unidades: 30,
    descuento: 0,
    disponible: true,
    categorias: ['stickers'],
    'img-url': 'assets/art/art-05.jpg'
  },
  {
    id: 4,
    nombre: 'Cómic Somniel #1',
    descripcion: 'Fanzine de 24 páginas a color, tamaño media carta, grapado a mano.',
    precio: 28000,
    unidades: 15,
    descuento: 0,
    disponible: true,
    categorias: ['comics'],
    'img-url': 'assets/art/art-03.jpg'
  },
  {
    id: 5,
    nombre: 'Pin Dados',
    descripcion: 'Pin metálico esmaltado de 3 cm con broche de mariposa. Agotado por ahora.',
    precio: 10000,
    unidades: 0,
    descuento: 0,
    disponible: false,
    categorias: ['pines'],
    'img-url': 'assets/art/art-04.jpg'
  }
];

// Trae el catálogo para galeria.html.
// 1° intenta Supabase (la misma tabla que leen cliente.html y admin.html):
//    así los ids coinciden con la base y el carrito se puede pagar.
// 2° si Supabase falla (sin internet, URL mal copiada...), usa la lista
//    local de arriba para que la galería no quede vacía. Con esa lista
//    se puede mirar y armar el carrito, pero no pagar.
// Devuelve COPIAS ({ ...p }) para que la galería no modifique el catálogo original.
async function obtenerProductos() {
  if (typeof db !== 'undefined') {
    const { data, error } = await db
      .from('practica-productos')
      .select('*') // '*' evita pelear con el guion de la columna img-url
      .order('id', { ascending: true });

    if (!error && data.length) return data;
    console.log('No se pudo leer Supabase; uso el catálogo local:', error);
  }

  return catalogoLocal.map(producto => ({ ...producto, categorias: [...producto.categorias] }));
}
