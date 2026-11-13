/* ==========================================================
   TurnoFácil Quibdó — funciones comunes
   Prototipo: la información se guarda en el navegador
   (localStorage) y los servicios son datos de ejemplo.
   ========================================================== */

/* ---------- Datos que se pueden cambiar fácilmente ---------- */

// La dirección es una sola: no se elige lugar al agendar.
const DIRECCION_ATENCION = "Hospital Local Ismael Roldán Valencia, Quibdó, Chocó";

const SERVICIOS = [
  {
    id: "medicina-general", nombre: "Medicina general", icono: "🩺",
    descripcion: "Consulta para valorar tu estado de salud y orientarte con el tratamiento o la remisión que necesites.",
    sirvePara: ["Fiebre, gripa o dolor de cuerpo", "Dolor de cabeza o de estómago", "Controles y fórmulas médicas"],
    palabras: ["fiebre", "gripa", "dolor", "cabeza", "estomago", "tos", "control", "general", "malestar", "mareo", "formula"]
  },
  {
    id: "control-prenatal", nombre: "Control prenatal", icono: "🤰",
    descripcion: "Seguimiento del embarazo para cuidar tu salud y la de tu bebé.",
    sirvePara: ["Estás embarazada y necesitas tu control", "Dudas sobre tu embarazo", "Revisión de exámenes del embarazo"],
    palabras: ["embarazo", "embarazada", "gestante", "prenatal", "bebe", "gestacion"]
  },
  {
    id: "crecimiento-desarrollo", nombre: "Crecimiento y desarrollo", icono: "👶",
    descripcion: "Control de peso, talla y desarrollo de niñas y niños.",
    sirvePara: ["Control de tu hijo o hija", "Dudas sobre su alimentación", "Revisión de su carné de vacunas"],
    palabras: ["nino", "nina", "hijo", "hija", "bebe", "peso", "talla", "crecimiento", "pediatria", "desarrollo"]
  },
  {
    id: "vacunacion", nombre: "Vacunación", icono: "💉",
    descripcion: "Aplicación de vacunas del esquema para niños, gestantes y adultos.",
    sirvePara: ["Completar el esquema de vacunas", "Vacunas durante el embarazo", "Vacunas para adultos mayores"],
    palabras: ["vacuna", "vacunas", "esquema", "refuerzo", "inmunizacion"]
  },
  {
    id: "odontologia", nombre: "Odontología", icono: "🦷",
    descripcion: "Revisión y atención de la boca y los dientes.",
    sirvePara: ["Dolor de muela", "Limpieza y revisión", "Caries o encías inflamadas"],
    palabras: ["muela", "diente", "dientes", "boca", "caries", "encia", "odontologia", "limpieza"]
  },
  {
    id: "control-cronicos", nombre: "Control de hipertensión y diabetes", icono: "❤️",
    descripcion: "Seguimiento periódico para personas con presión alta o azúcar alta.",
    sirvePara: ["Control de la presión o del azúcar", "Renovar tus medicamentos de control", "Adultos mayores con enfermedades crónicas"],
    palabras: ["presion", "tension", "hipertension", "diabetes", "azucar", "cronico", "adulto", "mayor", "corazon"]
  }
];

const GRUPOS_PRIORITARIOS = ["Ninguno", "Adulto mayor", "Gestante", "Madre o padre con niño"];

const EPS = ["Nueva EPS", "Coosalud", "Asmet Salud", "Emssanar", "Mutual Ser", "Sanitas", "Salud Total", "Sura", "Famisanar", "Savia Salud", "Sin afiliación"];

// Cada cita es una consulta de 15 minutos con el médico.
const DURACION_CONSULTA = 15;

// Genera las horas de inicio de cada consulta entre dos horas (ambas incluidas)
function generarFranjas(primera, ultima) {
  const aMinutos = (t) => { const [h, m] = t.split(":").map(Number); return h * 60 + m; };
  const horas = [];
  for (let min = aMinutos(primera); min <= aMinutos(ultima); min += DURACION_CONSULTA) {
    horas.push(String(Math.floor(min / 60)).padStart(2, "0") + ":" + String(min % 60).padStart(2, "0"));
  }
  return horas;
}

// Horario de atención: de 6:00 a. m. a 4:00 p. m. (última cita a las 3:45 p. m.)
const HORA_APERTURA = "06:00";
const HORA_ULTIMA_CONSULTA = "15:45";
const HORAS_MANANA = generarFranjas(HORA_APERTURA, HORA_ULTIMA_CONSULTA);
const HORAS_TARDE = [];
const TEXTO_HORARIO = "de " + formatearHora(HORA_APERTURA) + " a " + formatearHora(horaFinConsulta(HORA_ULTIMA_CONSULTA));
// Médicos que atienden al mismo tiempo: cada franja de 15 minutos tiene este número de cupos.
// Con 40 franjas al día: 1 médico = 40 cupos, 2 = 80 cupos, 3 = 120 cupos por servicio y día.
const MEDICOS_POR_FRANJA = 2;

/* ---------- Almacenamiento en el navegador ---------- */

const memoria = {}; // respaldo si el navegador bloquea localStorage

const Almacen = {
  leer(clave, porDefecto) {
    try {
      const texto = localStorage.getItem(clave);
      return texto ? JSON.parse(texto) : porDefecto;
    } catch (e) {
      return clave in memoria ? memoria[clave] : porDefecto;
    }
  },
  guardar(clave, valor) {
    try { localStorage.setItem(clave, JSON.stringify(valor)); return true; }
    catch (e) { memoria[clave] = valor; return false; }
  },
  // Lanza un error si no hay espacio (se usa al subir imágenes del blog)
  guardarSeguro(clave, valor) { localStorage.setItem(clave, JSON.stringify(valor)); }
};

const obtenerUsuarios = () => Almacen.leer("tf_usuarios", []);
const guardarUsuarios = (lista) => Almacen.guardar("tf_usuarios", lista);
const obtenerCitas = () => Almacen.leer("tf_citas", []);
const guardarCitas = (lista) => Almacen.guardar("tf_citas", lista);

/* ---------- Administrador (cuenta de demostración) ---------- */
// Entra por admin-ingreso.html. Cambia estos datos si quieres otra cuenta.
const ADMIN_CORREO = "admin@turnofacil.com";
const ADMIN_CLAVE_DEMO = "Admin12345";

// Correo al que los usuarios piden cambiar o cancelar una cita.
// Solo la administración puede editar o cancelar citas. Cambia este correo por el real.
const CORREO_ATENCION = ADMIN_CORREO;

(function asegurarAdministrador() {
  const usuarios = obtenerUsuarios();
  if (!usuarios.some((u) => u.correo === ADMIN_CORREO)) {
    usuarios.push({ nombre: "Administrador TurnoFácil", correo: ADMIN_CORREO, clave: ADMIN_CLAVE_DEMO, rol: "admin", creadoEn: new Date().toISOString() });
    guardarUsuarios(usuarios);
  }
})();

const esAdmin = (u) => !!u && u.rol === "admin";

/* ---------- Registro de actividad (lo consulta el administrador) ---------- */
const obtenerActividad = () => Almacen.leer("tf_actividad", []);
function registrarActividad(tipo, detalle, quien) {
  const u = quien || obtenerSesion();
  const lista = obtenerActividad();
  lista.push({
    fecha: new Date().toISOString(), tipo, detalle: detalle || "",
    nombre: u ? u.nombre : "Visitante", correo: u ? u.correo : "", rol: u && u.rol === "admin" ? "Administrador" : "Usuario"
  });
  Almacen.guardar("tf_actividad", lista.slice(-500)); // se conservan las últimas 500
}

/* ---------- Entradas del blog (las crea el administrador) ---------- */
const ENTRADAS_INICIALES = [
  {
    id: "preparar-cita", titulo: "Cómo prepararte para tu cita médica", fecha: "2026-11-04T08:00:00",
    resumen: "Unos minutos de preparación hacen que la consulta rinda más.",
    contenido: "Antes de ir, anota qué sientes, desde cuándo y qué lo mejora o lo empeora. Así no se te olvida nada frente al médico.\n\nLleva tu documento de identidad, el soporte de tu EPS y los exámenes o fórmulas anteriores, si los tienes.\n\nHaz una lista de los medicamentos que tomas, incluso los que compras sin fórmula, y escribe tus preguntas.\n\nSi tienes que ir acompañado, avisa a esa persona con tiempo. Un familiar también puede ayudarte a agendar."
  },
  {
    id: "hidratacion", titulo: "Hidratación con calor y humedad", fecha: "2026-11-03T08:00:00",
    resumen: "En el clima del Chocó se pierde mucho líquido sin darnos cuenta.",
    contenido: "Toma agua a lo largo del día, sin esperar a tener sed. Las niñas, los niños y los adultos mayores necesitan más atención, porque sienten menos la sed o no pueden pedir agua.\n\nAlgunas señales de deshidratación son la boca seca, la orina muy oscura, el mareo y el cansancio fuera de lo normal.\n\nSi hay vómito o diarrea que no se detiene, o una persona está muy decaída, consulta cuanto antes con un profesional de la salud."
  },
  {
    id: "control-prenatal", titulo: "Control prenatal: por qué no faltar", fecha: "2026-11-02T08:00:00",
    resumen: "Los controles ayudan a cuidar a la mamá y al bebé durante todo el embarazo.",
    contenido: "Con los controles, el personal de salud revisa cómo va el embarazo y puede detectar a tiempo cualquier problema.\n\nAsiste a las citas que te indiquen y lleva tu carné materno. Si no puedes ir, cambia la fecha en lugar de dejarla pasar.\n\nSi tienes sangrado, dolor fuerte, fiebre, hinchazón repentina de cara o manos, o notas que el bebé se mueve menos, no esperes tu cita: acude a urgencias."
  },
  {
    id: "lavado-manos", titulo: "Lavado de manos: el hábito más simple", fecha: "2026-11-01T08:00:00",
    resumen: "Lavarse bien las manos ayuda a prevenir muchas enfermedades.",
    contenido: "Lávate con agua y jabón durante al menos 20 segundos, frotando palmas, dorso, entre los dedos y las uñas.\n\nHazlo antes de comer o preparar alimentos, después de ir al baño y después de cuidar a una persona enferma.\n\nSi no tienes agua y jabón a la mano, puedes usar gel antibacterial con alcohol mientras llegas a un lugar donde lavarte."
  }
].map((e) => Object.assign({ publicada: true, imagen: "", altImagen: "", autor: "Equipo TurnoFácil" }, e));

function obtenerEntradas() {
  let lista = Almacen.leer("tf_entradas", null);
  if (!lista) {
    lista = ENTRADAS_INICIALES.map((e) => Object.assign({}, e));
    Almacen.guardar("tf_entradas", lista);
  }
  return lista;
}
function minutosDeLectura(texto) {
  return Math.max(1, Math.ceil(String(texto).trim().split(/\s+/).length / 180));
}

/* ---------- Sesión ---------- */
function obtenerSesion() {
  const correo = Almacen.leer("tf_sesion", null);
  if (!correo) return null;
  return obtenerUsuarios().find((u) => u.correo === correo) || null;
}
function iniciarSesionDe(correo) {
  Almacen.guardar("tf_sesion", correo);
  const usuarios = obtenerUsuarios();
  const u = usuarios.find((x) => x.correo === correo);
  if (u) { u.ultimoIngreso = new Date().toISOString(); u.ingresos = (u.ingresos || 0) + 1; guardarUsuarios(usuarios); registrarActividad("Inicio de sesión", "", u); }
}
function cerrarSesion() {
  const u = obtenerSesion();
  if (u) registrarActividad("Cierre de sesión", "", u);
  Almacen.guardar("tf_sesion", null);
  window.location.href = esAdmin(u) ? "admin-ingreso.html" : "index.html";
}
// Páginas del usuario: si no hay sesión pide iniciar; el administrador va a su panel
function requerirSesion() {
  const usuario = obtenerSesion();
  if (!usuario) {
    const volver = location.pathname.split("/").pop() + location.search;
    window.location.replace("iniciar-sesion.html?volver=" + encodeURIComponent(volver));
    return null;
  }
  if (esAdmin(usuario)) { window.location.replace("admin-panel.html"); return null; }
  return usuario;
}
// Páginas del administrador
function requerirAdmin() {
  const usuario = obtenerSesion();
  if (!usuario) { window.location.replace("admin-ingreso.html"); return null; }
  if (!esAdmin(usuario)) { window.location.replace("admin-ingreso.html?sinpermiso=1"); return null; }
  return usuario;
}

/* ---------- Utilidades ---------- */

function escaparHtml(texto) {
  return String(texto ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
function quitarTildes(texto) {
  return String(texto).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}
function parametro(nombre) { return new URLSearchParams(location.search).get(nombre); }

function claveFecha(fecha) {
  const m = String(fecha.getMonth() + 1).padStart(2, "0");
  const d = String(fecha.getDate()).padStart(2, "0");
  return `${fecha.getFullYear()}-${m}-${d}`;
}
function fechaDesdeClave(clave) {
  const [a, m, d] = clave.split("-").map(Number);
  return new Date(a, m - 1, d);
}
function formatearFecha(clave, corto) {
  const f = fechaDesdeClave(clave);
  return new Intl.DateTimeFormat("es-CO", corto
    ? { day: "numeric", month: "short", year: "numeric" }
    : { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(f);
}
function formatearHora(hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  const sufijo = h >= 12 ? "p. m." : "a. m.";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${sufijo}`;
}
// Hora en que termina una consulta que empieza a la hora dada (ej. "07:30" -> "07:45")
function horaFinConsulta(hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  const total = h * 60 + m + DURACION_CONSULTA;
  return String(Math.floor(total / 60)).padStart(2, "0") + ":" + String(total % 60).padStart(2, "0");
}
// "7:30 a. m. a 7:45 a. m."
function formatearRangoHora(hhmm) {
  return formatearHora(hhmm) + " a " + formatearHora(horaFinConsulta(hhmm));
}
function formatearFechaHoraIso(iso) {
  return new Intl.DateTimeFormat("es-CO", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(iso));
}
function calcularEdad(claveNacimiento) {
  const n = fechaDesdeClave(claveNacimiento);
  const hoy = new Date();
  let edad = hoy.getFullYear() - n.getFullYear();
  const aunNoCumple = hoy.getMonth() < n.getMonth() || (hoy.getMonth() === n.getMonth() && hoy.getDate() < n.getDate());
  if (aunNoCumple) edad--;
  return edad;
}
function nombreCorto(nombreCompleto) {
  const partes = String(nombreCompleto).trim().split(/\s+/);
  return partes.length > 1 ? `${partes[0]} ${partes[partes.length - 1][0]}.` : partes[0];
}
function buscarServicio(id) { return SERVICIOS.find((s) => s.id === id); }

/* ---------- Cupos (datos de ejemplo; atención de lunes a viernes, consultas de 15 minutos) ---------- */

function semilla(texto) {
  let h = 7;
  for (let i = 0; i < texto.length; i++) h = (h * 31 + texto.charCodeAt(i)) % 100003;
  return h;
}
function esDiaHabil(fecha) {
  const d = fecha.getDay();
  return d !== 0 && d !== 6 && !FESTIVOS.includes(claveFecha(fecha));
}
function diasDisponibles() {
  const dias = [];
  const f = new Date();
  f.setHours(0, 0, 0, 0);
  while (dias.length < DIAS_VISIBLES) {
    f.setDate(f.getDate() + 1);
    if (esDiaHabil(f)) dias.push(claveFecha(f));
  }
  return dias;
}
function todasLasHoras() { return HORAS_MANANA.concat(HORAS_TARDE); }

// Cupos ya tomados en una franja: por otras personas (simulado) o por citas programadas de este navegador.
function cuposTomadosEnFranja(servicioId, fecha, hora, ignorarId) {
  let tomados = 0;
  for (let i = 0; i < MEDICOS_POR_FRANJA; i++) {
    if (semilla(i + servicioId + fecha + hora) % 100 < 30) tomados++;
  }
  return tomados + obtenerCitas().filter((c) => c.estado === "Programada" && c.id !== ignorarId &&
    c.servicioId === servicioId && c.fecha === fecha && c.hora === hora).length;
}
// La franja está ocupada cuando ya no queda ningún cupo libre en ella.
function cupoOcupado(servicioId, fecha, hora, ignorarId) {
  return cuposTomadosEnFranja(servicioId, fecha, hora, ignorarId) >= MEDICOS_POR_FRANJA;
}
// Cupos libres del día (suma de todas las franjas) y cupos máximos por día.
function cuposLibres(servicioId, fecha, ignorarId) {
  return todasLasHoras().reduce((total, h) =>
    total + Math.max(0, MEDICOS_POR_FRANJA - cuposTomadosEnFranja(servicioId, fecha, h, ignorarId)), 0);
}
function cuposPorDia() { return todasLasHoras().length * MEDICOS_POR_FRANJA; }

// La fecha y la hora no se escogen: el sistema sortea una de las franjas libres de los próximos días hábiles.
// Devuelve { fecha, hora } o null si no hay cupos.
function asignarCupoAleatorio(servicioId, correo, ignorarId) {
  const libres = [];
  diasDisponibles().forEach((fecha) => {
    todasLasHoras().forEach((hora) => {
      if (!cupoOcupado(servicioId, fecha, hora, ignorarId) && !usuarioTieneCitaEn(correo, fecha, hora, ignorarId)) {
        libres.push({ fecha, hora });
      }
    });
  });
  if (!libres.length) return null;
  return libres[Math.floor(Math.random() * libres.length)];
}

// Enlace de correo ya redactado para pedir a la administración un cambio o la cancelación
function enlaceCorreoCambio(cita) {
  const asunto = "Solicitud de cambio o cancelación de la cita " + cita.id;
  const cuerpo = [
    "Hola, quiero pedir un cambio o la cancelación de mi cita.", "",
    "Código: " + cita.id,
    "Servicio: " + cita.servicioNombre,
    "Fecha y hora actuales: " + formatearFecha(cita.fecha, true) + ", " + formatearRangoHora(cita.hora),
    "Paciente: " + cita.paciente.nombres + " " + cita.paciente.apellidos,
    "Cédula: " + cita.paciente.cedula, "",
    "Lo que necesito (cambiar o cancelar, y el motivo):", ""
  ].join("\n");
  return "mailto:" + CORREO_ATENCION + "?subject=" + encodeURIComponent(asunto) + "&body=" + encodeURIComponent(cuerpo);
}
// Texto fijo que explica que los cambios y cancelaciones se piden por correo
function textoCambiosPorCorreo() {
  return `Para cambiar o cancelar tu cita, escribe a <a href="mailto:${escaparHtml(CORREO_ATENCION)}">${escaparHtml(CORREO_ATENCION)}</a> con tu código de cita.`;
}

function generarCodigo() {
  const n = Almacen.leer("tf_contador", 0) + 1;
  Almacen.guardar("tf_contador", n);
  return `TF-${new Date().getFullYear()}-${String(n).padStart(4, "0")}`;
}

function citaPasada(cita) {
  const [h, m] = cita.hora.split(":").map(Number);
  const f = fechaDesdeClave(cita.fecha);
  f.setHours(h, m, 0, 0);
  return f < new Date();
}

function cancelarCitaPorId(id) {
  const citas = obtenerCitas();
  const cita = citas.find((c) => c.id === id);
  if (!cita) return false;
  guardarCitas(citas.filter((c) => c.id !== id));
  registrarActividad("Cita cancelada", `${cita.id} · ${cita.servicioNombre}, ${cita.fecha} ${cita.hora}`);
  return true;
}

/* ---------- Componentes de pantalla ---------- */

function mostrarAviso(mensaje, tipo) {
  const zona = document.getElementById("avisos");
  if (!zona) return;
  const el = document.createElement("div");
  el.className = "aviso-flotante" + (tipo === "error" ? " aviso-flotante--error" : "");
  el.textContent = mensaje;
  zona.appendChild(el);
  setTimeout(() => el.remove(), 4200);
}

function confirmarAccion({ titulo, mensaje, textoAceptar, textoCancelar, peligro }) {
  return new Promise((resolver) => {
    const dialogo = document.createElement("dialog");
    dialogo.innerHTML = `
      <h2>${escaparHtml(titulo)}</h2>
      <p>${escaparHtml(mensaje)}</p>
      <div class="grupo-botones">
        <button type="button" class="boton boton--contorno" data-respuesta="no">${escaparHtml(textoCancelar || "Volver")}</button>
        <button type="button" class="boton ${peligro ? "boton--peligro-solido" : "boton--primario"}" data-respuesta="si">${escaparHtml(textoAceptar || "Aceptar")}</button>
      </div>`;
    document.body.appendChild(dialogo);
    const cerrar = (valor) => { dialogo.close(); dialogo.remove(); resolver(valor); };
    dialogo.addEventListener("click", (e) => {
      const r = e.target.getAttribute && e.target.getAttribute("data-respuesta");
      if (r) cerrar(r === "si");
    });
    dialogo.addEventListener("cancel", (e) => { e.preventDefault(); cerrar(false); });
    dialogo.showModal();
    dialogo.querySelector('[data-respuesta="no"]').focus();
  });
}

// Tarjeta tipo "ficho" (boleto con perforación) con los datos de la cita
function construirFicho(cita, opciones) {
  const o = opciones || {};
  const cancelada = cita.estado === "Cancelada";
  const clase = "insignia " + (cancelada ? "insignia--cancelada" : "insignia--programada");
  return `
  <div class="ficho-envoltorio">
    <article class="ficho ${o.ancho ? "ficho--ancho" : ""} ${cancelada ? "ficho--cancelado" : ""}" aria-label="Cita ${escaparHtml(cita.id)}">
      <div class="ficho__cuerpo">
        <p class="ficho__servicio">${escaparHtml(cita.servicioNombre)}</p>
        <p class="ficho__fecha">${escaparHtml(formatearFecha(cita.fecha))}</p>
        <p class="ficho__hora">${escaparHtml(formatearHora(cita.hora))}</p>
        <dl class="ficho__datos">
          <div><dt>Duración</dt><dd>${DURACION_CONSULTA} minutos (hasta las ${escaparHtml(formatearHora(horaFinConsulta(cita.hora)))})</dd></div>
          <div><dt>Lugar</dt><dd>${escaparHtml(DIRECCION_ATENCION)}</dd></div>
          <div><dt>Paciente</dt><dd>${escaparHtml(cita.paciente.nombres + " " + cita.paciente.apellidos)}</dd></div>
        </dl>
      </div>
      <div class="ficho__talon">
        <p class="ficho__nota">Código</p>
        <p class="ficho__codigo">${escaparHtml(cita.id)}</p>
        <span class="${clase}">${escaparHtml(cita.estado)}</span>
      </div>
    </article>
  </div>`;
}

/* ---------- Encabezado y pie (se repiten en todas las páginas) ---------- */

function pintarEncabezado() {
  const cont = document.getElementById("encabezado");
  if (!cont) return;
  const sesion = obtenerSesion();
  const usuario = esAdmin(sesion) ? null : sesion;
  const pagina = location.pathname.split("/").pop() || "index.html";
  const enlace = (href, texto) =>
    `<li><a href="${href}" ${pagina === href ? 'aria-current="page"' : ""}>${texto}</a></li>`;

  const cuenta = usuario
    ? `<div class="navegacion__cuenta">
         <p class="navegacion__saludo">Hola, ${escaparHtml(nombreCorto(usuario.nombre))}</p>
         <button type="button" class="enlace-boton cuenta-boton" id="boton-cuenta" aria-expanded="false" aria-controls="lista-cuenta">
           Hola, ${escaparHtml(nombreCorto(usuario.nombre))} <span aria-hidden="true">▾</span>
         </button>
         <div class="cuenta-lista" id="lista-cuenta">
           <ul>
             ${esAdmin(usuario)
               ? `<li><a href="admin-panel.html">Panel de administración</a></li>`
               : `${enlace("agendar.html", "Agendar cita")}
             ${enlace("mis-citas.html", "Mis citas")}`}
             <li><button type="button" class="enlace-boton" id="boton-salir">Cerrar sesión</button></li>
           </ul>
         </div>
       </div>`
    : `<div class="navegacion__cuenta"><ul>${enlace("iniciar-sesion.html", "Iniciar sesión")}</ul></div>`;

  cont.innerHTML = `
    <div class="contenedor encabezado__fila">
      <a class="marca" href="index.html" aria-label="TurnoFácil Quibdó, ir al inicio">
        <img src="img/logo-96.png" alt="" width="44" height="42">
        <span class="marca__nombre">TurnoFácil<span class="marca__ciudad">Quibdó</span></span>
      </a>
      <button type="button" class="boton-menu" id="boton-menu" aria-expanded="false" aria-controls="navegacion">
        <span aria-hidden="true">☰</span> Menú
      </button>
      <nav class="navegacion" id="navegacion" aria-label="Principal">
        <ul>
          ${enlace("index.html", "Inicio")}
          ${enlace("quienes-somos.html", "Quiénes somos")}
          ${enlace("servicios.html", "Servicios")}
          ${enlace("contacto.html", "Contacto")}
        </ul>
        ${cuenta}
      </nav>
    </div>`;

  const botonMenu = document.getElementById("boton-menu");
  const nav = document.getElementById("navegacion");
  botonMenu.addEventListener("click", () => {
    const abierto = nav.classList.toggle("abierta");
    botonMenu.setAttribute("aria-expanded", String(abierto));
  });

  const botonCuenta = document.getElementById("boton-cuenta");
  if (botonCuenta) {
    const lista = document.getElementById("lista-cuenta");
    botonCuenta.addEventListener("click", () => {
      const abierto = lista.classList.toggle("abierta");
      botonCuenta.setAttribute("aria-expanded", String(abierto));
    });
    document.addEventListener("click", (e) => {
      if (!lista.contains(e.target) && !botonCuenta.contains(e.target)) {
        lista.classList.remove("abierta");
        botonCuenta.setAttribute("aria-expanded", "false");
      }
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") { lista.classList.remove("abierta"); botonCuenta.setAttribute("aria-expanded", "false"); }
    });
  }
  const salir = document.getElementById("boton-salir");
  if (salir) salir.addEventListener("click", cerrarSesion);
}

function pintarPie() {
  const cont = document.getElementById("pie");
  if (!cont) return;
  cont.innerHTML = `
    <div class="contenedor pie__fila">
      <div>
        <p>© ${new Date().getFullYear()} TurnoFácil Quibdó. Todos los derechos reservados.</p>
        <p>Atención en: ${escaparHtml(DIRECCION_ATENCION)}. Citas de lunes a viernes.</p>
        <p>Prototipo académico: los datos se guardan solo en este navegador.</p>
      </div>
      <ul class="pie__enlaces">
        <li><a href="privacidad.html">Privacidad</a></li>
        <li><a href="terminos.html">Términos y condiciones</a></li>
        <li><a href="blog.html">Blog y opiniones</a></li>
        <li><a href="ayuda.html">Ayuda</a></li>
        <li><a href="admin-ingreso.html">Administración</a></li>
      </ul>
    </div>`;
}

document.addEventListener("DOMContentLoaded", () => {
  pintarEncabezado();
  pintarPie();
});
