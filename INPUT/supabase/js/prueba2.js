document.getElementById('btn-traer').addEventListener('click', async () => {

  // "async" convierte esta función (el listener del clic) en una función
  // ASÍNCRONA: una función que PUEDE usar "await" adentro para esperar
  // algo que tarda, sin congelar el resto de la página mientras espera.
  //
  // Diferencia clave con localStorage (semana 7): localStorage.getItem()
  // y localStorage.setItem() son operaciones SINCRÓNICAS — ocurren al
  // instante, en tu propio computador, sin viajar a ningún lado. Por eso
  // nunca necesitaste "async"/"await" para leer o escribir en
  // localStorage. Una consulta a Supabase, en cambio, viaja por internet
  // hasta el servidor de Supabase y la respuesta tiene que volver — eso
  // toma un tiempo real (aunque sea poco), y JavaScript necesita una
  // forma explícita de decir "espera aquí a que llegue la respuesta".

  // "await" pausa la ejecución DE ESTA FUNCIÓN (no de toda la página)
  // hasta que la consulta a Supabase responda. Mientras tanto, el resto
  // de tu página sigue funcionando con normalidad — solo esta función
  // en particular se detiene en esta línea hasta tener respuesta real.
 const { data, error } = await db.from('practica-productos').select('*');
  // Sin "await" en la línea de arriba, "data" y "error" NO tendrían el
  // resultado todavía — tendrías una "Promise" (promesa) sin resolver,
  // no los datos reales. Eso es justo lo que "await" evita: te obliga
  // a esperar antes de seguir usando el resultado.
  console.log(data, error);

  if (error) {
    document.getElementById('resultado').textContent = 'Error: ' + error.message;
    return;
  }

  else {

  document.getElementById('resultado').textContent = JSON.stringify(data, null, 2);
  }


{
    const nombres = data.map(producto => producto.nombre);
  // nombres es ahora un array de solo strings:
  // ["Audífonos Bluetooth X200", "Camiseta Básica Algodón", "Silla Gamer ProMax"]
  // — ya no objetos completos

  document.getElementById('resultado2').innerHTML =
    '<ul>' + nombres.map(n => `<li>${n}</li>`).join('') + '</ul>';
}

{
    const descripcion = data.map(producto => producto.descripcion);
  // nombres es ahora un array de solo strings:
  // ["Audífonos Bluetooth X200", "Camiseta Básica Algodón", "Silla Gamer ProMax"]
  // — ya no objetos completos

  document.getElementById('descripcion').innerHTML = 
  '<ul>' + descripcion.map(d => `<li>${d}</li>`).join('') + '</ul>';
}


{
    const precio = data.map(producto => producto.precio);
  // nombres es ahora un array de solo strings:
  // ["Audífonos Bluetooth X200", "Camiseta Básica Algodón", "Silla Gamer ProMax"]
  // — ya no objetos completos

  document.getElementById('precio').innerHTML = 
  '<ul>' + precio.map(p => `<li>${p}</li>`).join('') + '</ul>';
}


{
    const unidades = data.map(producto => producto.unidades);
  // nombres es ahora un array de solo strings:
  // ["Audífonos Bluetooth X200", "Camiseta Básica Algodón", "Silla Gamer ProMax"]
  // — ya no objetos completos

  document.getElementById('unidades').innerHTML =
    '<ul>' + unidades.map(u => `<li>${u}</li>`).join('') + '</ul>';
}

//crud

const productoPrueba = {

  nombre: 'Mouse Gamer X500',
  descripcion: 'Este es un producto de prueba',
  precio: 200.000,
  unidades: 10,
  descuento: 0.1,
  disponible: true,
  categorias: ['tecnologia', 'accesorios'],
  'img-url': "https://www.omega-store.co/wp-content/uploads/2025/03/MS6610BK.png",

}

});
