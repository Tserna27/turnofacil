/* Mensajes enviados desde la página de Contacto */
document.addEventListener("DOMContentLoaded", () => {
  const admin = requerirAdmin();
  if (!admin) return;

  const lista = document.getElementById("lista-mensajes");
  const filtro = document.getElementById("filtro-estado");

  function pintar() {
    const todos = Almacen.leer("tf_mensajes", []);
    const mostrados = todos.slice().reverse().filter((m) =>
      !filtro.value || (filtro.value === "atendido" ? m.atendido : !m.atendido));

    if (!todos.length) { lista.innerHTML = estadoVacio("Aún no hay mensajes", "Cuando alguien escriba desde la página de Contacto, lo verás aquí."); return; }
    if (!mostrados.length) { lista.innerHTML = estadoVacio("No hay mensajes con ese filtro", "Cambia a «Todos» para ver el resto."); return; }

    lista.innerHTML = mostrados.map((m) => `
      <article class="mensaje-admin ${m.atendido ? "mensaje-admin--atendido" : ""}">
        <h3>${escaparHtml(m.asunto)} <span class="insignia ${m.atendido ? "insignia--programada" : "insignia--borrador"}">${m.atendido ? "Atendido" : "Pendiente"}</span></h3>
        <p class="campo__ayuda" style="margin-bottom:.5rem">
          ${escaparHtml(m.referencia)} · ${escaparHtml(m.nombre)} ·
          <a href="mailto:${escaparHtml(m.correo)}">${escaparHtml(m.correo)}</a> · ${escaparHtml(formatearFechaHoraIso(m.enviadoEn))}
        </p>
        <p>${escaparHtml(m.mensaje)}</p>
        <button type="button" class="boton boton--contorno boton--pequeno" data-alternar="${escaparHtml(m.referencia)}">
          ${m.atendido ? "Marcar como pendiente" : "Marcar como atendido"}
        </button>
      </article>`).join("");
  }

  lista.addEventListener("click", (e) => {
    const b = e.target.closest("[data-alternar]");
    if (!b) return;
    const todos = Almacen.leer("tf_mensajes", []);
    const m = todos.find((x) => x.referencia === b.dataset.alternar);
    if (!m) return;
    m.atendido = !m.atendido;
    Almacen.guardar("tf_mensajes", todos);
    registrarActividad(m.atendido ? "Mensaje atendido" : "Mensaje marcado como pendiente", m.referencia + " · " + m.asunto);
    pintar();
  });
  filtro.addEventListener("change", pintar);
  pintar();
});
