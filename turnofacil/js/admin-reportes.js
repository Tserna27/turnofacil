/* Reportes de gestión de citas (todos los usuarios): resumen, tabla, impresión y CSV */
document.addEventListener("DOMContentLoaded", () => {
  const admin = requerirAdmin();
  if (!admin) return;

  const zona = document.getElementById("contenido-reporte");
  const selEstado = document.getElementById("filtro-estado");
  const selServicio = document.getElementById("filtro-servicio");
  const desde = document.getElementById("filtro-desde");
  const hasta = document.getElementById("filtro-hasta");
  const DIAS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

  selServicio.innerHTML += SERVICIOS.map((s) => `<option value="${s.id}">${escaparHtml(s.nombre)}</option>`).join("");
  document.getElementById("datos-impresion").textContent =
    `TurnoFácil Quibdó · Reporte de citas · Generado el ${formatearFechaHoraIso(new Date().toISOString())} por ${admin.nombre}`;

  function citasFiltradas() {
    return obtenerCitas()
      .filter((c) => !selEstado.value || c.estado === selEstado.value)
      .filter((c) => !selServicio.value || c.servicioId === selServicio.value)
      .filter((c) => !desde.value || c.fecha >= desde.value)
      .filter((c) => !hasta.value || c.fecha <= hasta.value)
      .sort((a, b) => (a.fecha + a.hora).localeCompare(b.fecha + b.hora));
  }
  function contar(citas, clave) {
    const r = {}; citas.forEach((c) => { const k = clave(c) || "Sin dato"; r[k] = (r[k] || 0) + 1; }); return r;
  }

  function pintar() {
    const citas = citasFiltradas();
    if (!citas.length) {
      const hay = obtenerCitas().length > 0;
      zona.innerHTML = estadoVacio(hay ? "No hay citas con esos filtros" : "Aún no hay citas para reportar",
        hay ? "Cambia el estado, el servicio o las fechas para ver más resultados." : "Cuando los usuarios agenden citas, aquí verás el resumen y el detalle.");
      return;
    }
    const programadas = citas.filter((c) => c.estado === "Programada").length;
    const personas = new Set(citas.map((c) => c.correoUsuario)).size;

    zona.innerHTML = `
      <div class="metricas">
        <div class="metrica"><strong>${citas.length}</strong><span>Citas en total</span></div>
        <div class="metrica"><strong>${programadas}</strong><span>Programadas</span></div>
        <div class="metrica"><strong>${citas.length - programadas}</strong><span>Canceladas</span></div>
        <div class="metrica"><strong>${personas}</strong><span>Usuarios con citas</span></div>
      </div>

      <div class="rejilla rejilla--2" style="margin-bottom:1.5rem">
        ${barrasHtml("Citas por servicio", contar(citas, (c) => c.servicioNombre), citas.length)}
        ${barrasHtml("Citas por día de la semana", contar(citas, (c) => DIAS[fechaDesdeClave(c.fecha).getDay()]), citas.length)}
        ${barrasHtml("Quién registró la cita", contar(citas, (c) => c.registradaPor), citas.length)}
        ${barrasHtml("Atención prioritaria", contar(citas, (c) => c.paciente.grupoPrioritario), citas.length)}
        ${barrasHtml("Citas por EPS", contar(citas, (c) => c.paciente.eps), citas.length)}
      </div>

      <h2 style="font-size:1.4rem">Detalle de las citas</h2>
      <div class="tabla-envoltura">
        <table>
          <thead><tr>
            <th scope="col">Código</th><th scope="col">Estado</th><th scope="col">Servicio</th><th scope="col">Día y hora</th>
            <th scope="col">Paciente</th><th scope="col">Cédula</th><th scope="col">EPS</th><th scope="col">Teléfono</th>
            <th scope="col">Prioridad</th><th scope="col">Registrada por</th><th scope="col">Cuenta</th>
          </tr></thead>
          <tbody>
            ${citas.map((c) => `<tr>
              <td data-etiqueta="Código">${escaparHtml(c.id)}</td>
              <td data-etiqueta="Estado">${escaparHtml(c.estado)}</td>
              <td data-etiqueta="Servicio">${escaparHtml(c.servicioNombre)}</td>
              <td data-etiqueta="Día y hora">${escaparHtml(formatearFecha(c.fecha, true))}, ${escaparHtml(formatearHora(c.hora))}</td>
              <td data-etiqueta="Paciente">${escaparHtml(c.paciente.nombres + " " + c.paciente.apellidos)}</td>
              <td data-etiqueta="Cédula">${escaparHtml(c.paciente.cedula)}</td>
              <td data-etiqueta="EPS">${escaparHtml(c.paciente.eps)}</td>
              <td data-etiqueta="Teléfono">${escaparHtml(c.paciente.telefono)}</td>
              <td data-etiqueta="Prioridad">${escaparHtml(c.paciente.grupoPrioritario)}</td>
              <td data-etiqueta="Registrada por">${escaparHtml(c.registradaPor)}</td>
              <td data-etiqueta="Cuenta">${escaparHtml(c.correoUsuario)}</td>
            </tr>`).join("")}
          </tbody>
        </table>
      </div>
      <p class="campo__ayuda" style="margin-top:.75rem">Lugar de todas las citas: ${escaparHtml(DIRECCION_ATENCION)}. Atención de lunes a viernes.</p>

      <div class="grupo-botones no-imprimir" style="margin-top:1.5rem">
        <button type="button" class="boton boton--primario" id="boton-imprimir">Imprimir o guardar PDF</button>
        <button type="button" class="boton boton--contorno" id="boton-csv">Descargar en Excel (CSV)</button>
      </div>`;

    document.getElementById("boton-imprimir").addEventListener("click", () => window.print());
    document.getElementById("boton-csv").addEventListener("click", () => {
      const cabecera = ["Código", "Estado", "Servicio", "Fecha", "Hora", "Lugar", "Nombres", "Apellidos", "Cédula", "Fecha de nacimiento",
        "Edad", "EPS", "Teléfono", "Dirección", "Atención prioritaria", "Descripción", "Registrada por", "Cuenta", "Fecha de registro"];
      const filas = citas.map((c) => [c.id, c.estado, c.servicioNombre, c.fecha, c.hora, DIRECCION_ATENCION, c.paciente.nombres,
        c.paciente.apellidos, c.paciente.cedula, c.paciente.fechaNacimiento, c.paciente.edad, c.paciente.eps, c.paciente.telefono,
        c.paciente.direccion, c.paciente.grupoPrioritario, c.paciente.descripcion, c.registradaPor, c.correoUsuario, c.creadaEn]);
      descargarCsv("reporte-citas-turnofacil.csv", cabecera, filas);
    });
  }

  [selEstado, selServicio, desde, hasta].forEach((c) => c.addEventListener("change", pintar));
  pintar();
});
