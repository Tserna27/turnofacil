# TurnoFácil Quibdó

Prototipo web para agendar citas médicas en Quibdó (Chocó) desde el celular, sin hacer fila de madrugada para conseguir un ficho.

Está hecho solo con **HTML, CSS y JavaScript**, todo en español. No necesita servidor, base de datos ni instalar nada.

## ¿Qué problema resuelve?

Hoy mucha gente hace fila en la calle para conseguir un turno. TurnoFácil permite elegir el servicio desde el celular y quedar con una cita de fecha y hora fijas, con un comprobante para guardar o imprimir.

Está pensado sobre todo para adultos mayores, gestantes y madres o padres con niños. El formulario pregunta si la persona pertenece a uno de esos grupos. Si alguien no tiene internet, un familiar o el personal de recepción puede agendar por ella.

## Cómo abrirlo

1. Clona el repositorio o descomprime la carpeta.
2. Abre `index.html` en el navegador (se recomienda Chrome).

Para publicarlo (por ejemplo en Render o GitHub Pages) basta con subir la carpeta completa.

## Qué puede hacer el usuario

- Crear una cuenta e iniciar sesión (`registro.html`, `iniciar-sesion.html`).
- Agendar una cita en 4 pasos (`agendar.html`):
  1. Elegir el servicio.
  2. Escoger el modo de la cita:
     - **Automática:** el sistema sortea el día y la hora entre los cupos libres.
     - **Manual:** la persona elige el día y la hora; las horas ocupadas salen desactivadas.
  3. Escribir sus datos: nombre, cédula, EPS, teléfono, grupo prioritario y qué siente.
  4. Confirmar y recibir el comprobante.
- Ver sus citas (`mis-citas.html`) y el comprobante (`comprobante.html`).
- Leer el blog de salud y dejar opiniones sobre el servicio.
- Escribir por el formulario de contacto.

### Reglas de las citas

- Se atiende de **lunes a viernes**, sin festivos.
- El horario es de **6:00 a. m. a 4:00 p. m.** (la última consulta empieza a las 3:45 p. m.).
- Cada consulta dura **15 minutos**.
- No se escoge médico. Hay 2 médicos por franja, o sea 2 cupos por cada franja de 15 minutos.
- Al agendar se muestran los próximos 10 días hábiles.
- El usuario **no puede editar ni cancelar** su cita. Lo pide por correo a la administración; en "Mis citas" y en el comprobante hay un botón que abre el correo ya redactado.

### Servicios

Medicina general, control prenatal, crecimiento y desarrollo, vacunación, odontología y control de hipertensión y diabetes.

## Panel de administración

Se entra por `admin-ingreso.html` o por "Administración" en el pie de página.

Cuenta de prueba:

| Correo | Clave |
| --- | --- |
| `admin@turnofacil.com` | `Admin12345` |

| Página | Para qué sirve |
| --- | --- |
| `admin-panel.html` | Resumen de usuarios, citas, mensajes, actividad reciente y próximas citas |
| `admin-citas.html` | Citas de todos los usuarios en calendario semanal y lista; ver detalle, cambiar día y hora, y cancelar |
| `admin-reportes.html` | Reportes con filtros, gráficas, tabla completa, impresión/PDF y descarga en CSV |
| `admin-usuarios.html` | Tabla de usuarios: registro, último ingreso, cantidad de ingresos, citas y opiniones |
| `admin-actividad.html` | Registro de ingresos, citas, opiniones, mensajes y blog, con filtros |
| `admin-blog.html` | Crear, editar, publicar/ocultar y eliminar entradas con texto e imagen |
| `admin-mensajes.html` | Mensajes del formulario de contacto (marcar como atendido) |

## Estructura del proyecto

```
turnofacil/
├── index.html              Página de inicio
├── quienes-somos.html, servicios.html, contacto.html,
│   blog.html, ayuda.html, privacidad.html, terminos.html
├── registro.html, iniciar-sesion.html
├── agendar.html, mis-citas.html, comprobante.html
├── admin-*.html            Panel de administración
├── css/estilos.css         Estilos de todo el sitio
├── js/
│   ├── comun.js            Configuración, datos de ejemplo, sesión, cupos y utilidades
│   ├── agendar.js          Asistente de 4 pasos para agendar
│   └── (un archivo por página: blog.js, mis-citas.js, admin-citas.js, ...)
└── img/                    Logo e imágenes
```

## Dónde cambiar los datos de ejemplo

Todo está al inicio de `js/comun.js`:

| Constante | Qué controla |
| --- | --- |
| `DIRECCION_ATENCION` | La única dirección de atención (hoy, Hospital Local Ismael Roldán Valencia) |
| `SERVICIOS` | Servicios, descripciones y palabras clave |
| `GRUPOS_PRIORITARIOS` | Grupos prioritarios del formulario |
| `EPS` | Lista de EPS |
| `DURACION_CONSULTA` | Minutos de cada consulta (15) |
| `HORA_APERTURA`, `HORA_ULTIMA_CONSULTA` | Horario de atención |
| `MEDICOS_POR_FRANJA` | Cupos por cada franja de 15 minutos (2) |
| `FESTIVOS` | Días sin atención |
| `DIAS_VISIBLES` | Días hábiles que se muestran al agendar (10) |
| `ADMIN_CORREO`, `ADMIN_CLAVE_DEMO` | Cuenta del administrador |
| `CORREO_ATENCION` | Correo al que se pide cambiar o cancelar una cita |

## Limitaciones (importante)

Es un **prototipo sin servidor**:

- Los datos se guardan en el navegador (`localStorage`). Cada navegador tiene sus propios datos: lo que un usuario agenda en su celular no aparece en el panel abierto en otro dispositivo.
- Los cupos ocupados que se ven al agendar son **simulados**.
- La cuenta de administrador y las claves están escritas en el código, solo para la demostración.

Para usarlo en serio hace falta una versión con servidor y base de datos.

## Repositorio

<https://github.com/Tserna27/turnofacil>
