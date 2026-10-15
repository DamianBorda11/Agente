// 3° script. Única capa que habla con la base de datos: no toca el DOM.
// Cada función devuelve los datos o lanza un Error, así gestion.js solo
// necesita un try/catch y no tiene que saber nada de Supabase.
const TABLE = "entregas";

// Supabase nunca lanza errores por sí solo: devuelve { data, error }.
// Esta función convierte ese error en una excepción normal.
function unwrap({ data, error }) {
    if (error) {
        throw new Error(error.message);
    }
    return data;
}

// READ: todas las entregas, la más próxima primero.
async function getEntregas() {
    return unwrap(
        await supabaseClient
            .from(TABLE)
            .select("*")
            .order("fecha_entrega", { ascending: true })
    );
}

// CREATE: .select().single() hace que Supabase devuelva la fila creada (con su id).
async function createEntrega(entrega) {
    return unwrap(
        await supabaseClient.from(TABLE).insert(entrega).select().single()
    );
}

// UPDATE: sin .eq("id", id) se actualizarían TODAS las filas.
async function updateEntrega(id, changes) {
    return unwrap(
        await supabaseClient.from(TABLE).update(changes).eq("id", id).select().single()
    );
}

// DELETE: igual que update, el filtro .eq es lo que limita a una sola fila.
async function deleteEntrega(id) {
    unwrap(await supabaseClient.from(TABLE).delete().eq("id", id));
}
