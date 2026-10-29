import { apiFetch } from "../lib/api";

export type AdminRole = "PROPIETARIO" | "VETERINARIA" | "EMPRESA" | "ADMINISTRADOR";
export type AccountState = "PENDIENTE_VERIFICACION" | "ACTIVA" | "SUSPENDIDA" | "DESACTIVADA";
export type ExternalScope = "analytics:read" | "pets:aggregate";

export interface AdminUser {
    id: string;
    nombre: string;
    correo: string;
    rol: AdminRole;
    estado: AccountState;
    ciudad?: string | null;
    fecha_registro?: string;
    total_mascotas?: number;
}

export interface UserCreateInput {
    nombre: string;
    correo: string;
    password: string;
    rol: AdminRole;
    ciudad?: string;
}

export interface PetAggregate {
    ciudad: string;
    especie: "PERRO" | "GATO";
    raza: string;
    cantidad_mascotas: number;
    cantidad_propietarios: number;
}

export interface AggregateReport {
    total_mascotas: number;
    total_propietarios: number;
    por_ciudad: Array<{ ciudad: string; cantidad_mascotas: number; cantidad_propietarios: number }>;
    por_especie: Array<{ especie: "PERRO" | "GATO"; cantidad: number }>;
    por_raza: Array<{ raza: string; especie: "PERRO" | "GATO"; cantidad: number }>;
}

export interface ExternalTokenRecord {
    id: string;
    client_name: string;
    contract_reference: string;
    purpose: string;
    scopes: ExternalScope[];
    expires_at: string;
    revoked_at?: string | null;
    created_at: string;
    last_used_at?: string | null;
}

export interface CreateExternalTokenInput {
    client_name: string;
    contract_reference: string;
    purpose: string;
    expires_in_days: number;
    scopes: ExternalScope[];
}

export interface CreatedExternalToken {
    token: string; // El backend lo devuelve una sola vez; no persistirlo en el navegador.
    id: string;
    expires_at: string;
}

export const adminService = {
    listarUsuarios(filtros: { q?: string; rol?: AdminRole | "TODOS"; estado?: AccountState | "TODOS"; ciudad?: string } = {}) {
        return apiFetch<AdminUser[]>("/admin/users", {
            params: {
                q: filtros.q,
                rol: filtros.rol && filtros.rol !== "TODOS" ? filtros.rol : undefined,
                estado: filtros.estado && filtros.estado !== "TODOS" ? filtros.estado : undefined,
                ciudad: filtros.ciudad,
            },
        });
    },
    crearUsuario(input: UserCreateInput) {
        return apiFetch<AdminUser>("/admin/users", { method: "POST", body: JSON.stringify(input) });
    },
    actualizarUsuario(id: string, input: Partial<Pick<AdminUser, "nombre" | "rol" | "estado" | "ciudad">>) {
        return apiFetch<AdminUser>(`/admin/users/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify(input) });
    },
    eliminarUsuario(id: string) {
        return apiFetch<void>(`/admin/users/${encodeURIComponent(id)}`, { method: "DELETE" });
    },
    informeAgregado(filtros: { ciudad?: string; especie?: "PERRO" | "GATO" | "TODAS"; raza?: string } = {}) {
        return apiFetch<AggregateReport>("/admin/analytics/pets", {
            params: {
                ciudad: filtros.ciudad,
                especie: filtros.especie && filtros.especie !== "TODAS" ? filtros.especie : undefined,
                raza: filtros.raza,
            },
        });
    },
    listarTokens() {
        return apiFetch<ExternalTokenRecord[]>("/admin/integrations/tokens");
    },
    crearToken(input: CreateExternalTokenInput) {
        return apiFetch<CreatedExternalToken>("/admin/integrations/tokens", { method: "POST", body: JSON.stringify(input) });
    },
    revocarToken(id: string) {
        return apiFetch<ExternalTokenRecord>(`/admin/integrations/tokens/${encodeURIComponent(id)}/revoke`, { method: "PATCH" });
    },
};
