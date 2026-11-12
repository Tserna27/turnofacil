/* Administración del blog: crear, editar, publicar u ocultar y eliminar entradas con texto e imagen */
document.addEventListener("DOMContentLoaded", () => {
  if (!requerirAdmin()) return;

  const lista = document.getElementById("lista-entradas");
  const panel = document.getElementById("panel-formulario");
  const formulario = document.getElementById("formulario-entrada");
  const vistaPrevia = document.getElementById("vista-previa");
  const botonQuitar = document.getElementById("quitar-imagen");
  const campoAlt = document.getElementById("campo-alt");
  let editandoId = null;
  let imagen = ""; // imagen reducida, guardada como texto (data URL)

  const el = (id) => document.getElementById(id);
  const ahoraLocal = () => {
    const d = new Date(), dos = (n) => String(n).padStart(2, "0");
    return `${claveFecha(d)}T${dos(d.getHours())}:${dos(d.getMinutes())}:${dos(d.getSeconds())}`;
  };
  function guardarEntradas(entradas) {
    try { Almacen.guardarSeguro("tf_entradas", entradas); return true; } catch (e) { return false; }
  }

  /* ---------- Imagen: se reduce para que la página cargue rápido ---------- */
  function procesarImagen(archivo) {
    return new Promise((resolver, rechazar) => {
      const lector = new FileReader();
      lector.onerror = () => rechazar(new Error("No pudimos leer el archivo."));
      lector.onload = () => {
        const img = new Image();
        img.onerror = () => rechazar(new Error("El archivo no es una imagen válida."));
        img.onload = () => {
          let ancho = Math.min(960, img.width), calidad = 0.78, url = "";
          for (let i = 0; i < 4; i++) {
            const escala = ancho / img.width;
            const lienzo = document.createElement("canvas");
            lienzo.width = Math.round(img.width * escala);
            lienzo.height = Math.round(img.height * escala);
            const ctx = lienzo.getContext("2d");
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(0, 0, lienzo.width, lienzo.height);
            ctx.drawImage(img, 0, 0, lienzo.width, lienzo.height);
            url = lienzo.toDataURL("image/jpeg", calidad);
            if (url.length < 260000) break; // unos 190 KB
            ancho = Math.round(ancho * 0.8); calidad = Math.max(0.5, calidad - 0.08);
          }
          resolver(url);
        };
        img.src = lector.result;
      };
      lector.readAsDataURL(archivo);
    });
  }

  function mostrarImagen(url) {
    imagen = url || "";
    vistaPrevia.hidden = !imagen;
    botonQuitar.hidden = !imagen;
    campoAlt.hidden = !imagen;
    if (imagen) vistaPrevia.src = imagen; else vistaPrevia.removeAttribute("src");
  }

  el("imagen").addEventListener("change", async () => {
    const archivo = el("imagen").files[0];
    ponerError("imagen", "");
    if (!archivo) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(archivo.type)) {
      ponerError("imagen", "Elige una imagen JPG, PNG o WebP."); el("imagen").value = ""; return;
    }
    if (archivo.size > 10 * 1024 * 1024) {
      ponerError("imagen", "La imagen pesa más de 10 MB. Elige una más pequeña."); el("imagen").value = ""; return;
    }
    try { mostrarImagen(await procesarImagen(archivo)); }
    catch (e) { ponerError("imagen", e.message); el("imagen").value = ""; }
  });
  botonQuitar.addEventListener("click", () => { mostrarImagen(""); el("imagen").value = ""; el("alt-imagen").value = ""; });

  /* ---------- Formulario ---------- */
  function abrirFormulario(entrada) {
    editandoId = entrada ? entrada.id : null;
    formulario.reset();
    ["titulo", "resumen", "contenido-entrada", "imagen"].forEach((id) => ponerError(id, ""));
    el("titulo-formulario").textContent = entrada ? "Editar entrada" : "Nueva entrada";
    el("boton-guardar").textContent = entrada ? "Guardar cambios" : "Guardar entrada";
    el("titulo").value = entrada ? entrada.titulo : "";
    el("resumen").value = entrada ? entrada.resumen : "";
    el("contenido-entrada").value = entrada ? entrada.contenido : "";
    el("alt-imagen").value = entrada ? entrada.altImagen || "" : "";
    el("publicada").checked = entrada ? !!entrada.publicada : true;
    mostrarImagen(entrada ? entrada.imagen : "");
    panel.hidden = false;
    panel.scrollIntoView({ behavior: "smooth", block: "start" });
    el("titulo").focus({ preventScroll: true });
  }
  function cerrarFormulario() { panel.hidden = true; editandoId = null; formulario.reset(); mostrarImagen(""); }

  el("boton-nueva").addEventListener("click", () => abrirFormulario(null));
  el("boton-cancelar").addEventListener("click", cerrarFormulario);

  formulario.addEventListener("submit", (e) => {
    e.preventDefault();
    const titulo = el("titulo").value.trim().replace(/\s+/g, " ");
    const resumen = el("resumen").value.trim().replace(/\s+/g, " ");
    const contenido = el("contenido-entrada").value.replace(/\r\n/g, "\n").trim();
    const ok = aplicarErrores([
      ["titulo", titulo.length >= 5 ? "" : "Escribe un título de al menos 5 letras."],
      ["resumen", resumen.length >= 10 ? "" : "Escribe un resumen de al menos 10 letras."],
      ["contenido-entrada", contenido.length >= 50 ? "" : "El texto es muy corto. Escribe al menos 50 letras."]
    ]);
    if (!ok) return;

    const entradas = obtenerEntradas();
    const datos = {
      titulo, resumen, contenido, imagen, publicada: el("publicada").checked,
      altImagen: imagen ? (el("alt-imagen").value.trim() || titulo) : ""
    };
    let accion;
    if (editandoId) {
      const entrada = entradas.find((x) => x.id === editandoId);
      if (!entrada) return;
      Object.assign(entrada, datos, { editadaEn: ahoraLocal() });
      accion = "Entrada del blog editada";
    } else {
      entradas.unshift(Object.assign({ id: "entrada-" + Date.now(), fecha: ahoraLocal(), autor: "Equipo TurnoFácil" }, datos));
      accion = "Entrada del blog creada";
    }
    if (!guardarEntradas(entradas)) {
      ponerError("imagen", "No hay espacio en este navegador para guardar la entrada. Usa una imagen más pequeña o quita la imagen de otras entradas.");
      el("imagen").focus();
      return;
    }
    registrarActividad(accion, titulo + (datos.publicada ? " (publicada)" : " (borrador)"));
    mostrarAviso(editandoId ? "Guardamos los cambios de la entrada." : "Creamos la entrada.");
    cerrarFormulario();
    pintar();
  });

  /* ---------- Lista ---------- */
  function pintar() {
    const entradas = obtenerEntradas().slice().sort((a, b) => b.fecha.localeCompare(a.fecha));
    if (!entradas.length) { lista.innerHTML = estadoVacio("Aún no hay entradas", "Toca «Nueva entrada» para crear la primera."); return; }
    lista.innerHTML = entradas.map((e) => `
      <article class="entrada-admin">
        ${e.imagen ? `<img class="entrada-admin__miniatura" src="${escaparHtml(e.imagen)}" alt="">` : `<span class="entrada-admin__miniatura" aria-hidden="true">📝</span>`}
        <div>
          <h3>${escaparHtml(e.titulo)}</h3>
          <p><span class="insignia ${e.publicada ? "insignia--programada" : "insignia--borrador"}">${e.publicada ? "Publicada" : "Borrador"}</span>
             ${escaparHtml(formatearFecha(e.fecha.slice(0, 10), true))}</p>
          <p style="margin-top:.4rem">${escaparHtml(e.resumen)}</p>
          <div class="cita-acciones">
            <button type="button" class="boton boton--contorno boton--pequeno" data-editar="${escaparHtml(e.id)}">Editar</button>
            <button type="button" class="boton boton--contorno boton--pequeno" data-alternar="${escaparHtml(e.id)}">${e.publicada ? "Ocultar del sitio" : "Publicar"}</button>
            <button type="button" class="boton boton--peligro boton--pequeno" data-eliminar="${escaparHtml(e.id)}">Eliminar</button>
          </div>
        </div>
      </article>`).join("");
  }

  lista.addEventListener("click", async (e) => {
    const bEditar = e.target.closest("[data-editar]");
    const bAlternar = e.target.closest("[data-alternar]");
    const bEliminar = e.target.closest("[data-eliminar]");
    const entradas = obtenerEntradas();
    if (bEditar) {
      const entrada = entradas.find((x) => x.id === bEditar.dataset.editar);
      if (entrada) abrirFormulario(entrada);
    } else if (bAlternar) {
      const entrada = entradas.find((x) => x.id === bAlternar.dataset.alternar);
      if (!entrada) return;
      entrada.publicada = !entrada.publicada;
      guardarEntradas(entradas);
      registrarActividad(entrada.publicada ? "Entrada del blog publicada" : "Entrada del blog oculta", entrada.titulo);
      mostrarAviso(entrada.publicada ? "La entrada ya se ve en el sitio." : "La entrada quedó oculta del sitio.");
      pintar();
    } else if (bEliminar) {
      const entrada = entradas.find((x) => x.id === bEliminar.dataset.eliminar);
      if (!entrada) return;
      const si = await confirmarAccion({
        titulo: "¿Eliminar esta entrada?", mensaje: `Se borrará «${entrada.titulo}» y no se puede recuperar. Si solo quieres que no se vea, usa «Ocultar del sitio».`,
        textoAceptar: "Sí, eliminar", textoCancelar: "No, conservarla", peligro: true
      });
      if (si) {
        guardarEntradas(entradas.filter((x) => x.id !== entrada.id));
        registrarActividad("Entrada del blog eliminada", entrada.titulo);
        if (editandoId === entrada.id) cerrarFormulario();
        mostrarAviso("Eliminamos la entrada.");
        pintar();
      }
    }
  });

  pintar();
});
