// =====================================================================
// catalogo-local.js — datos de prueba de la galería, SIN Supabase.
// Son las mismas 10 películas de sql/peliculas.sql, con las MISMAS
// columnas que la tabla "practica-productos". Así, cuando conectes
// Supabase, galeria.js no cambia: solo cambia obtenerProductos().
// =====================================================================

const catalogoLocal = [
  // ---------- Tim Burton ----------
  {
    id: 1,
    nombre: 'Beetlejuice (1988)',
    descripcion: 'Dir. Tim Burton. Una pareja de fantasmas recién fallecidos contrata a un bioexorcista desquiciado para espantar a la familia que se mudó a su casa.',
    precio: 5000,
    unidades: 3,
    descuento: 0,
    disponible: true,
    categorias: ['tim burton'],
    'img-url': null
  },
  {
    id: 2,
    nombre: 'Edward Scissorhands (1990)',
    descripcion: 'Dir. Tim Burton. Un joven creado por un inventor que murió antes de terminarlo, con tijeras en lugar de manos, intenta encajar en un suburbio.',
    precio: 5500,
    unidades: 2,
    descuento: 0,
    disponible: true,
    categorias: ['tim burton', 'romance'],
    'img-url': null
  },
  {
    id: 3,
    nombre: 'Sleepy Hollow (1999)',
    descripcion: 'Dir. Tim Burton. El investigador Ichabod Crane llega a un pueblo aterrorizado por un jinete sin cabeza.',
    precio: 6000,
    unidades: 2,
    descuento: 0,
    disponible: false,
    categorias: ['tim burton', 'terror'],
    'img-url': null
  },
  // ---------- Anime ----------
  {
    id: 4,
    nombre: 'Akira (1988)',
    descripcion: 'Dir. Katsuhiro Otomo. En Neo-Tokio, años después de una guerra que destruyó la ciudad, un pandillero desarrolla poderes psíquicos que no puede controlar.',
    precio: 6000,
    unidades: 2,
    descuento: 0.1,
    disponible: true,
    categorias: ['anime'],
    'img-url': null
  },
  {
    id: 5,
    nombre: 'Ghost in the Shell (1995)',
    descripcion: 'Dir. Mamoru Oshii. La mayor Motoko Kusanagi, una cyborg de una unidad de seguridad, persigue a un hacker conocido como el Titiritero.',
    precio: 6000,
    unidades: 1,
    descuento: 0,
    disponible: true,
    categorias: ['anime'],
    'img-url': null
  },
  {
    id: 6,
    nombre: 'Perfect Blue (1997)',
    descripcion: 'Dir. Satoshi Kon. Una cantante pop deja su grupo para ser actriz y empieza a perder el límite entre realidad y fantasía mientras un acosador la sigue.',
    precio: 5500,
    unidades: 1,
    descuento: 0,
    disponible: false,
    categorias: ['anime', 'terror'],
    'img-url': null
  },
  // ---------- Terror ----------
  {
    id: 7,
    nombre: 'The Shining (1980)',
    descripcion: 'Dir. Stanley Kubrick. Jack Torrance acepta cuidar un hotel aislado durante el invierno junto a su familia, y el lugar lo va enloqueciendo.',
    precio: 5000,
    unidades: 3,
    descuento: 0,
    disponible: true,
    categorias: ['terror'],
    'img-url': null
  },
  {
    id: 8,
    nombre: 'A Nightmare on Elm Street (1984)',
    descripcion: 'Dir. Wes Craven. Freddy Krueger ataca a un grupo de adolescentes en sus sueños; si mueren soñando, mueren de verdad.',
    precio: 4500,
    unidades: 4,
    descuento: 0.2,
    disponible: true,
    categorias: ['terror'],
    'img-url': null
  },
  // ---------- Romance ----------
  {
    id: 9,
    nombre: 'Dirty Dancing (1987)',
    descripcion: 'Dir. Emile Ardolino. En el verano de 1963, Baby se enamora de Johnny Castle, el instructor de baile del centro vacacional donde veranea su familia.',
    precio: 4500,
    unidades: 2,
    descuento: 0,
    disponible: true,
    categorias: ['romance'],
    'img-url': null
  },
  {
    id: 10,
    nombre: 'Ghost (1990)',
    descripcion: 'Dir. Jerry Zucker. Sam es asesinado y queda como fantasma; con ayuda de la médium Oda Mae intenta proteger a Molly, su pareja.',
    precio: 5000,
    unidades: 2,
    descuento: 0,
    disponible: false,
    categorias: ['romance'],
    'img-url': null
  }
];

// "async" aunque hoy no espera nada: así galeria.js ya la llama con await,
// igual que hará cuando los datos vengan de internet.
// Devuelve COPIAS ({ ...p }) para que la galería no modifique el catálogo original.
async function obtenerProductos() {
  return catalogoLocal.map(producto => ({ ...producto, categorias: [...producto.categorias] }));

  // Versión Supabase (para después): borra el return de arriba y usa esto.
  // const { data, error } = await db
  //   .from('practica-productos')
  //   .select('*')
  //   .order('id', { ascending: true });
  // if (error) {
  //   console.log('Error al traer el catálogo:', error);
  //   return [];
  // }
  // return data;
}
