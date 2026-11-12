/* Página de inicio: muestra una cita de ejemplo con el primer día hábil disponible */
document.addEventListener("DOMContentLoaded", () => {
  const zona = document.getElementById("ficho-ejemplo");
  if (!zona) return;
  const ejemplo = {
    id: "TF-2026-0001",
    servicioNombre: "Medicina general",
    fecha: diasDisponibles()[0],
    hora: "07:30",
    estado: "Programada",
    paciente: { nombres: "Tu", apellidos: "nombre aquí" }
  };
  zona.innerHTML = construirFicho(ejemplo);
});
