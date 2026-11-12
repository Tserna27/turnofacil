/* Vista visual de las citas de todos los usuarios: calendario semanal (lunes a viernes) y lista.
   Solo la administración puede cambiar el día y la hora de una cita o cancelarla (el usuario lo pide por correo). */
document.addEventListener("DOMContentLoaded", () => {
  if (!requerirAdmin()) return;

  const zona = document.getElementById("vista-citas");
  const selEstado = document.getElementById("filtro-estado");
  const selServicio = document.getElementById("filtro-servicio");
  const busqueda = document.getElementById("busqueda");
  let vista = "semana";
  const mayuscula = (t) => t.charAt(0).toUpperCase() + t.slice(1);

  selServicio.innerHTML += SERVICIOS.map((s) => `<option value="${s.id}">${escaparHtml(s.nombre)}</option>`).join("");

  // Lunes de la semana que se muestra (en fin de semana se muestra la siguiente)
  function lunesInicial() {
    const d = new Date(); d.setHours(0, 0, 0, 0);
    const dia = d.getDay();
    d.setDate(d.getDate() + (dia === 0 ? 1 : dia === 6 ? 2 : 1 - dia));
    return d;
  }
  let lunes = lunesInicial();

  function citasFiltradas() {
    const t = quitarTildes(busqueda.value).trim();
    return obtenerCitas()
      .filter((c) => !selEstado.value || c.estado === selEstado.value)
      .filter((c) => !selServicio.value || c.servicioId === selServicio.value)
      .filter((c) => !t || quitarTildes([c.id, c.paciente.nombres, c.paciente.apellidos, c.paciente.cedula, c.correoUsuario].join(" ")).includes(t))
      .sort((a, b) => (a.fecha + a.hora).localeCompare(b.fecha + b.hora));
  }

  function pintarSemana(citas) {
    const dias = [0, 1, 2, 3, 4].map((i) => { const d = new Date(lunes); d.setDate(d.getDate() + i); return d; });
    const hoy = claveFecha(new Date());
    const nombreDia = new Intl.DateTimeFormat("es-CO", { weekday: "long", day: "numeric", month: "short" });
    const columnas = dias.map((d) => {
      const clave = claveFecha(d);
      const delDia = citas.filter((c) => c.fecha === clave);
      const festivo = FESTIVOS.includes(clave);
      return `
        <section class="semana__dia ${clave === hoy ? "semana__dia--hoy" : ""}" aria-label="${escaparHtml(nombreDia.format(d))}">
          <h3>${escaparHtml(mayuscula(nombreDia.format(d).replace(".", "")))}</h3>
          <p class="semana__total">${festivo ? "Festivo: sin atención" : delDia.length ? delDia.length + (delDia.length === 1 ? " cita" : " citas") : "Sin citas"}</p>
          ${delDia.map((c) => `
            <button type="button" class="semana__cita ${c.estado === "Cancelada" ? "semana__cita--cancelada" : ""}" data-ver="${escaparHtml(c.id)}">
              <span class="semana__hora">${escaparHtml(formatearHora(c.hora))}${c.estado === "Cancelada" ? '<span class="solo-lectores"> (cancelada)</span>' : ""}</span>
              <span>${escaparHtml(c.paciente.nombres + " " + c.paciente.apellidos)}</span>
              <span>${escaparHtml(c.servicioNombre)}</span>
            </button>`).join("")}
        </section>`;
    }).join("");

    const viernes = dias[4];
    zona.innerHTML = `
      <div class="navegar-semana">
        <strong>Semana del ${escaparHtml(formatearFecha(claveFecha(dias[0]), true))} al ${escaparHtml(formatearFecha(claveFecha(viernes), true))}</strong>
        <button type="button" class="boton boton--contorno boton--pequeno" data-semana="-1">Semana anterior</button>
        <button type="button" class="boton boton--contorno boton--pequeno" data-semana="0">Esta semana</button>
        <button type="button" class="boton boton--contorno boton--pequeno" data-semana="1">Semana siguiente</button>
      </div>
      <div class="semana">${columnas}</div>`;
  }

  function pintarLista(citas) {
    if (!citas.length) {
      zona.innerHTML = estadoVacio("No hay citas para mostrar", "Cambia los filtros o espera a que los usuarios agenden.");
      return;
    }
    zona.innerHTML = `
      <p class="campo__ayuda">${citas.length} ${citas.length === 1 ? "cita" : "citas"} con estos filtros.</p>
      <div class="rejilla rejilla--2">
        ${citas.map((c) => `
          <div>
            ${construirFicho(c)}
            <div class="cita-acciones">
              <button type="button" class="boton boton--contorno boton--pequeno" data-ver="${escaparHtml(c.id)}">Ver detalle</button>
              <span class="campo__ayuda" style="align-self:center">Cuenta: ${escaparHtml(c.correoUsuario)}</span>
            </div>
          </div>`).join("")}
      </div>`;
  }

  function pintar() {
    const citas = citasFiltradas();
    if (vista === "semana") pintarSemana(citas); else pintarLista(citas);
  }

  function filasDetalle(c) {
    const p = c.paciente;
    const filas = [
      ["Código", c.id], ["Estado", c.estado], ["Servicio", c.servicioNombre],
      ["Día", formatearFecha(c.fecha)], ["Hora", formatearHora(c.hora)],
      ["Duración de la consulta", DURACION_CONSULTA + " minutos (" + formatearRangoHora(c.hora) + ")"], ["Lugar", DIRECCION_ATENCION],
      ["Paciente", p.nombres + " " + p.apellidos], ["Cédula", p.cedula],
      ["Nacimiento y edad", formatearFecha(p.fechaNacimiento, true) + " (" + p.edad + " años)"],
      ["EPS", p.eps], ["Teléfono", p.telefono], ["Dirección", p.direccion],
      ["Atención prioritaria", p.grupoPrioritario], ["Qué siente", p.descripcion],
      ["Registrada por", c.registradaPor], ["Cuenta del usuario", c.correoUsuario],
      ["Fecha de registro", formatearFechaHoraIso(c.creadaEn)]
    ];
    if (c.modificadaEn) filas.push(["Última modificación", formatearFechaHoraIso(c.modificadaEn)]);
    if (c.canceladaEn) filas.push(["Cancelada el", formatearFechaHoraIso(c.canceladaEn)]);
    return filas;
  }

  function abrirDetalle(id) {
    const c = obtenerCitas().find((x) => x.id === id);
    if (!c) return;
    const puedeCancelar = c.estado === "Programada" && !citaPasada(c);
    const dialogo = document.createElement("dialog");
    dialogo.className = "dialogo-ancho";
    dialogo.setAttribute("aria-labelledby", "titulo-detalle");
    dialogo.innerHTML = `
      <h2 id="titulo-detalle">Cita ${escaparHtml(c.id)}</h2>
      <dl class="resumen">
        ${filasDetalle(c).map(([t, v]) => `<div class="resumen__fila"><dt>${escaparHtml(t)}</dt><dd>${escaparHtml(v)}</dd></div>`).join("")}
      </dl>
      <div class="grupo-botones">
        ${puedeCancelar ? '<button type="button" class="boton boton--contorno" data-accion="editar">Cambiar día y hora</button>' : ""}
        ${puedeCancelar ? '<button type="button" class="boton boton--peligro" data-accion="cancelar">Cancelar cita</button>' : ""}
        <button type="button" class="boton boton--primario" data-accion="cerrar">Cerrar</button>
      </div>`;
    document.body.appendChild(dialogo);
    const cerrar = () => { dialogo.close(); dialogo.remove(); };
    dialogo.addEventListener("click", async (e) => {
      const accion = e.target.getAttribute && e.target.getAttribute("data-accion");
      if (accion === "cerrar") cerrar();
      if (accion === "editar") { cerrar(); abrirEdicion(c.id); }
      if (accion === "cancelar") {
        cerrar();
        const si = await confirmarAccion({
          titulo: "¿Cancelar esta cita?",
          mensaje: `Se cancelará la cita ${c.id} de ${c.paciente.nombres} ${c.paciente.apellidos} (${formatearFecha(c.fecha, true)}, ${formatearHora(c.hora)}). El cupo quedará libre.`,
          textoAceptar: "Sí, cancelar cita", textoCancelar: "No, mantenerla", peligro: true
        });
        if (si) { cancelarCitaPorId(c.id); mostrarAviso("La cita " + c.id + " quedó cancelada."); pintar(); }
      }
    });
    dialogo.addEventListener("cancel", (e) => { e.preventDefault(); cerrar(); });
    dialogo.showModal();
  }

  // Cambio de día y hora hecho por la administración (el usuario lo pidió por correo)
  function abrirEdicion(id) {
    const c = obtenerCitas().find((x) => x.id === id);
    if (!c) return;
    const dias = diasDisponibles();
    if (!dias.includes(c.fecha) && fechaDesdeClave(c.fecha) > new Date()) dias.unshift(c.fecha);

    const dialogo = document.createElement("dialog");
    dialogo.className = "dialogo-ancho";
    dialogo.setAttribute("aria-labelledby", "titulo-edicion");
    dialogo.innerHTML = `
      <h2 id="titulo-edicion">Cambiar día y hora de la cita ${escaparHtml(c.id)}</h2>
      <p class="campo__ayuda">${escaparHtml(c.paciente.nombres + " " + c.paciente.apellidos)} · ${escaparHtml(c.servicioNombre)}.
        Ahora: ${escaparHtml(formatearFecha(c.fecha, true))}, ${escaparHtml(formatearRangoHora(c.hora))}.
        Hazlo solo si el usuario lo pidió por correo. Cada consulta dura ${DURACION_CONSULTA} minutos.</p>
      <div class="dos-campos">
        <div class="campo"><label for="ed-fecha">Día</label>
          <select id="ed-fecha">${dias.map((d) => `<option value="${d}" ${d === c.fecha ? "selected" : ""}>${escaparHtml(mayuscula(formatearFecha(d)))}</option>`).join("")}</select></div>
        <div class="campo"><label for="ed-hora">Hora</label>
          <select id="ed-hora" aria-describedby="error-ed-hora"></select>
          <p class="campo__error" id="error-ed-hora"></p></div>
      </div>
      <div class="grupo-botones">
        <button type="button" class="boton boton--contorno" data-accion="volver">Volver</button>
        <button type="button" class="boton boton--primario" data-accion="guardar">Guardar cambio</button>
      </div>`;
    document.body.appendChild(dialogo);
    const selFecha = dialogo.querySelector("#ed-fecha");
    const selHora = dialogo.querySelector("#ed-hora");

    // Las horas ocupadas (por otra persona o por el mismo usuario) aparecen desactivadas
    function llenarHoras() {
      const fecha = selFecha.value;
      selHora.innerHTML = todasLasHoras().map((h) => {
        const ocupada = cupoOcupado(c.servicioId, fecha, h, c.id) || usuarioTieneCitaEn(c.correoUsuario, fecha, h, c.id);
        const marcada = fecha === c.fecha && h === c.hora ? "selected" : "";
        return `<option value="${h}" ${ocupada ? "disabled" : ""} ${marcada}>${escaparHtml(formatearRangoHora(h))}${ocupada ? " (ocupada)" : ""}</option>`;
      }).join("");
      if (selHora.selectedOptions.length && selHora.selectedOptions[0].disabled) selHora.selectedIndex = -1;
      ponerError("ed-hora", "");
    }
    llenarHoras();
    selFecha.addEventListener("change", llenarHoras);

    const cerrar = () => { dialogo.close(); dialogo.remove(); };
    dialogo.addEventListener("click", (e) => {
      const accion = e.target.getAttribute && e.target.getAttribute("data-accion");
      if (accion === "volver") { cerrar(); abrirDetalle(c.id); }
      if (accion === "guardar") {
        const fecha = selFecha.value, hora = selHora.value;
        if (!hora) { ponerError("ed-hora", "Elige una hora libre."); selHora.focus(); return; }
        if (fecha === c.fecha && hora === c.hora) { ponerError("ed-hora", "Elige un día u hora distintos a los actuales."); selHora.focus(); return; }
        const citas = obtenerCitas();
        const cita = citas.find((x) => x.id === c.id);
        if (!cita) return;
        const antes = `${cita.fecha} ${cita.hora}`;
        cita.fecha = fecha; cita.hora = hora;
        cita.modificadaEn = new Date().toISOString();
        cita.modificadaPor = "Administración";
        guardarCitas(citas);
        registrarActividad("Cita editada por administración", `${cita.id} · ${antes} → ${fecha} ${hora}`);
        cerrar();
        mostrarAviso("La cita " + cita.id + " cambió a " + formatearFecha(fecha, true) + ", " + formatearHora(hora) + ".");
        pintar();
      }
    });
    dialogo.addEventListener("cancel", (e) => { e.preventDefault(); cerrar(); });
    dialogo.showModal();
  }

  zona.addEventListener("click", (e) => {
    const ver = e.target.closest("[data-ver]");
    if (ver) { abrirDetalle(ver.dataset.ver); return; }
    const sem = e.target.closest("[data-semana]");
    if (sem) {
      const n = Number(sem.dataset.semana);
      if (n === 0) lunes = lunesInicial(); else lunes.setDate(lunes.getDate() + 7 * n);
      pintar();
    }
  });

  document.querySelectorAll("[data-vista]").forEach((b) => b.addEventListener("click", () => {
    vista = b.dataset.vista;
    document.querySelectorAll("[data-vista]").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
    pintar();
  }));
  [selEstado, selServicio].forEach((s) => s.addEventListener("change", pintar));
  busqueda.addEventListener("input", pintar);

  pintar();
});
