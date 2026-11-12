/* Consultar citas. Los usuarios no editan ni cancelan: lo piden por correo y solo la administración lo hace. */
document.addEventListener("DOMContentLoaded", () => {
  const usuario = requerirSesion();
  if (!usuario) return;

  const lista = document.getElementById("lista-citas");
  let filtro = "todas";

  document.getElementById("nota-cambios").innerHTML = textoCambiosPorCorreo();

  function citasDelUsuario() {
    return obtenerCitas()
      .filter((c) => c.correoUsuario === usuario.correo)
      .sort((a, b) => (a.fecha + a.hora).localeCompare(b.fecha + b.hora));
  }

  function pintar() {
    const todas = citasDelUsuario();
    const mostradas = todas.filter((c) => filtro === "todas" || c.estado === filtro);

    if (!todas.length) {
      lista.innerHTML = `
        <div class="estado-vacio">
          <h2 style="font-size:1.4rem">Aún no tienes citas</h2>
          <p>Agenda tu primera cita en cuatro pasos. Aquí verás su día, su hora y su estado.</p>
          <a class="boton boton--primario" href="agendar.html">Agendar mi primera cita</a>
        </div>`;
      return;
    }
    if (!mostradas.length) {
      lista.innerHTML = `<div class="estado-vacio"><p>No tienes citas con ese estado.</p></div>`;
      return;
    }

    lista.innerHTML = mostradas.map((c) => {
      const activa = c.estado === "Programada" && !citaPasada(c);
      const pasada = c.estado === "Programada" && citaPasada(c);
      return `
      <div>
        ${construirFicho(c)}
        <div class="cita-acciones">
          <a class="boton boton--contorno boton--pequeno" href="comprobante.html?id=${encodeURIComponent(c.id)}">Ver comprobante</a>
          ${activa ? `
            <a class="boton boton--contorno boton--pequeno" href="${escaparHtml(enlaceCorreoCambio(c))}">Pedir cambio o cancelación por correo</a>` : ""}
          ${pasada ? `<span class="campo__ayuda" style="align-self:center">Esta cita ya pasó.</span>` : ""}
        </div>
      </div>`;
    }).join("");
  }

  document.getElementById("filtros").addEventListener("click", (e) => {
    const b = e.target.closest("[data-filtro]");
    if (!b) return;
    filtro = b.dataset.filtro;
    document.querySelectorAll("#filtros .filtro").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
    pintar();
  });

  pintar();
});
