/* Blog breve de salud y opiniones de usuarios (agregar, editar y eliminar) */

// Opiniones de ejemplo para que la sección no se vea vacía en la demostración
const OPINIONES_EJEMPLO = [
  { id: "ejemplo-1", ejemplo: true, nombre: "Usuario de ejemplo", calificacion: 5, texto: "Opinión de ejemplo: poder elegir la hora desde casa es una gran ayuda.", creadaEn: "2026-11-01T10:00:00" },
  { id: "ejemplo-2", ejemplo: true, nombre: "Usuaria de ejemplo", calificacion: 4, texto: "Opinión de ejemplo: la página es clara y los botones se ven grandes.", creadaEn: "2026-11-02T15:30:00" }
];

document.addEventListener("DOMContentLoaded", () => {
  /* ---------- Entradas (las crea el administrador) ---------- */
  const entradas = obtenerEntradas().filter((e) => e.publicada)
    .sort((x, y) => y.fecha.localeCompare(x.fecha));
  const zonaArticulos = document.getElementById("lista-articulos");
  zonaArticulos.innerHTML = entradas.length ? entradas.map((a) => `
    <details class="articulo">
      <summary>
        ${a.imagen ? `<img class="articulo__imagen" src="${escaparHtml(a.imagen)}" alt="${escaparHtml(a.altImagen)}" loading="lazy">` : ""}
        <span class="articulo__meta">${escaparHtml(formatearFecha(a.fecha.slice(0, 10), true))} · Lectura de ${minutosDeLectura(a.contenido)} min</span>
        <h3>${escaparHtml(a.titulo)}</h3>
        <p>${escaparHtml(a.resumen)}</p>
      </summary>
      <div class="articulo__cuerpo">${a.contenido.split(/\n\s*\n/).map((p) => `<p>${escaparHtml(p.trim())}</p>`).join("")}</div>
    </details>`).join("")
    : `<div class="estado-vacio"><p>Pronto publicaremos nuevos consejos de salud.</p></div>`;

  /* ---------- Opiniones ---------- */
  const usuario = obtenerSesion();
  const lista = document.getElementById("lista-opiniones");
  const formulario = document.getElementById("formulario-opinion");
  const texto = document.getElementById("texto-opinion");
  let editandoId = null;

  const obtenerOpiniones = () => Almacen.leer("tf_opiniones", []);
  const guardarOpiniones = (l) => Almacen.guardar("tf_opiniones", l);

  document.getElementById("estrellas-entrada").innerHTML = [5, 4, 3, 2, 1].map((n) => `
    <input type="radio" name="calificacion" id="estrella-${n}" value="${n}">
    <label for="estrella-${n}" title="${n} ${n === 1 ? "estrella" : "estrellas"}"><span aria-hidden="true">★</span><span class="solo-lectores">${n} ${n === 1 ? "estrella" : "estrellas"}</span></label>`).join("");

  if (usuario) formulario.hidden = false;
  else document.getElementById("necesita-sesion").hidden = false;

  function estrellas(n) { return "★".repeat(n) + "☆".repeat(5 - n); }

  function pintar() {
    const propias = obtenerOpiniones().slice().reverse();
    const todas = propias.concat(OPINIONES_EJEMPLO);
    lista.innerHTML = todas.map((o) => {
      const mia = usuario && o.correo === usuario.correo;
      return `
      <article class="opinion" data-id="${escaparHtml(o.id)}">
        <div class="opinion__cabeza">
          <span class="opinion__nombre">${escaparHtml(o.nombre)}</span>
          <span class="estrellas" aria-hidden="true">${estrellas(o.calificacion)}</span>
          <span class="solo-lectores">Calificación: ${o.calificacion} de 5</span>
          <span class="opinion__fecha">${escaparHtml(formatearFechaHoraIso(o.creadaEn))}${o.editadaEn ? " (editada)" : ""}</span>
          ${o.ejemplo ? '<span class="insignia insignia--ejemplo">Ejemplo</span>' : ""}
        </div>
        <p style="margin:0">${escaparHtml(o.texto)}</p>
        ${mia ? `<div class="cita-acciones">
          <button type="button" class="boton boton--contorno boton--pequeno" data-editar="${escaparHtml(o.id)}">Editar</button>
          <button type="button" class="boton boton--peligro boton--pequeno" data-eliminar="${escaparHtml(o.id)}">Eliminar</button>
        </div>` : ""}
      </article>`;
    }).join("");
  }

  function salirDeEdicion() {
    editandoId = null;
    formulario.reset();
    document.getElementById("contador-opinion").textContent = "0 / 400";
    document.getElementById("titulo-formulario-opinion").textContent = "Deja tu opinión";
    document.getElementById("boton-guardar-opinion").textContent = "Publicar opinión";
    document.getElementById("boton-cancelar-edicion").hidden = true;
  }

  texto.addEventListener("input", () => {
    document.getElementById("contador-opinion").textContent = texto.value.length + " / 400";
  });

  formulario.addEventListener("submit", (e) => {
    e.preventDefault();
    const marcada = formulario.querySelector('input[name="calificacion"]:checked');
    const comentario = texto.value.trim();
    const ok = aplicarErrores([
      ["grupo-calificacion", marcada ? "" : "Elige de 1 a 5 estrellas."],
      ["texto-opinion", comentario.length >= 10 ? "" : "Escribe tu comentario (mínimo 10 letras)."]
    ]);
    if (!ok) return;

    const opiniones = obtenerOpiniones();
    if (editandoId) {
      const o = opiniones.find((x) => x.id === editandoId && x.correo === usuario.correo);
      if (o) { o.calificacion = Number(marcada.value); o.texto = comentario; o.editadaEn = new Date().toISOString(); }
      registrarActividad("Opinión editada", comentario.slice(0, 60));
      mostrarAviso("Guardamos los cambios de tu opinión.");
    } else {
      opiniones.push({
        id: "op-" + Date.now(), correo: usuario.correo, nombre: nombreCorto(usuario.nombre),
        calificacion: Number(marcada.value), texto: comentario, creadaEn: new Date().toISOString()
      });
      registrarActividad("Opinión publicada", comentario.slice(0, 60));
      mostrarAviso("Publicamos tu opinión. ¡Gracias!");
    }
    guardarOpiniones(opiniones);
    salirDeEdicion();
    pintar();
  });

  document.getElementById("boton-cancelar-edicion").addEventListener("click", salirDeEdicion);

  lista.addEventListener("click", async (e) => {
    const bEditar = e.target.closest("[data-editar]");
    const bEliminar = e.target.closest("[data-eliminar]");
    if (bEditar) {
      const o = obtenerOpiniones().find((x) => x.id === bEditar.dataset.editar && x.correo === usuario.correo);
      if (!o) return;
      editandoId = o.id;
      formulario.querySelector(`input[name="calificacion"][value="${o.calificacion}"]`).checked = true;
      texto.value = o.texto;
      document.getElementById("contador-opinion").textContent = o.texto.length + " / 400";
      document.getElementById("titulo-formulario-opinion").textContent = "Editar tu opinión";
      document.getElementById("boton-guardar-opinion").textContent = "Guardar cambios";
      document.getElementById("boton-cancelar-edicion").hidden = false;
      document.getElementById("zona-formulario-opinion").scrollIntoView({ behavior: "smooth", block: "center" });
      texto.focus({ preventScroll: true });
    } else if (bEliminar) {
      const si = await confirmarAccion({
        titulo: "¿Eliminar tu opinión?", mensaje: "Se borrará de la lista y no se puede recuperar.",
        textoAceptar: "Sí, eliminar", textoCancelar: "No, conservarla", peligro: true
      });
      if (si) {
        guardarOpiniones(obtenerOpiniones().filter((x) => !(x.id === bEliminar.dataset.eliminar && x.correo === usuario.correo)));
        if (editandoId === bEliminar.dataset.eliminar) salirDeEdicion();
        pintar();
        registrarActividad("Opinión eliminada", "");
        mostrarAviso("Eliminamos tu opinión.");
      }
    }
  });

  pintar();
});
