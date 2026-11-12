/* Registro de actividad: qué hizo cada persona y cuándo */
document.addEventListener("DOMContentLoaded", () => {
  if (!requerirAdmin()) return;

  const zona = document.getElementById("tabla-actividad");
  const selTipo = document.getElementById("filtro-tipo");
  const busqueda = document.getElementById("busqueda");
  const LIMITE = 200;

  const todas = obtenerActividad().slice().reverse(); // lo más nuevo primero
  const tipos = Array.from(new Set(todas.map((a) => a.tipo))).sort((a, b) => a.localeCompare(b, "es"));
  selTipo.innerHTML += tipos.map((t) => `<option value="${escaparHtml(t)}">${escaparHtml(t)}</option>`).join("");

  function pintar() {
    const t = quitarTildes(busqueda.value).trim();
    const filtradas = todas
      .filter((a) => !selTipo.value || a.tipo === selTipo.value)
      .filter((a) => !t || quitarTildes([a.nombre, a.correo, a.detalle, a.tipo].join(" ")).includes(t));

    if (!todas.length) { zona.innerHTML = estadoVacio("Todavía no hay actividad", "Aquí aparecerán los registros, ingresos, citas, opiniones y mensajes."); return; }
    if (!filtradas.length) { zona.innerHTML = estadoVacio("No hay actividad con esos filtros", "Cambia el tipo o la búsqueda."); return; }

    const visibles = filtradas.slice(0, LIMITE);
    zona.innerHTML = `
      <p class="campo__ayuda">${filtradas.length > LIMITE ? `Mostrando las ${LIMITE} más recientes de ${filtradas.length}.` : `${filtradas.length} ${filtradas.length === 1 ? "registro" : "registros"}.`}</p>
      <div class="tabla-envoltura">
        <table>
          <thead><tr><th scope="col">Fecha y hora</th><th scope="col">Quién</th><th scope="col">Rol</th><th scope="col">Actividad</th><th scope="col">Detalle</th></tr></thead>
          <tbody>
            ${visibles.map((a) => `<tr>
              <td data-etiqueta="Fecha y hora">${escaparHtml(formatearFechaHoraIso(a.fecha))}</td>
              <td data-etiqueta="Quién">${escaparHtml(a.nombre)}${a.correo ? `<br><small>${escaparHtml(a.correo)}</small>` : ""}</td>
              <td data-etiqueta="Rol">${escaparHtml(a.rol)}</td>
              <td data-etiqueta="Actividad">${escaparHtml(a.tipo)}</td>
              <td data-etiqueta="Detalle" class="celda-larga">${escaparHtml(a.detalle || "—")}</td>
            </tr>`).join("")}
          </tbody>
        </table>
      </div>
      <div class="grupo-botones" style="margin-top:1.25rem">
        <button type="button" class="boton boton--contorno" id="boton-csv">Descargar en Excel (CSV)</button>
      </div>`;

    document.getElementById("boton-csv").addEventListener("click", () => {
      descargarCsv("actividad-turnofacil.csv", ["Fecha", "Nombre", "Correo", "Rol", "Actividad", "Detalle"],
        filtradas.map((a) => [a.fecha, a.nombre, a.correo, a.rol, a.tipo, a.detalle]));
    });
  }

  selTipo.addEventListener("change", pintar);
  busqueda.addEventListener("input", pintar);
  pintar();
});
