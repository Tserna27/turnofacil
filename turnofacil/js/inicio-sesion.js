/* Inicio de sesión con correo y contraseña */
document.addEventListener("DOMContentLoaded", () => {
  const volver = parametro("volver");
  // Solo se permite volver a páginas de este mismo sitio
  const destino = volver && /^[a-z0-9-]+\.html(\?[\w=&%.-]*)?$/i.test(volver) ? volver : "mis-citas.html";

  const sesionActual = obtenerSesion();
  if (sesionActual && !esAdmin(sesionActual)) { window.location.replace(destino); return; }

  const formulario = document.getElementById("formulario-ingreso");
  const avisoError = document.getElementById("aviso-error");

  if (parametro("registrado")) {
    document.getElementById("aviso-registrado").hidden = false;
    formulario.correo.value = parametro("correo") || "";
  } else if (volver) {
    document.getElementById("aviso-necesita").hidden = false;
  }

  formulario.addEventListener("submit", (e) => {
    e.preventDefault();
    avisoError.hidden = true;
    const correo = formulario.correo.value.trim().toLowerCase();
    const clave = formulario.clave.value;

    const ok = aplicarErrores([
      ["correo", !correo ? "Escribe tu correo electrónico." : !correoValido(correo) ? "Revisa el correo: debe tener la forma nombre@correo.com." : ""],
      ["clave", clave ? "" : "Escribe tu contraseña."]
    ]);
    if (!ok) return;

    const usuario = obtenerUsuarios().find((u) => u.correo === correo && u.clave === clave);
    if (!usuario) {
      avisoError.querySelector("p").textContent = "El correo o la contraseña no son correctos. Revisa los datos o crea una cuenta.";
      avisoError.hidden = false;
      return;
    }
    iniciarSesionDe(usuario.correo);
    window.location.href = esAdmin(usuario) ? "admin-panel.html" : destino;
  });
});
