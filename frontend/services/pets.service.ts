
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
    foto?: string;
};

export type UpdatePetInput = Partial<CreatePetInput>;

/**
 * Convierte diferentes formatos de fecha a YYYY-MM-DD.
 * Evita problemas de zona horaria al mostrar la edad.
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

    // Para fechas ISO, conserva el día original sin convertirlo
    // a otra zona horaria.
    const isoMatch = trimmed.match(/^(\d{4}-\d{2}-\d{2})/);

    if (isoMatch) {
        return isoMatch[1];
    }

    // Admite fechas con formato DD/MM/YYYY.
    const localMatch = trimmed.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);

    if (localMatch) {
        const [, day, month, year] = localMatch;
        return `${year}-${month}-${day}`;
    }

    return null;
}

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

    const approximateAge =
        raw.edadAproximadaMeses ??
        raw.edad_aproximada_meses;

    const weight = raw.pesoKg ?? raw.peso_kg ?? null;

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
        foto: (raw.foto as string | null | undefined) ?? null,
        fechaRegistro: registrationDate ?? undefined,
    };
}

export const petsService = {
    async list(): Promise<Pet[]> {
        const response = await apiFetch<unknown>("/pets");

        // Admite tanto una lista directa como respuestas envueltas
        // en objetos habituales de una API.
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

    async get(id: string): Promise<Pet> {
        const response = await apiFetch<unknown>(
            `/pets/${encodeURIComponent(id)}`
        );

        const raw = response as Record<string, unknown> | null;

        // Admite respuestas del tipo { data: { ...mascota } }.
        if (
            raw &&
            typeof raw === "object" &&
            raw.data &&
            typeof raw.data === "object"
        ) {
            return normalizePet(raw.data);
        }

        return normalizePet(response);
    },

    async create(input: CreatePetInput): Promise<Pet> {
        const response = await apiFetch<unknown>("/pets", {
            method: "POST",
            body: JSON.stringify(input),
        });

        const raw = response as Record<string, unknown> | null;

        if (
            raw &&
            typeof raw === "object" &&
            raw.data &&
            typeof raw.data === "object"
        ) {
            return normalizePet(raw.data);
        }

        return normalizePet(response);
    },

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

        const raw = response as Record<string, unknown> | null;

        if (
            raw &&
            typeof raw === "object" &&
            raw.data &&
            typeof raw.data === "object"
        ) {
            return normalizePet(raw.data);
        }

        return normalizePet(response);
    },

    async remove(id: string): Promise<void> {
        await apiFetch<unknown>(
            `/pets/${encodeURIComponent(id)}`,
            { method: "DELETE" }
        );
    },
};
