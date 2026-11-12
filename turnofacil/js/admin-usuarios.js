/* Tabla de usuarios: quiénes se registraron, cuándo ingresaron y qué han hecho */
document.addEventListener("DOMContentLoaded", () => {
  if (!requerirAdmin()) return;

  const zona = document.getElementById("tabla-usuarios");
  const busqueda = document.getElementById("busqueda");
  const hoy = claveFecha(new Date());

  function usuarios() {
    const citas = obtenerCitas();
    const opiniones = Almacen.leer("tf_opiniones", []);
    return obtenerUsuarios().filter((u) => !esAdmin(u)).map((u) => {
      const mias = citas.filter((c) => c.correoUsuario === u.correo);
      return {
        nombre: u.nombre, correo: u.correo, creadoEn: u.creadoEn, ultimoIngreso: u.ultimoIngreso || "",
        ingresos: u.ingresos || 0,
        programadas: mias.filter((c) => c.estado === "Programada").length,
        canceladas: mias.filter((c) => c.estado === "Cancelada").length,
        opiniones: opiniones.filter((o) => o.correo === u.correo).length
      };
    }).sort((a, b) => (b.ultimoIngreso || b.creadoEn || "").localeCompare(a.ultimoIngreso || a.creadoEn || ""));
  }

  function pintar() {
    const todos = usuarios();
    document.getElementById("metricas").innerHTML = [
      [todos.length, "Usuarios registrados"],
      [todos.filter((u) => u.programadas + u.canceladas > 0).length, "Con al menos una cita"],
      [todos.filter((u) => u.ultimoIngreso && claveFecha(new Date(u.ultimoIngreso)) === hoy).length, "Ingresaron hoy"]
    ].map(([n, t]) => `<div class="metrica"><strong>${n}</strong><span>${escaparHtml(t)}</span></div>`).join("");

    const t = quitarTildes(busqueda.value).trim();
    const lista = todos.filter((u) => !t || quitarTildes(u.nombre + " " + u.correo).includes(t));

    if (!todos.length) { zona.innerHTML = estadoVacio("Aún no hay usuarios", "Cuando alguien cree su cuenta en el sitio, aparecerá aquí."); return; }
    if (!lista.length) { zona.innerHTML = estadoVacio("No encontramos a nadie con esa búsqueda", "Prueba con otro nombre o correo."); return; }

    zona.innerHTML = `
      <div class="tabla-envoltura">
        <table>
          <thead><tr>
            <th scope="col">Nombre</th><th scope="col">Correo</th><th scope="col">Registro</th><th scope="col">Último ingreso</th>
            <th scope="col">Ingresos</th><th scope="col">Citas programadas</th><th scope="col">Citas canceladas</th><th scope="col">Opiniones</th>
          </tr></thead>
          <tbody>
            ${lista.map((u) => `<tr>
              <td data-etiqueta="Nombre">${escaparHtml(u.nombre)}</td>
              <td data-etiqueta="Correo">${escaparHtml(u.correo)}</td>
              <td data-etiqueta="Registro">${u.creadoEn ? escaparHtml(formatearFechaHoraIso(u.creadoEn)) : "—"}</td>
              <td data-etiqueta="Último ingreso">${u.ultimoIngreso ? escaparHtml(formatearFechaHoraIso(u.ultimoIngreso)) : "Aún no ingresa"}</td>
              <td data-etiqueta="Ingresos">${u.ingresos}</td>
              <td data-etiqueta="Citas programadas">${u.programadas}</td>
              <td data-etiqueta="Citas canceladas">${u.canceladas}</td>
              <td data-etiqueta="Opiniones">${u.opiniones}</td>
            </tr>`).join("")}
          </tbody>
        </table>
      </div>
      <div class="grupo-botones" style="margin-top:1.25rem">
        <button type="button" class="boton boton--contorno" id="boton-csv">Descargar en Excel (CSV)</button>
      </div>`;

    document.getElementById("boton-csv").addEventListener("click", () => {
      descargarCsv("usuarios-turnofacil.csv",
        ["Nombre", "Correo", "Registro", "Último ingreso", "Ingresos", "Citas programadas", "Citas canceladas", "Opiniones"],
        lista.map((u) => [u.nombre, u.correo, u.creadoEn, u.ultimoIngreso, u.ingresos, u.programadas, u.canceladas, u.opiniones]));
    });
  }

  busqueda.addEventListener("input", pintar);
  pintar();
});
