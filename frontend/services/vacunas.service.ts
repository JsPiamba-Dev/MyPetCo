import { apiFetch } from "../lib/api";

export type Vacuna = {
  id: string;
  nombre: string;
  descripcion: string | null;
  fabricante: string | null;
  activa: boolean;
};

export type RegistroVacunacion = {
  id: string;
  mascota_id: string;
  vacuna_id: string;
  regla_vacunacion_id: string | null;
  registrado_por_id: string;
  fecha_aplicacion: string | null;
  dosis: string | null;
  lote: string | null;
  observaciones: string | null;
  fecha_proxima_aplicacion: string | null;
  origen: string;
  estado: string;
  comprobante: string | null;
  fecha_creacion: string;
  vacuna?: Vacuna;
};

export type CrearVacunacionInput = {
  vacuna_id: string;
  regla_vacunacion_id?: string;
  fecha_aplicacion?: string;
  dosis?: string;
  lote?: string;
  observaciones?: string;
  fecha_proxima_aplicacion?: string;
  comprobante?: string;
};

function encabezadosAutorizacion(token: string) {
  return {
    Authorization: `Bearer ${token}`,
  };
}

export const vacunasService = {
  listar(token: string) {
    return apiFetch<Vacuna[]>("/vacunas", {
      headers: encabezadosAutorizacion(token),
    });
  },

  listarPorMascota(mascotaId: string, token: string) {
    return apiFetch<RegistroVacunacion[]>(
      `/mascotas/${encodeURIComponent(mascotaId)}/vacunas`,
      {
        headers: encabezadosAutorizacion(token),
      },
    );
  },

  crear(
    mascotaId: string,
    datos: CrearVacunacionInput,
    token: string,
  ) {
    return apiFetch<RegistroVacunacion>(
      `/mascotas/${encodeURIComponent(mascotaId)}/vacunas`,
      {
        method: "POST",
        headers: {
          ...encabezadosAutorizacion(token),
          "Content-Type": "application/json",
        },
        body: JSON.stringify(datos),
      },
    );
  },
};
