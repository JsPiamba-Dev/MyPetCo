import { apiFetch } from "../lib/api";

export type PublicacionTipo = "PRODUCTO" | "SERVICIO";
export type EspecieObjetivo = "PERRO" | "GATO";
export type EtapaVida = "CACHORRO_GATITO" | "JOVEN" | "ADULTO" | "SENIOR" | "NO_ESPECIFICADA";
export type TipoProveedor = "EMPRESA" | "VETERINARIA";

export interface ProductoPublicacionInput {
    titulo: string;
    descripcion?: string;
    ciudad?: string;
    imagen?: string;
    categoria: string;
    especie_objetivo?: EspecieObjetivo | "";
    etapa_vida?: EtapaVida;
    precio?: number | null;
    moneda?: string;
    enlace_compra?: string;
    disponibilidad?: string;
}

export interface ServicioPublicacionInput {
    titulo: string;
    descripcion?: string;
    ciudad?: string;
    imagen?: string;
    categoria: string;
    especie_objetivo?: EspecieObjetivo | "";
    modalidad?: string;
    precio_desde?: number | null;
    requisitos?: string;
}

export interface Publicacion {
    id: string;
    proveedor_id?: string;
    tipo: PublicacionTipo;
    titulo: string;
    descripcion?: string | null;
    ciudad?: string | null;
    imagen?: string | null;
    activa?: boolean;
    fecha_publicacion?: string;
    proveedor?: {
        cuenta_id?: string;
        nombre_comercial: string;
        ciudad?: string | null;
        direccion?: string | null;
        telefono_contacto?: string | null;
        tipo?: TipoProveedor;
        veterinaria?: boolean;
    };
    proveedores?: {
        cuenta_id?: string;
        nombre_comercial: string;
        ciudad?: string | null;
        direccion?: string | null;
        telefono_contacto?: string | null;
        veterinarias?: unknown;
        empresas?: unknown;
    };
    productos?: {
        categoria: string;
        especie_objetivo?: EspecieObjetivo | null;
        etapa_vida?: EtapaVida;
        precio?: number | string | null;
        moneda?: string;
        enlace_compra?: string | null;
        disponibilidad?: string | null;
    } | null;
    servicios?: {
        categoria: string;
        especie_objetivo?: EspecieObjetivo | null;
        modalidad?: string | null;
        precio_desde?: number | string | null;
        requisitos?: string | null;
    } | null;
}

export interface FiltrosPublicaciones {
    q?: string;
    tipo?: PublicacionTipo | "TODOS";
    proveedor?: TipoProveedor | "TODOS";
    ciudad?: string;
    especie?: EspecieObjetivo | "TODAS";
}

const queryString = (values: Record<string, string | undefined>) => {
    const params = new URLSearchParams();
    Object.entries(values).forEach(([key, value]) => {
        if (value) params.set(key, value);
    });
    const query = params.toString();
    return query ? `?${query}` : "";
};

/**
 * Contrato frontend propuesto. Ajustar las rutas y el DTO cuando se implementen
 * los controladores reales en NestJS. Se asume que apiFetch gestiona el token.
 */
export const publicacionesService = {
    listar(filtros: FiltrosPublicaciones = {}) {
        return apiFetch<Publicacion[]>(`/publicaciones${queryString({
            q: filtros.q,
            tipo: filtros.tipo && filtros.tipo !== "TODOS" ? filtros.tipo : undefined,
            proveedor: filtros.proveedor && filtros.proveedor !== "TODOS" ? filtros.proveedor : undefined,
            ciudad: filtros.ciudad,
            especie: filtros.especie && filtros.especie !== "TODAS" ? filtros.especie : undefined,
        })}`);
    },
    crearProducto(input: ProductoPublicacionInput) {
        return apiFetch<Publicacion>("/publicaciones/productos", {
            method: "POST",
            body: JSON.stringify({
                tipo: "PRODUCTO",
                titulo: input.titulo,
                descripcion: input.descripcion || undefined,
                ciudad: input.ciudad || undefined,
                imagen: input.imagen || undefined,
                producto: {
                    categoria: input.categoria,
                    especie_objetivo: input.especie_objetivo || undefined,
                    etapa_vida: input.etapa_vida || "NO_ESPECIFICADA",
                    precio: input.precio ?? undefined,
                    moneda: input.moneda || "COP",
                    enlace_compra: input.enlace_compra || undefined,
                    disponibilidad: input.disponibilidad || undefined,
                },
            }),
        });
    },
    crearServicio(input: ServicioPublicacionInput) {
        return apiFetch<Publicacion>("/publicaciones/servicios", {
            method: "POST",
            body: JSON.stringify({
                tipo: "SERVICIO",
                titulo: input.titulo,
                descripcion: input.descripcion || undefined,
                ciudad: input.ciudad || undefined,
                imagen: input.imagen || undefined,
                servicio: {
                    categoria: input.categoria,
                    especie_objetivo: input.especie_objetivo || undefined,
                    modalidad: input.modalidad || undefined,
                    precio_desde: input.precio_desde ?? undefined,
                    requisitos: input.requisitos || undefined,
                },
            }),
        });
    },
};
