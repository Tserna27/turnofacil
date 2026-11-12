/* Resumen del panel de administración */
document.addEventListener("DOMContentLoaded", () => {
  if (!requerirAdmin()) return;

  const hoy = claveFecha(new Date());
  const usuarios = obtenerUsuarios().filter((u) => !esAdmin(u));
  const citas = obtenerCitas();
  const mensajes = Almacen.leer("tf_mensajes", []);
  const actividad = obtenerActividad();
  const ingresosHoy = new Set(actividad
    .filter((a) => a.tipo === "Inicio de sesión" && a.rol === "Usuario" && claveFecha(new Date(a.fecha)) === hoy)
    .map((a) => a.correo)).size;

  const datos = [
    [usuarios.length, "Usuarios registrados"],
    [ingresosHoy, "Usuarios que ingresaron hoy"],
    [citas.filter((c) => c.estado === "Programada").length, "Citas programadas"],
    [citas.filter((c) => c.estado === "Cancelada").length, "Citas canceladas"],
    [mensajes.filter((m) => !m.atendido).length, "Mensajes sin atender"],
    [obtenerEntradas().filter((e) => e.publicada).length, "Entradas de blog publicadas"]
  ];
  document.getElementById("metricas").innerHTML = datos.map(([n, t]) =>
    `<div class="metrica"><strong>${n}</strong><span>${escaparHtml(t)}</span></div>`).join("");

  const reciente = actividad.slice(-8).reverse();
  document.getElementById("actividad-reciente").innerHTML = reciente.length
    ? reciente.map((a) => `<li><strong>${escaparHtml(a.tipo)}</strong>
        <span>${escaparHtml(a.detalle)}</span>
        <small>${escaparHtml(a.nombre)} · ${escaparHtml(formatearFechaHoraIso(a.fecha))}</small></li>`).join("")
    : `<li><span>Todavía no hay actividad. Aparecerá aquí cuando alguien se registre o agende una cita.</span></li>`;

  const proximas = citas
    .filter((c) => c.estado === "Programada" && !citaPasada(c))
    .sort((a, b) => (a.fecha + a.hora).localeCompare(b.fecha + b.hora))
    .slice(0, 6);
  document.getElementById("proximas-citas").innerHTML = proximas.length
    ? proximas.map((c) => `<li><strong>${escaparHtml(formatearFecha(c.fecha, true))}, ${escaparHtml(formatearHora(c.hora))} · ${escaparHtml(c.servicioNombre)}</strong>
        <small>${escaparHtml(c.paciente.nombres + " " + c.paciente.apellidos)} · ${escaparHtml(c.id)}</small></li>`).join("")
    : `<li><span>No hay citas próximas.</span></li>`;
});
