/* Ingreso del administrador (cuenta de prueba definida en comun.js) */
document.addEventListener("DOMContentLoaded", () => {
  const actual = obtenerSesion();
  if (actual && esAdmin(actual)) { window.location.replace("admin-panel.html"); return; }

  document.getElementById("dato-correo").textContent = ADMIN_CORREO;
  document.getElementById("dato-clave").textContent = ADMIN_CLAVE_DEMO;
  if (parametro("sinpermiso")) document.getElementById("aviso-sinpermiso").hidden = false;

  const formulario = document.getElementById("formulario-admin");
  const avisoError = document.getElementById("aviso-error");

  formulario.addEventListener("submit", (e) => {
    e.preventDefault();
    avisoError.hidden = true;
    const correo = formulario.correo.value.trim().toLowerCase();
    const clave = formulario.clave.value;
    const ok = aplicarErrores([
      ["correo", !correo ? "Escribe el correo de administrador." : !correoValido(correo) ? "Revisa el correo: debe tener la forma nombre@correo.com." : ""],
      ["clave", clave ? "" : "Escribe la contraseña."]
    ]);
    if (!ok) return;

    const usuario = obtenerUsuarios().find((u) => u.correo === correo && u.clave === clave);
    if (!usuario) {
      avisoError.querySelector("p").textContent = "El correo o la contraseña no son correctos.";
      avisoError.hidden = false;
      return;
    }
    if (!esAdmin(usuario)) {
      avisoError.querySelector("p").textContent = "Esa cuenta no tiene permisos de administración.";
      avisoError.hidden = false;
      return;
    }
    iniciarSesionDe(usuario.correo);
    window.location.href = "admin-panel.html";
  });
});
