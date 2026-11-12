/* Comprobante de una cita: toda la información, listo para imprimir o guardar como PDF */
document.addEventListener("DOMContentLoaded", () => {
  const usuario = requerirSesion();
  if (!usuario) return;

  const zona = document.getElementById("zona-comprobante");
  const mensaje = document.getElementById("mensaje-resultado");
  const cita = obtenerCitas().find((c) => c.id === parametro("id") && c.correoUsuario === usuario.correo);

  if (!cita) {
    zona.innerHTML = `
      <div class="estado-vacio">
        <h1 style="font-size:1.6rem">No encontramos esa cita</h1>
        <p>Puede que el código esté mal escrito. Revisa tus citas.</p>
        <a class="boton boton--primario" href="mis-citas.html">Ir a mis citas</a>
      </div>`;
    return;
  }

  if (parametro("nueva")) {
    mensaje.innerHTML = `<div class="aviso aviso--ok" role="status"><p><strong>¡Tu cita quedó programada!</strong> Guarda o imprime este comprobante.</p></div>`;
  }

  const p = cita.paciente;
  const filas = [
    ["Código", cita.id],
    ["Estado", cita.estado],
    ["Servicio", cita.servicioNombre],
    ["Día", formatearFecha(cita.fecha)],
    ["Hora", formatearHora(cita.hora)],
    ["Duración de la consulta", DURACION_CONSULTA + " minutos (" + formatearRangoHora(cita.hora) + ")"],
    ["Lugar", DIRECCION_ATENCION],
    ["Paciente", p.nombres + " " + p.apellidos],
    ["Cédula", p.cedula],
    ["Fecha de nacimiento", formatearFecha(p.fechaNacimiento, true) + " (" + p.edad + " años)"],
    ["EPS", p.eps],
    ["Teléfono", p.telefono],
    ["Dirección", p.direccion],
    ["Atención prioritaria", p.grupoPrioritario],
    ["Descripción del paciente", p.descripcion],
    ["Cita registrada por", cita.registradaPor],
    ["Fecha de registro", formatearFechaHoraIso(cita.creadaEn)]
  ];
  if (cita.modificadaEn) filas.push(["Última modificación", formatearFechaHoraIso(cita.modificadaEn)]);
  if (cita.canceladaEn) filas.push(["Cancelada el", formatearFechaHoraIso(cita.canceladaEn)]);

  const activa = cita.estado === "Programada" && !citaPasada(cita);

  zona.innerHTML = `
    ${construirFicho(cita, { ancho: true })}

    <div class="tarjeta" style="margin-top:1.5rem">
      <div style="display:flex;align-items:center;gap:.75rem;margin-bottom:1rem">
        <img src="img/logo-96.png" alt="" width="44" height="42">
        <div><strong style="font-size:1.2rem">TurnoFácil Quibdó</strong><br><span class="campo__ayuda">Comprobante de cita</span></div>
      </div>
      <dl class="resumen">
        ${filas.map(([t, v]) => `<div class="resumen__fila"><dt>${escaparHtml(t)}</dt><dd>${escaparHtml(v)}</dd></div>`).join("")}
      </dl>
      <p class="campo__ayuda" style="margin-top:1rem">Recomendación: lleva tu documento de identidad y el soporte de tu EPS.</p>
      <p class="campo__ayuda">Para cambiar o cancelar esta cita, escribe a ${escaparHtml(CORREO_ATENCION)} con el código ${escaparHtml(cita.id)}. Solo la administración puede hacerlo.</p>
    </div>

    <div class="grupo-botones no-imprimir" style="margin-top:1.5rem">
      <button type="button" class="boton boton--primario" id="boton-imprimir">Imprimir o guardar PDF</button>
      ${activa ? `<a class="boton boton--contorno" href="${escaparHtml(enlaceCorreoCambio(cita))}">Pedir cambio o cancelación por correo</a>` : ""}
      <a class="boton boton--contorno" href="mis-citas.html">Mis citas</a>
      <a class="boton boton--menta" href="agendar.html">Agendar otra cita</a>
    </div>`;

  document.getElementById("boton-imprimir").addEventListener("click", () => window.print());
});
