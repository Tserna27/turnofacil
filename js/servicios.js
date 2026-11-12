/* Lista de servicios (inicio y página de servicios) con búsqueda por lo que siente el paciente */

function tarjetaServicio(s) {
  return `
    <article class="tarjeta servicio">
      <span class="servicio__icono" aria-hidden="true">${s.icono}</span>
      <h3>${escaparHtml(s.nombre)}</h3>
      <p>${escaparHtml(s.descripcion)}</p>
      <ul>${s.sirvePara.map((t) => `<li>${escaparHtml(t)}</li>`).join("")}</ul>
      <a class="boton boton--primario boton--pequeno" href="agendar.html?servicio=${encodeURIComponent(s.id)}">
        Agendar <span class="solo-lectores">${escaparHtml(s.nombre)}</span>
      </a>
    </article>`;
}

document.addEventListener("DOMContentLoaded", () => {
  const lista = document.getElementById("lista-servicios");
  if (!lista) return;
  const buscador = document.getElementById("buscador-servicios");
  const mensaje = document.getElementById("mensaje-busqueda");

  function pintar(texto) {
    const t = quitarTildes(texto || "").trim();
    const palabras = t.split(/\s+/).filter(Boolean);
    const filtrados = !palabras.length ? SERVICIOS : SERVICIOS.filter((s) => {
      const bolsa = quitarTildes([s.nombre, s.descripcion, ...s.sirvePara, ...s.palabras].join(" "));
      return palabras.every((p) => bolsa.includes(p));
    });
    lista.innerHTML = filtrados.map(tarjetaServicio).join("");
    if (mensaje) {
      mensaje.textContent = filtrados.length
        ? (palabras.length ? `${filtrados.length} servicio(s) encontrado(s).` : "")
        : "No encontramos un servicio con esas palabras. Prueba con otra, por ejemplo «dolor» o «embarazo», o escríbenos en Contacto.";
    }
  }
  pintar("");
  if (buscador) buscador.addEventListener("input", () => pintar(buscador.value));
});
