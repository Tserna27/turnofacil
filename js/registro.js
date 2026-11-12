/* Registro de usuarios (prototipo: se guarda en el navegador) */
document.addEventListener("DOMContentLoaded", () => {
  if (obtenerSesion()) { window.location.replace("mis-citas.html"); return; }

  const formulario = document.getElementById("formulario-registro");

  formulario.addEventListener("submit", (e) => {
    e.preventDefault();
    const nombre = formulario.nombre.value.trim().replace(/\s+/g, " ");
    const correo = formulario.correo.value.trim().toLowerCase();
    const clave = formulario.clave.value;
    const clave2 = formulario.clave2.value;

    const errores = [
      ["nombre", nombre.split(" ").length < 2 || nombre.length < 5 ? "Escribe tu nombre completo (nombre y apellido)." : ""],
      ["correo", !correo ? "Escribe tu correo electrónico." : !correoValido(correo) ? "Revisa el correo: debe tener la forma nombre@correo.com." :
        obtenerUsuarios().some((u) => u.correo === correo) ? "Ese correo ya tiene una cuenta. Inicia sesión." : ""],
      ["clave", clave.length < 8 ? "La contraseña debe tener mínimo 8 caracteres." :
        !(/[A-Za-z]/.test(clave) && /\d/.test(clave)) ? "Usa letras y números en la contraseña." : ""],
      ["clave2", !clave2 ? "Confirma tu contraseña." : clave2 !== clave ? "Las contraseñas no coinciden." : ""],
      ["acepto", formulario.acepto.checked ? "" : "Para continuar, acepta la política de privacidad y los términos."]
    ];
    if (!aplicarErrores(errores)) return;

    const usuarios = obtenerUsuarios();
    // Prototipo: la contraseña se guarda tal cual en el navegador. En la versión real se guarda cifrada en el servidor.
    usuarios.push({ nombre, correo, clave, creadoEn: new Date().toISOString() });
    guardarUsuarios(usuarios);
    registrarActividad("Registro", "Creó su cuenta", { nombre, correo });
    window.location.href = "iniciar-sesion.html?registrado=1&correo=" + encodeURIComponent(correo);
  });
});
