import { apiFetch } from "../lib/api";

export type CitaEstado = "SOLICITADA" | "CONFIRMADA" | "RECHAZADA" | "CANCELADA" | "COMPLETADA";
export interface Cita {
    id: string;
    mascota_id: string;
    mascota_nombre?: string;
    propietario_id?: string;
    propietario_nombre?: string;
    proveedor_id: string;
    proveedor_nombre?: string;
    servicio_id?: string | null;
    servicio_titulo?: string | null;
    fecha_solicitada: string;
    estado: CitaEstado;
    motivo?: string | null;
    notas_proveedor?: string | null;
    fecha_creacion?: string;
}
export interface SolicitarCitaInput {
    mascota_id: string;
    proveedor_id: string;
    servicio_id?: string;
    fecha_solicitada: string;
    motivo?: string;
}

const qs = (values: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    Object.entries(values).forEach(([k, v]) => v && p.set(k, v));
    const s = p.toString();
    return s ? `?${s}` : "";
};

/** Contrato provisional: requiere implementar el módulo citas en NestJS y su modelo Prisma. */
export const citasService = {
    misCitas() {
        return apiFetch<Cita[]>("/citas/mias");
    },
    gestionar(filtros: { estado?: CitaEstado | "TODAS" } = {}) {
        return apiFetch<Cita[]>(`/citas/gestion${qs({ estado: filtros.estado && filtros.estado !== "TODAS" ? filtros.estado : undefined })}`);
    },
    solicitar(input: SolicitarCitaInput) {
        return apiFetch<Cita>("/citas", { method: "POST", body: JSON.stringify(input) });
    },
    cambiarEstado(id: string, estado: Extract<CitaEstado, "CONFIRMADA" | "RECHAZADA" | "CANCELADA" | "COMPLETADA">, notas_proveedor?: string) {
        return apiFetch<Cita>(`/citas/${encodeURIComponent(id)}/estado`, {
            method: "PATCH",
            body: JSON.stringify({ estado, notas_proveedor }),
        });
    },
};
