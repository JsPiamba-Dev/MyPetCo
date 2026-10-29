"use client";

import { useEffect, useState, type FormEvent } from "react";
import { HeartPulse, X } from "lucide-react";
import type { Pet } from "../../services/pets.service";

export type PetHealthUpdate = {
  pesoKg: number;
  observaciones: string;
  enfermedadesAdquiridas: string;
  esterilizada: boolean;
};

type Props = {
  pet: Pet;
  saving: boolean;
  onClose: () => void;
  onSubmit: (data: PetHealthUpdate) => Promise<void>;
};

export default function EditPetModal({
  pet,
  saving,
  onClose,
  onSubmit,
}: Props) {
  const [peso, setPeso] = useState(
    pet.pesoKg != null ? String(pet.pesoKg) : "",
  );
  const [observaciones, setObservaciones] = useState(pet.observaciones ?? "");
  const [enfermedades, setEnfermedades] = useState(
    pet.enfermedadesAdquiridas ?? "",
  );
  const [esterilizada, setEsterilizada] = useState(pet.esterilizada);
  const [error, setError] = useState("");

  useEffect(() => {
    setPeso(pet.pesoKg != null ? String(pet.pesoKg) : "");
    setObservaciones(pet.observaciones ?? "");
    setEnfermedades(pet.enfermedadesAdquiridas ?? "");
    setEsterilizada(pet.esterilizada);
    setError("");
  }, [pet]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const numericWeight = Number(peso);

    if (
      !Number.isFinite(numericWeight) ||
      numericWeight <= 0 ||
      numericWeight > 500
    ) {
      setError("El peso debe ser mayor que 0 y no superar los 500 kg.");
      return;
    }

    if (observaciones.length > 1000 || enfermedades.length > 1000) {
      setError(
        "Las observaciones y enfermedades no pueden superar los 1000 caracteres cada una.",
      );
      return;
    }

    try {
      await onSubmit({
        pesoKg: numericWeight,
        observaciones: observaciones.trim(),
        enfermedadesAdquiridas: enfermedades.trim(),
        esterilizada,
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No fue posible actualizar los datos de salud.",
      );
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !saving) onClose();
      }}
    >
      <form
        onSubmit={submit}
        className="my-auto w-full max-w-xl rounded-3xl bg-white p-6 shadow-2xl sm:p-8"
      >
        <div className="mb-6 flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-emerald-50 p-3 text-emerald-800">
              <HeartPulse size={23} />
            </div>
            <div>
              <h2 className="text-xl font-semibold">
                Datos de salud de {pet.nombre}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Actualiza la información de seguimiento de tu mascota.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            aria-label="Cerrar"
            className="rounded-xl p-2 hover:bg-slate-100 disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-5">
          <div>
            <label className="mb-2 block text-sm font-medium">
              Peso actual (kg)
            </label>
            <input
              type="number"
              required
              min="0.1"
              max="500"
              step="0.1"
              value={peso}
              onChange={(event) => setPeso(event.target.value)}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-600"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">
              Observaciones generales
            </label>
            <textarea
              rows={4}
              maxLength={1000}
              value={observaciones}
              onChange={(event) => setObservaciones(event.target.value)}
              placeholder="Cuidados especiales, alergias conocidas u otros cambios..."
              className="w-full resize-y rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-600"
            />
            <p className="mt-1 text-xs text-slate-400">
              {observaciones.length}/1000 caracteres
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 p-4">
            <label className="flex cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                checked={esterilizada}
                onChange={(event) => setEsterilizada(event.target.checked)}
                className="h-4 w-4 accent-emerald-700"
              />
              <span className="text-sm font-medium">Mascota esterilizada</span>
            </label>
            <p className="mt-1 text-xs text-slate-500">
              {esterilizada ? "Sí, está esterilizada" : "No está esterilizada"}
            </p>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">
              Enfermedades adquiridas
            </label>
            <textarea
              rows={4}
              maxLength={1000}
              value={enfermedades}
              onChange={(event) => setEnfermedades(event.target.value)}
              placeholder="Describe diagnósticos confirmados, fechas y notas relevantes..."
              className="w-full resize-y rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-600"
            />
            <p className="mt-1 text-xs leading-5 text-slate-400">
              Registra diagnósticos confirmados por un profesional veterinario.
              Evita incluir información que no haya sido verificada.
            </p>
          </div>
        </div>

        {error && (
          <p
            role="alert"
            className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700"
          >
            {error}
          </p>
        )}

        <div className="mt-7 flex gap-3">
          <button
            type="button"
            disabled={saving}
            onClick={onClose}
            className="flex-1 rounded-xl border border-slate-200 px-4 py-3 font-semibold disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex-1 rounded-xl bg-[#173d32] px-4 py-3 font-semibold text-white disabled:opacity-50"
          >
            {saving ? "Guardando..." : "Guardar cambios"}
          </button>
        </div>
      </form>
    </div>
  );
}
