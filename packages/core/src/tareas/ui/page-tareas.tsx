import Tareas from "./Tareas";

/**
 * Pestaña de Tareas del asistente.
 *
 * Puente entre la ruta de cada marca y el componente del nucleo. La lista se
 * carga en el cliente porque se actualiza sin recargar: quien esta resolviendo
 * tareas las va cerrando una detras de otra.
 */
export default function PaginaTareas() {
  return <Tareas />;
}
