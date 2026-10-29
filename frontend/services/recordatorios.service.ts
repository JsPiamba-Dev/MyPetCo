
import { apiFetch } from "../lib/api";

export type RecordatorioTipo =
  | "VACUNACION"
  | "CONTROL_VETERINARIO"
  | "DESPARASITACION"
  | "ESTERILIZACION"
  | "MEDICACION"
  | "OTRO";

export type RecordatorioEstado =
  | "PROGRAMADO"
  | "ENVIADO"
  | "COMPLETADO"
  | "POSPUESTO"
  | "CANCELADO";

export interface Recordatorio {
  id: string;
  usuario_id: string;
  mascota_id: string;
  registro_vacunacion_id?: string | null;
  titulo: string;
  descripcion?: string | null;
  fecha_programada: string;
  tipo: RecordatorioTipo;
  estado: RecordatorioEstado;
  fecha_creacion?: string;
  fecha_completado?: string | null;
  mascotas?: {
    id: string;
    nombre: string;
    especie: "PERRO" | "GATO";
  };
}

export interface CrearRecordatorioDto {
  mascota_id: string;
  titulo: string;
  descripcion?: string;
  fecha_programada: string;
  tipo: RecordatorioTipo;
}

export interface FiltrosRecordatorios {
  mascotaId?: string;
  desde?: string;
  hasta?: string;
  tipo?: RecordatorioTipo;
  estado?: RecordatorioEstado;
}

export const recordatoriosService = {
  listar(filtros: FiltrosRecordatorios = {}) {
    const params = new URLSearchParams();

    if (filtros.mascotaId) {
      params.set("mascotaId", filtros.mascotaId);
    }

    if (filtros.desde) params.set("desde", filtros.desde);
    if (filtros.hasta) params.set("hasta", filtros.hasta);
    if (filtros.tipo) params.set("tipo", filtros.tipo);
    if (filtros.estado) params.set("estado", filtros.estado);

    const query = params.toString();

    return apiFetch<Recordatorio[]>(
      `/recordatorios${query ? `?${query}` : ""}`,
    );
  },

  crear(dto: CrearRecordatorioDto) {
    return apiFetch<Recordatorio>("/recordatorios", {
      method: "POST",
      body: JSON.stringify(dto),
    });
  },

  completar(id: string) {
    return apiFetch<Recordatorio>(
      `/recordatorios/${encodeURIComponent(id)}/completar`,
      { method: "PATCH" },
    );
  },

  cancelar(id: string) {
    return apiFetch<Recordatorio>(
      `/recordatorios/${encodeURIComponent(id)}/cancelar`,
      { method: "PATCH" },
    );
  },
};

