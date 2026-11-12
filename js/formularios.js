/* Ayudas compartidas para formularios: errores en pantalla y botón "Mostrar contraseña" */

function ponerError(idCampo, mensaje) {
  const campo = document.getElementById(idCampo);
  const error = document.getElementById("error-" + idCampo);
  if (error) error.textContent = mensaje || "";
  if (campo) {
    if (mensaje) campo.setAttribute("aria-invalid", "true");
    else campo.removeAttribute("aria-invalid");
  }
  return !mensaje;
}

// Recibe una lista [idCampo, mensaje|""] y enfoca el primer campo con error
function aplicarErrores(lista) {
  let primero = null;
  lista.forEach(([id, mensaje]) => {
    ponerError(id, mensaje);
    if (mensaje && !primero) primero = id;
  });
  if (primero) {
    const el = document.getElementById(primero);
    if (el) el.focus();
  }
  return !primero;
}

function correoValido(texto) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(texto); }

// Al corregir un campo con error, el mensaje se quita solo
["input", "change"].forEach((evento) => document.addEventListener(evento, (e) => {
  const campo = e.target;
  if (campo && campo.id && campo.getAttribute && campo.getAttribute("aria-invalid") === "true") ponerError(campo.id, "");
}));

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll("[data-ver-clave]").forEach((boton) => {
    boton.addEventListener("click", () => {
      const campo = document.getElementById(boton.getAttribute("data-ver-clave"));
      const mostrar = campo.type === "password";
      campo.type = mostrar ? "text" : "password";
      boton.textContent = mostrar ? "Ocultar" : "Mostrar";
      boton.setAttribute("aria-pressed", String(mostrar));
    });
  });
});
