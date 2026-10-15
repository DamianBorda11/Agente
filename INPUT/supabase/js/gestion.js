// 4° script. Maneja el DOM y los eventos; para los datos llama a datos.js.
// Vive dentro de una IIFE para no dejar variables globales sueltas.
(() => {
    "use strict";

    const ESTADOS = {
        pendiente: "Pendiente",
        en_progreso: "En progreso",
        entregada: "Entregada",
    };

    const form = document.getElementById("entrega-form");
    const tbody = document.getElementById("entregas-body");
    const message = document.getElementById("mensaje");

    function showError(error) {
        console.error(error);
        message.textContent = `Error: ${error.message}`;
    }

    // Se usa textContent (y no innerHTML con template strings) porque los datos
    // vienen de la base de datos: si alguien guarda "<script>", se ve como texto.
    function createCell(text) {
        const td = document.createElement("td");
        td.textContent = text;
        return td;
    }

    function createEstadoSelect(entrega) {
        const select = document.createElement("select");
        for (const [value, label] of Object.entries(ESTADOS)) {
            select.add(new Option(label, value, false, value === entrega.estado));
        }
        select.addEventListener("change", async () => {
            try {
                await updateEntrega(entrega.id, { estado: select.value });
            } catch (error) {
                showError(error);
                select.value = entrega.estado;
            }
        });
        return select;
    }

    function createRow(entrega) {
        const tr = document.createElement("tr");
        tr.append(
            createCell(entrega.taller),
            createCell(entrega.titulo),
            createCell(entrega.fecha_entrega)
        );

        const estadoTd = document.createElement("td");
        estadoTd.append(createEstadoSelect(entrega));

        const deleteTd = document.createElement("td");
        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.textContent = "Eliminar";
        deleteButton.addEventListener("click", async () => {
            try {
                await deleteEntrega(entrega.id);
                await render();
            } catch (error) {
                showError(error);
            }
        });
        deleteTd.append(deleteButton);

        tr.append(estadoTd, deleteTd);
        return tr;
    }

    async function render() {
        try {
            const entregas = await getEntregas();
            tbody.replaceChildren(...entregas.map(createRow));
            message.textContent = entregas.length === 0 ? "Aún no hay entregas." : "";
        } catch (error) {
            showError(error);
        }
    }

    form.addEventListener("submit", async (event) => {
        event.preventDefault();
        // Las claves salen del atributo name de cada input y coinciden con
        // las columnas de la tabla, por eso se puede enviar el objeto tal cual.
        const entrega = Object.fromEntries(new FormData(form));
        try {
            await createEntrega(entrega);
            form.reset();
            await render();
        } catch (error) {
            showError(error);
        }
    });

    render();
})();
