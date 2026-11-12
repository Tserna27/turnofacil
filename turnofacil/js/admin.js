/* Panel de administración: encabezado, menú y ayudas compartidas */

const MENU_ADMIN = [
  ["admin-panel.html", "Resumen"],
  ["admin-citas.html", "Citas"],
  ["admin-reportes.html", "Reportes"],
  ["admin-usuarios.html", "Usuarios"],
  ["admin-actividad.html", "Actividad"],
  ["admin-blog.html", "Blog"],
  ["admin-mensajes.html", "Mensajes"]
];

function pintarPanelAdmin() {
  const cabecera = document.getElementById("encabezado-admin");
  const menu = document.getElementById("admin-nav");
  const pagina = location.pathname.split("/").pop();
  if (cabecera) {
    cabecera.innerHTML = `
      <div class="contenedor admin-encabezado-fila">
        <div class="admin-marca">
          <a class="marca" href="admin-panel.html" aria-label="TurnoFácil Quibdó, ir al resumen">
            <img src="img/logo-96.png" alt="" width="44" height="42">
            <span class="marca__nombre">TurnoFácil<span class="marca__ciudad">Quibdó</span></span>
          </a>
          <span class="etiqueta-admin">Administración</span>
        </div>
        <div class="admin-acciones">
          <a href="index.html">Ver sitio</a>
          <button type="button" id="boton-salir-admin">Cerrar sesión</button>
        </div>
      </div>`;
    document.getElementById("boton-salir-admin").addEventListener("click", cerrarSesion);
  }
  if (menu) {
    menu.innerHTML = MENU_ADMIN.map(([href, texto]) =>
      `<a href="${href}" ${pagina === href ? 'aria-current="page"' : ""}>${texto}</a>`).join("");
  }
}

function descargarCsv(nombreArchivo, cabecera, filas) {
  const celda = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  // Punto y coma y BOM para que Excel en español abra bien las tildes y las columnas
  const texto = "﻿" + [cabecera, ...filas].map((f) => f.map(celda).join(";")).join("\r\n");
  const enlace = document.createElement("a");
  enlace.href = URL.createObjectURL(new Blob([texto], { type: "text/csv;charset=utf-8" }));
  enlace.download = nombreArchivo;
  document.body.appendChild(enlace);
  enlace.click();
  enlace.remove();
  setTimeout(() => URL.revokeObjectURL(enlace.href), 1000);
  mostrarAviso("Descargamos el archivo.");
}

function estadoVacio(titulo, texto) {
  return `<div class="estado-vacio"><h2 style="font-size:1.3rem">${escaparHtml(titulo)}</h2><p>${escaparHtml(texto)}</p></div>`;
}

function barrasHtml(titulo, conteos, total) {
  const filas = Object.entries(conteos).sort((a, b) => b[1] - a[1]);
  return `
    <div class="tarjeta">
      <h2 style="font-size:1.2rem">${escaparHtml(titulo)}</h2>
      <div class="barras">
        ${filas.map(([nombre, n]) => `
          <div>
            <div class="barra__etiqueta"><span>${escaparHtml(nombre)}</span><span>${n}</span></div>
            <div class="barra__pista" aria-hidden="true"><div class="barra__relleno" style="width:${Math.round((n / total) * 100)}%"></div></div>
          </div>`).join("")}
      </div>
    </div>`;
}

document.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("encabezado-admin")) {
    if (!requerirAdmin()) return;
    pintarPanelAdmin();
  }
});
