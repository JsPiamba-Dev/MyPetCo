
import { apiFetch } from "../lib/api";

export type Pet = {
    id: string;
    nombre: string;
    especie: "PERRO" | "GATO";
    raza?: string | null;
    pesoKg?: string | number | null;
    observaciones?: string | null;
    fechaNacimiento?: string | null;
    edadAproximadaMeses?: number | null;
    esterilizada: boolean;
    fechaEsterilizacion?: string | null;
    enfermedadesAdquiridas?: string | null;
    foto?: string | null;
    fechaRegistro?: string;
};

export type CreatePetInput = {
    nombre: string;
    especie: "PERRO" | "GATO";
    raza?: string;
    pesoKg?: number;
    observaciones?: string;
    fechaNacimiento?: string;
    edadAproximadaMeses?: number;
    esterilizada?: boolean;
    fechaEsterilizacion?: string;
    enfermedadesAdquiridas?: string | null;
    foto?: string;
};

export type UpdatePetInput = Partial<CreatePetInput>;

/**
 * Convierte distintos formatos de fecha a YYYY-MM-DD
 * sin cambiar el día por conversiones de zona horaria.
 */
function normalizeDate(value: unknown): string | null {
    if (value == null || value === "") {
        return null;
    }

    if (value instanceof Date) {
        if (Number.isNaN(value.getTime())) {
            return null;
        }

        const year = value.getFullYear();
        const month = String(value.getMonth() + 1).padStart(2, "0");
        const day = String(value.getDate()).padStart(2, "0");

        return `${year}-${month}-${day}`;
    }

    if (typeof value !== "string") {
        return null;
    }

    const trimmed = value.trim();

    if (!trimmed) {
        return null;
    }

    // Fechas ISO: YYYY-MM-DD o fecha con hora.
    const isoMatch = trimmed.match(/^(\d{4}-\d{2}-\d{2})/);

    if (isoMatch) {
        return isoMatch[1];
    }

    // Formato DD/MM/YYYY.
    const localMatch = trimmed.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);

    if (localMatch) {
        const [, day, month, year] = localMatch;
        return `${year}-${month}-${day}`;
    }

    return null;
}

/**
 * Normaliza las propiedades de la respuesta de NestJS/Prisma
 * para que el frontend trabaje con nombres camelCase.
 */
function normalizePet(data: unknown): Pet {
    const raw = (data ?? {}) as Record<string, unknown>;

    const birthDate = normalizeDate(
        raw.fechaNacimiento ??
        raw.fecha_nacimiento ??
        raw.fechaNacimientoPet ??
        raw.fecha_nacimento
    );

    const registrationDate = normalizeDate(
        raw.fechaRegistro ??
        raw.fecha_registro
    );

    const sterilizationDate = normalizeDate(
        raw.fechaEsterilizacion ??
        raw.fecha_esterilizacion
    );

    const approximateAge =
        raw.edadAproximadaMeses ??
        raw.edad_aproximada_meses;

    const weight = raw.pesoKg ?? raw.peso_kg ?? null;

    // Comprobar undefined/null explícitamente para conservar
    // correctamente una cadena vacía si viene de la API.
    const acquiredDiseases =
        raw.enfermedadesAdquiridas !== undefined
            ? raw.enfermedadesAdquiridas
            : raw.enfermedades_adquiridas;

    return {
        id: String(raw.id ?? ""),
        nombre: String(raw.nombre ?? ""),
        especie: String(raw.especie ?? "").toUpperCase() as Pet["especie"],

        raza: (raw.raza as string | null | undefined) ?? null,

        pesoKg: weight as string | number | null,

        observaciones:
            (raw.observaciones as string | null | undefined) ?? null,

        fechaNacimiento: birthDate,

        edadAproximadaMeses:
            approximateAge == null || approximateAge === ""
                ? null
                : Number(approximateAge),

        esterilizada: raw.esterilizada === true,

        fechaEsterilizacion: sterilizationDate,

        enfermedadesAdquiridas:
            typeof acquiredDiseases === "string"
                ? acquiredDiseases
                : null,

        foto: (raw.foto as string | null | undefined) ?? null,

        fechaRegistro: registrationDate ?? undefined,
    };
}

/**
 * Admite respuestas directas y respuestas envueltas en { data: ... }.
 */
function unwrapData(response: unknown): unknown {
    if (!response || typeof response !== "object") {
        return response;
    }

    const raw = response as Record<string, unknown>;

    if (
        raw.data &&
        typeof raw.data === "object" &&
        !Array.isArray(raw.data)
    ) {
        return raw.data;
    }

    return response;
}

export const petsService = {
    // Listar mascotas
    async list(): Promise<Pet[]> {
        const response = await apiFetch<unknown>("/pets");

        if (Array.isArray(response)) {
            return response.map(normalizePet);
        }

        if (response && typeof response === "object") {
            const result = response as Record<string, unknown>;
            const items = result.data ?? result.pets ?? result.mascotas;

            if (Array.isArray(items)) {
                return items.map(normalizePet);
            }
        }

        return [];
    },

    // Consultar una mascota
    async get(id: string): Promise<Pet> {
        const response = await apiFetch<unknown>(
            `/pets/${encodeURIComponent(id)}`
        );

        return normalizePet(unwrapData(response));
    },

    // Registrar una mascota
    async create(input: CreatePetInput): Promise<Pet> {
        const response = await apiFetch<unknown>("/pets", {
            method: "POST",
            body: JSON.stringify(input),
        });

        return normalizePet(unwrapData(response));
    },

    // Actualizar una mascota
    async update(
        id: string,
        input: UpdatePetInput
    ): Promise<Pet> {
        const response = await apiFetch<unknown>(
            `/pets/${encodeURIComponent(id)}`,
            {
                method: "PATCH",
                body: JSON.stringify(input),
            }
        );

        return normalizePet(unwrapData(response));
    },

    // Eliminar una mascota
    async remove(id: string): Promise<void> {
        await apiFetch<unknown>(
            `/pets/${encodeURIComponent(id)}`,
            { method: "DELETE" }
        );
    },
};
