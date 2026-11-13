/* Asistente para agendar citas (4 pasos). El usuario elige el día y la hora (manual) o el sistema se los asigna (automática); los usuarios no editan ni cancelan citas. */
document.addEventListener("DOMContentLoaded", () => {
  const usuario = requerirSesion();
  if (!usuario) return;

  const formulario = document.getElementById("formulario-cita");
  const pasos = Array.from(formulario.querySelectorAll(".paso"));
  const marcas = Array.from(document.querySelectorAll("#indicador li"));
  const estado = { paso: 1, servicioId: null, fecha: null, hora: null, modo: "automatico" };
  // Guarda el sorteo para que recargar la página no cambie el día y la hora asignados
  const CLAVE_ASIGNACION = "tf_asignacion_" + usuario.correo;

  /* ---------- Los usuarios no editan citas ---------- */
  // Solo la administración puede cambiar o cancelar una cita, a pedido del usuario por correo.
  if (parametro("editar")) {
    const aviso = document.getElementById("aviso-bloqueo");
    aviso.querySelector("p").innerHTML = textoCambiosPorCorreo() + ' <a href="mis-citas.html">Ir a mis citas</a>.';
    aviso.hidden = false;
    document.getElementById("zona-asistente").hidden = true;
    return;
  }

  /* ---------- Listas fijas ---------- */
  document.getElementById("lista-eps").innerHTML = EPS.map((e) => `<option value="${escaparHtml(e)}"></option>`).join("");
  document.getElementById("grupo").innerHTML = GRUPOS_PRIORITARIOS.map((g) => `<option value="${escaparHtml(g)}">${escaparHtml(g)}</option>`).join("");
  document.getElementById("nacimiento").max = claveFecha(new Date());

  /* ---------- Paso 1: servicios ---------- */
  document.getElementById("opciones-servicio").innerHTML = SERVICIOS.map((s) => `
    <label class="opcion-servicio">
      <input type="radio" name="servicio" value="${s.id}">
      <span class="servicio__icono" aria-hidden="true">${s.icono}</span>
      <span><strong>${escaparHtml(s.nombre)}</strong><small>${escaparHtml(s.descripcion)}</small></span>
    </label>`).join("");

  formulario.addEventListener("change", (e) => {
    if (e.target.name === "servicio") {
      estado.servicioId = e.target.value;
      // Si cambia el servicio, el día y la hora se sortean de nuevo
      estado.fecha = null; estado.hora = null;
      Almacen.guardar(CLAVE_ASIGNACION, null);
      ponerError("grupo-servicio", "");
    }
    // Cambia entre cita automática (la asigna el sistema) y manual (la escoge el usuario)
    if (e.target.name === "modo") {
      estado.modo = e.target.value;
      estado.fecha = null; estado.hora = null;
      Almacen.guardar(CLAVE_ASIGNACION, null);
      ponerError("grupo-asignacion", "");
      document.getElementById("aviso-reasignacion").hidden = true;
      if (estado.paso === 2) { asegurarAsignacion(); pintarAsignacion(); }
    }
    if (e.target.id === "dia-manual") {
      estado.fecha = e.target.value || null; estado.hora = null;
      ponerError("grupo-asignacion", "");
      pintarAsignacion();
    }
    if (e.target.id === "hora-manual") {
      estado.hora = e.target.value || null;
      ponerError("grupo-asignacion", "");
      pintarAsignacion();
    }
  });

  /* ---------- Paso 2: día y hora asignados al azar ---------- */
  const cupoSigueLibre = (fecha, hora) => !!fecha && !!hora &&
    !cupoOcupado(estado.servicioId, fecha, hora) && !usuarioTieneCitaEn(usuario.correo, fecha, hora);

  // Sortea un cupo libre y lo guarda. Devuelve false si no hay ninguno.
  function sortear() {
    const c = asignarCupoAleatorio(estado.servicioId, usuario.correo);
    estado.fecha = c ? c.fecha : null;
    estado.hora = c ? c.hora : null;
    Almacen.guardar(CLAVE_ASIGNACION, c ? { servicioId: estado.servicioId, fecha: c.fecha, hora: c.hora } : null);
    return !!c;
  }

  // Conserva el cupo ya asignado si sigue libre; si no, usa el sorteo guardado o hace uno nuevo.
  function asegurarAsignacion() {
    if (estado.modo === "manual") return cupoSigueLibre(estado.fecha, estado.hora); // en manual no se sortea
    if (cupoSigueLibre(estado.fecha, estado.hora)) return true;
    const g = Almacen.leer(CLAVE_ASIGNACION, null);
    if (g && g.servicioId === estado.servicioId && diasDisponibles().includes(g.fecha) && cupoSigueLibre(g.fecha, g.hora)) {
      estado.fecha = g.fecha; estado.hora = g.hora;
      return true;
    }
    return sortear();
  }

  // Llena las listas de día y hora del modo manual (las horas ocupadas salen desactivadas)
  function pintarOpcionesManual() {
    const selDia = document.getElementById("dia-manual");
    const selHora = document.getElementById("hora-manual");
    selDia.innerHTML = '<option value="">Elige un día</option>' + diasDisponibles().map((f) => {
      const libres = cuposLibres(estado.servicioId, f);
      return `<option value="${f}" ${libres ? "" : "disabled"} ${f === estado.fecha ? "selected" : ""}>${escaparHtml(formatearFecha(f))}${libres ? " · quedan " + libres + " de " + cuposPorDia() + " cupos" : " (sin cupos)"}</option>`;
    }).join("");
    selHora.disabled = !estado.fecha;
    selHora.innerHTML = '<option value="">' + (estado.fecha ? "Elige una hora" : "Primero elige el día") + "</option>" +
      (estado.fecha ? todasLasHoras().map((h) => {
        const ocupada = cupoOcupado(estado.servicioId, estado.fecha, h) || usuarioTieneCitaEn(usuario.correo, estado.fecha, h);
        return `<option value="${h}" ${ocupada ? "disabled" : ""} ${h === estado.hora ? "selected" : ""}>${escaparHtml(formatearRangoHora(h))}${ocupada ? " (ocupada)" : ""}</option>`;
      }).join("") : "");
  }

  function pintarAsignacion(mensaje) {
    const s = buscarServicio(estado.servicioId);
    const manual = estado.modo === "manual";
    document.getElementById("texto-servicio-elegido").textContent = "Servicio elegido: " + s.nombre + ". " + (manual
      ? "Escoge el día y la hora que prefieras entre los cupos libres (de 7:00 a. m. a 3:00 p. m.)."
      : "El sistema te asigna un día y una hora libres de los próximos días hábiles.");

    document.getElementById("zona-manual").hidden = !manual;
    if (manual) pintarOpcionesManual();

    const aviso = document.getElementById("aviso-reasignacion");
    if (mensaje !== undefined) {
      aviso.hidden = !mensaje;
      aviso.querySelector("p").textContent = mensaje || "";
    }

    const tarjeta = document.getElementById("asignacion");
    if (estado.fecha && estado.hora) {
      tarjeta.innerHTML = `
        <p class="campo__ayuda">${manual ? "Elegiste esta cita" : "Tu cita quedó asignada para"}</p>
        <p class="ficho__fecha">${escaparHtml(formatearFecha(estado.fecha))}</p>
        <p class="ficho__hora">${escaparHtml(formatearHora(estado.hora))}</p>
        <p><strong>Consulta de ${DURACION_CONSULTA} minutos</strong> con el médico (${escaparHtml(formatearRangoHora(estado.hora))}).</p>`;
    } else if (manual) {
      tarjeta.innerHTML = `<p class="campo__ayuda">Elige arriba el día y la hora de tu cita.</p>`;
    } else {
      tarjeta.innerHTML = `<p><strong>Por ahora no hay cupos libres para este servicio.</strong></p>
         <p class="campo__ayuda">Intenta de nuevo más tarde.</p>`;
    }

    document.getElementById("detalle-dia").innerHTML =
      `<strong>Lugar:</strong> ${escaparHtml(DIRECCION_ATENCION)}.<br>Atendemos de lunes a viernes, de 7:00 a. m. a 3:00 p. m. Después de confirmar, la cita solo la puede cambiar o cancelar la administración: escribe a <a href="mailto:${escaparHtml(CORREO_ATENCION)}">${escaparHtml(CORREO_ATENCION)}</a>.`;
  }

  /* ---------- Paso 3: datos del paciente ---------- */
  const campos = ["nombres", "apellidos", "nacimiento", "cedula", "eps", "telefono", "direccion", "grupo", "descripcion"];
  const el = (id) => document.getElementById(id);

  function actualizarEdad() {
    const v = el("nacimiento").value;
    el("edad").value = v ? String(calcularEdad(v)) : "";
  }
  el("nacimiento").addEventListener("change", actualizarEdad);
  el("descripcion").addEventListener("input", () => {
    el("contador-descripcion").textContent = el("descripcion").value.length + " / 500";
  });

  function llenarPaciente(p) {
    campos.forEach((c) => { if (p[c] !== undefined) el(c).value = p[c]; });
    if (p.grupoPrioritario) el("grupo").value = p.grupoPrioritario;
    if (p.registradaPor) {
      const r = formulario.querySelector(`input[name="registradaPor"][value="${p.registradaPor}"]`);
      if (r) r.checked = true;
    }
    actualizarEdad();
    el("contador-descripcion").textContent = el("descripcion").value.length + " / 500";
  }

  function validarPaso3() {
    const soloLetras = /^[A-Za-zÁÉÍÓÚáéíóúÑñÜü' -]{2,}$/;
    const nombres = el("nombres").value.trim();
    const apellidos = el("apellidos").value.trim();
    const nac = el("nacimiento").value;
    const cedula = el("cedula").value.trim();
    const eps = el("eps").value.trim();
    const tel = el("telefono").value.replace(/\s+/g, "");
    const dir = el("direccion").value.trim();
    const desc = el("descripcion").value.trim();

    let msjNac = "";
    if (!nac) msjNac = "Escribe la fecha de nacimiento.";
    else {
      const f = fechaDesdeClave(nac);
      if (isNaN(f) || f > new Date()) msjNac = "La fecha de nacimiento no puede ser futura.";
      else if (calcularEdad(nac) > 120) msjNac = "Revisa el año de nacimiento.";
    }

    return aplicarErrores([
      ["nombres", soloLetras.test(nombres) ? "" : "Escribe los nombres del paciente (solo letras)."],
      ["apellidos", soloLetras.test(apellidos) ? "" : "Escribe los apellidos del paciente (solo letras)."],
      ["nacimiento", msjNac],
      ["cedula", /^\d{5,12}$/.test(cedula) ? "" : "Escribe solo números, entre 5 y 12 dígitos."],
      ["eps", eps ? "" : "Escribe o elige la EPS. Si no tiene, elige «Sin afiliación»."],
      ["telefono", /^\d{10}$/.test(tel) ? "" : "Escribe un teléfono de 10 números, por ejemplo 3001234567."],
      ["direccion", dir.length >= 5 ? "" : "Escribe la dirección de residencia."],
      ["descripcion", desc.length >= 10 ? "" : "Cuéntanos en pocas palabras qué siente (mínimo 10 letras)."]
    ]);
  }

  function leerPaciente() {
    const nac = el("nacimiento").value;
    return {
      nombres: el("nombres").value.trim().replace(/\s+/g, " "),
      apellidos: el("apellidos").value.trim().replace(/\s+/g, " "),
      fechaNacimiento: nac,
      edad: calcularEdad(nac),
      cedula: el("cedula").value.trim(),
      eps: el("eps").value.trim(),
      telefono: el("telefono").value.replace(/\s+/g, ""),
      direccion: el("direccion").value.trim(),
      grupoPrioritario: el("grupo").value,
      descripcion: el("descripcion").value.trim()
    };
  }

  /* ---------- Paso 4: resumen ---------- */
  function pintarResumen() {
    const s = buscarServicio(estado.servicioId);
    const p = leerPaciente();
    const quien = formulario.querySelector('input[name="registradaPor"]:checked').value;
    const filas = [
      ["Servicio", s.nombre, 1],
      ["Día", formatearFecha(estado.fecha), 0],
      ["Hora", formatearHora(estado.hora), 0],
      ["Duración de la consulta", DURACION_CONSULTA + " minutos (" + formatearRangoHora(estado.hora) + ")", 0],
      ["Lugar", DIRECCION_ATENCION, 0],
      ["Paciente", p.nombres + " " + p.apellidos, 3],
      ["Cédula", p.cedula, 3],
      ["Nacimiento y edad", formatearFecha(p.fechaNacimiento, true) + " (" + p.edad + " años)", 3],
      ["EPS", p.eps, 3],
      ["Teléfono", p.telefono, 3],
      ["Dirección", p.direccion, 3],
      ["Atención prioritaria", p.grupoPrioritario, 3],
      ["Qué siente", p.descripcion, 3],
      ["Registra la cita", quien, 3]
    ];
    document.getElementById("resumen").innerHTML = filas.map(([t, v, paso]) => `
      <div class="resumen__fila">
        <dt>${t}</dt><dd>${escaparHtml(v)}</dd>
        ${paso ? `<dd><button type="button" class="boton boton--contorno boton--pequeno" data-ir="${paso}">Cambiar<span class="solo-lectores"> ${t.toLowerCase()}</span></button></dd>` : "<dd></dd>"}
      </div>`).join("");
  }

  /* ---------- Navegación entre pasos ---------- */
  function irAPaso(n, sinEnfocar) {
    estado.paso = n;
    if (n === 2) { asegurarAsignacion(); pintarAsignacion(); }
    else document.getElementById("aviso-reasignacion").hidden = true; // el aviso de cupo cambiado solo se ve en el paso 2
    if (n === 4) pintarResumen();
    pasos.forEach((p) => { p.hidden = Number(p.dataset.paso) !== n; });
    marcas.forEach((m, i) => {
      m.classList.toggle("hecho", i + 1 < n);
      if (i + 1 === n) m.setAttribute("aria-current", "step"); else m.removeAttribute("aria-current");
    });
    if (sinEnfocar) return;
    const titulo = document.getElementById("titulo-paso-" + n);
    titulo.scrollIntoView({ behavior: "smooth", block: "start" });
    titulo.focus({ preventScroll: true });
  }

  function validarPaso(n) {
    if (n === 1) {
      return aplicarErrores([["grupo-servicio", estado.servicioId ? "" : "Elige un servicio para continuar."]]);
    }
    if (n === 2 && estado.modo === "manual") {
      if (!estado.fecha || !estado.hora) {
        return aplicarErrores([["grupo-asignacion", "Elige el día y la hora de tu cita para continuar."]]);
      }
      if (!cupoSigueLibre(estado.fecha, estado.hora)) {
        // Otra persona tomó ese cupo mientras tanto
        estado.hora = null;
        pintarAsignacion("Ese cupo ya fue tomado por otra persona. Elige otra hora.");
        return false;
      }
      return aplicarErrores([["grupo-asignacion", ""]]);
    }
    if (n === 2) {
      const antes = estado.fecha + " " + estado.hora;
      if (!asegurarAsignacion()) {
        pintarAsignacion();
        return aplicarErrores([["grupo-asignacion", "Por ahora no hay cupos libres para este servicio. Intenta de nuevo más tarde."]]);
      }
      if (antes !== estado.fecha + " " + estado.hora) {
        // El cupo asignado lo tomó otra persona mientras tanto: se sortea otro y se avisa
        pintarAsignacion("Tu cupo anterior ya fue tomado por otra persona. Te asignamos otro día y hora: revísalo y continúa.");
        return false;
      }
      return aplicarErrores([["grupo-asignacion", ""]]);
    }
    if (n === 3) return validarPaso3();
    return true;
  }

  formulario.addEventListener("click", (e) => {
    const b = e.target.closest("button");
    if (!b) return;
    if (b.hasAttribute("data-siguiente") && validarPaso(estado.paso)) irAPaso(estado.paso + 1);
    else if (b.hasAttribute("data-anterior")) irAPaso(estado.paso - 1);
    else if (b.dataset.ir) irAPaso(Number(b.dataset.ir));
  });

  // Evita que Enter envíe el formulario antes de llegar al último paso
  formulario.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && estado.paso < 4 && e.target.tagName !== "TEXTAREA" && e.target.tagName !== "BUTTON") {
      e.preventDefault();
      if (validarPaso(estado.paso)) irAPaso(estado.paso + 1);
    }
  });

  /* ---------- Confirmar ---------- */
  formulario.addEventListener("submit", (e) => {
    e.preventDefault();
    if (estado.paso !== 4) return;
    if (!aplicarErrores([["acepto-datos", el("acepto-datos").checked ? "" : "Para confirmar, autoriza el uso de los datos."]])) return;
    if (!validarPaso(1) || !validarPaso(2)) { irAPaso(2); return; }

    const paciente = leerPaciente();
    const registradaPor = formulario.querySelector('input[name="registradaPor"]:checked').value;
    const servicio = buscarServicio(estado.servicioId);
    const citas = obtenerCitas();
    const id = generarCodigo();

    citas.push({
      id, correoUsuario: usuario.correo, servicioId: servicio.id, servicioNombre: servicio.nombre,
      fecha: estado.fecha, hora: estado.hora, duracionMinutos: DURACION_CONSULTA,
      estado: "Programada", paciente, registradaPor, creadaEn: new Date().toISOString()
    });
    guardarCitas(citas);
    registrarActividad("Cita agendada", `${id} · ${servicio.nombre}, ${estado.fecha} ${estado.hora}`);
    Almacen.guardar(CLAVE_ASIGNACION, null); // el sorteo ya se usó

    // Se recuerdan los datos del paciente para la próxima vez (solo en este navegador)
    const recordar = Object.assign({}, paciente); delete recordar.descripcion;
    Almacen.guardar("tf_paciente_" + usuario.correo, recordar);

    window.location.href = "comprobante.html?id=" + encodeURIComponent(id) + "&nueva=1";
  });

  /* ---------- Arranque ---------- */
  const recordado = Almacen.leer("tf_paciente_" + usuario.correo, null);
  if (recordado) llenarPaciente(Object.assign({}, recordado, { nacimiento: recordado.fechaNacimiento }));
  const previo = parametro("servicio");
  if (previo && buscarServicio(previo)) {
    estado.servicioId = previo;
    formulario.querySelector(`input[name="servicio"][value="${previo}"]`).checked = true;
    irAPaso(2, true);
  } else {
    irAPaso(1, true);
  }
  window.scrollTo(0, 0);
});
