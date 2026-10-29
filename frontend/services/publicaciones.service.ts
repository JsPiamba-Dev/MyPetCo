
import { apiFetch } from "../lib/api";

export type PublicacionTipo = "PRODUCTO" | "SERVICIO";
export type EspecieObjetivo = "PERRO" | "GATO";
export type EtapaVida =
    | "CACHORRO_GATITO"
    | "JOVEN"
    | "ADULTO"
    | "SENIOR"
    | "NO_ESPECIFICADA";
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

function filtrosQuery(filtros: FiltrosPublicaciones = {}) {
    return queryString({
        q: filtros.q?.trim() || undefined,
        tipo:
            filtros.tipo && filtros.tipo !== "TODOS"
                ? filtros.tipo
                : undefined,
        proveedor:
            filtros.proveedor && filtros.proveedor !== "TODOS"
                ? filtros.proveedor
                : undefined,
        ciudad: filtros.ciudad?.trim() || undefined,
        especie:
            filtros.especie && filtros.especie !== "TODAS"
                ? filtros.especie
                : undefined,
    });
}

function obtenerBaseUrlApi() {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL;

    if (!baseUrl) {
        throw new Error(
            "Falta configurar NEXT_PUBLIC_API_URL para consultar el catálogo público.",
        );
    }

    return baseUrl.replace(/\/+$/, "");
}

async function listarPublicacionesSinToken(
    filtros: FiltrosPublicaciones = {},
): Promise<Publicacion[]> {
    const url = `${obtenerBaseUrlApi()}/publicaciones${filtrosQuery(filtros)}`;

    const response = await fetch(url, {
        method: "GET",
        headers: {
            Accept: "application/json",
        },
        cache: "no-store",
    });

    if (!response.ok) {
        const detail = await response.text().catch(() => "");
        throw new Error(
            `No se pudo cargar el catálogo (${response.status})${detail ? `: ${detail}` : ""
            }`,
        );
    }

    const result: unknown = await response.json();

    // Admite respuestas como [] o { data: [] }.
    if (Array.isArray(result)) {
        return result as Publicacion[];
    }

    if (
        result &&
        typeof result === "object" &&
        "data" in result &&
        Array.isArray((result as { data: unknown }).data)
    ) {
        return (result as { data: Publicacion[] }).data;
    }

    if (
        result &&
        typeof result === "object" &&
        "publicaciones" in result &&
        Array.isArray((result as { publicaciones: unknown }).publicaciones)
    ) {
        return (result as { publicaciones: Publicacion[] }).publicaciones;
    }

    throw new Error("El servidor devolvió un formato de catálogo inesperado.");
}

export const publicacionesService = {
    // Consulta pública: no usa apiFetch ni envía token.
    listarPublico(filtros: FiltrosPublicaciones = {}) {
        return listarPublicacionesSinToken(filtros);
    },

    // Consulta autenticada: se conserva para las pantallas que la necesiten.
    listar(filtros: FiltrosPublicaciones = {}) {
        return apiFetch<Publicacion[]>(
            `/publicaciones${filtrosQuery(filtros)}`,
        );
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
