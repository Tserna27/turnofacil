/* Formulario de contacto (prototipo: el mensaje se guarda en el navegador) */
document.addEventListener("DOMContentLoaded", () => {
  const formulario = document.getElementById("formulario-contacto");
  const enviado = document.getElementById("mensaje-enviado");
  const usuario = obtenerSesion();
  document.getElementById("direccion-atencion").textContent = DIRECCION_ATENCION;

  if (usuario) { formulario.nombre.value = usuario.nombre; formulario.correo.value = usuario.correo; }

  // Los cambios y cancelaciones de citas solo los hace la administración, a pedido del usuario
  document.getElementById("nota-correo").innerHTML = "Para cambiar o cancelar una cita, escribe a <a href=\"mailto:" +
    escaparHtml(CORREO_ATENCION) + "\">" + escaparHtml(CORREO_ATENCION) + "</a> o usa este formulario con el asunto «Cambio o cancelación de una cita» y el código de tu cita.";
  if (parametro("asunto") === "cambio") formulario.asunto.value = "Cambio o cancelación de una cita";

  formulario.mensaje.addEventListener("input", () => {
    document.getElementById("contador-mensaje").textContent = formulario.mensaje.value.length + " / 600";
  });

  formulario.addEventListener("submit", (e) => {
    e.preventDefault();
    const nombre = formulario.nombre.value.trim();
    const correo = formulario.correo.value.trim().toLowerCase();
    const asunto = formulario.asunto.value;
    const mensaje = formulario.mensaje.value.trim();

    const ok = aplicarErrores([
      ["nombre", nombre.length >= 3 ? "" : "Escribe tu nombre."],
      ["correo", !correo ? "Escribe tu correo para poder responderte." : !correoValido(correo) ? "Revisa el correo: debe tener la forma nombre@correo.com." : ""],
      ["asunto", asunto ? "" : "Elige el asunto de tu mensaje."],
      ["mensaje", mensaje.length >= 10 ? "" : "Escribe tu mensaje (mínimo 10 letras)."]
    ]);
    if (!ok) return;

    const mensajes = Almacen.leer("tf_mensajes", []);
    const referencia = "MSJ-" + String(mensajes.length + 1).padStart(4, "0");
    mensajes.push({ referencia, nombre, correo, asunto, mensaje, enviadoEn: new Date().toISOString() });
    Almacen.guardar("tf_mensajes", mensajes);
    registrarActividad("Mensaje de contacto", referencia + " · " + asunto, usuario || { nombre, correo });

    document.getElementById("referencia-mensaje").textContent = "Tu número de referencia es " + referencia + ". En esta versión de prueba el mensaje queda guardado en este navegador.";
    enviado.hidden = false;
    formulario.hidden = true;
    enviado.scrollIntoView({ behavior: "smooth", block: "center" });
  });

  document.getElementById("otro-mensaje").addEventListener("click", () => {
    formulario.asunto.value = ""; formulario.mensaje.value = "";
    document.getElementById("contador-mensaje").textContent = "0 / 600";
    formulario.hidden = false; enviado.hidden = true;
    formulario.asunto.focus();
  });
});
