"use client";

import { useState, type FormEvent } from "react";
import { Cat, Dog, X } from "lucide-react";

type NewPetData = {
  nombre: string;
  especie: "PERRO" | "GATO";
  raza: string;
  pesoKg: number;
  fechaNacimiento: string;
  observaciones: string;
  esterilizada: boolean;
  enfermedadesAdquiridas: string;
};

type Props = {
  saving: boolean;
  onClose: () => void;
  onSubmit: (data: NewPetData) => Promise<void>;
};

function todayLocal() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function validDate(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;

  const [y, m, d] = value.split("-").map(Number);
  const date = new Date(y, m - 1, d);

  return date.getFullYear() === y &&
    date.getMonth() === m - 1 &&
    date.getDate() === d
    ? date
    : null;
}

export default function PetFormModal({ saving, onClose, onSubmit }: Props) {
  const [nombre, setNombre] = useState("");
  const [especie, setEspecie] = useState<"PERRO" | "GATO">("PERRO");
  const [raza, setRaza] = useState("");
  const [peso, setPeso] = useState("");
  const [fechaNacimiento, setFechaNacimiento] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [error, setError] = useState("");
  const [esterilizada, setEsterilizada] = useState(false);
  const [enfermedadesAdquiridas, setEnfermedadesAdquiridas] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const birth = validDate(fechaNacimiento);
    const today = validDate(todayLocal());
    const weight = Number(peso);

    if (!nombre.trim() || !raza.trim() || !observaciones.trim()) {
      setError("Completa todos los campos obligatorios.");
      return;
    }

    if (!birth || !today || birth > today) {
      setError("La fecha de nacimiento no es válida.");
      return;
    }

    const oldestAllowed = new Date(
      today.getFullYear() - 30,
      today.getMonth(),
      today.getDate(),
    );

    if (birth < oldestAllowed) {
      setError("La mascota no puede tener más de 30 años.");
      return;
    }

    if (!Number.isFinite(weight) || weight < 0.1 || weight > 500) {
      setError("El peso debe estar entre 0,1 y 500 kg.");
      return;
    }

    await onSubmit({
      nombre: nombre.trim(),
      especie,
      raza: raza.trim(),
      pesoKg: weight,
      fechaNacimiento,
      observaciones: observaciones.trim(),
      esterilizada,
      enfermedadesAdquiridas: enfermedadesAdquiridas.trim(),
    });
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
        className="my-auto w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl sm:p-8"
      >
        <div className="mb-6 flex items-start justify-between">
          <div>
            <p className="text-sm font-semibold text-emerald-700">
              NUEVO PERFIL
            </p>
            <h2 className="mt-1 text-2xl font-semibold">Añadir mascota</h2>
            <p className="mt-2 text-sm text-slate-500">
              Completa los datos de tu compañero.
            </p>
          </div>

          <button
            type="button"
            disabled={saving}
            onClick={onClose}
            aria-label="Cerrar formulario"
            className="rounded-xl p-2 hover:bg-slate-100 disabled:opacity-50"
          >
            <X />
          </button>
        </div>

        <div className="space-y-4">
          <Field label="Nombre" value={nombre} onChange={setNombre} />

          <div>
            <label className="mb-2 block text-sm font-medium">
              Fecha de nacimiento
            </label>
            <input
              type="date"
              required
              max={todayLocal()}
              value={fechaNacimiento}
              onChange={(event) => setFechaNacimiento(event.target.value)}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-600"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">Especie</label>
            <div className="grid grid-cols-2 gap-3">
              {(["PERRO", "GATO"] as const).map((item) => (
                <button
                  type="button"
                  key={item}
                  onClick={() => setEspecie(item)}
                  aria-pressed={especie === item}
                  className={`flex items-center justify-center gap-2 rounded-xl border p-3 font-medium ${
                    especie === item
                      ? "border-emerald-700 bg-emerald-50 text-emerald-900"
                      : "border-slate-200 text-slate-500"
                  }`}
                >
                  {item === "PERRO" ? <Dog size={18} /> : <Cat size={18} />}
                  {item === "PERRO" ? "Perro" : "Gato"}
                </button>
              ))}
            </div>
          </div>

          <Field label="Raza" value={raza} onChange={setRaza} />

          <div>
            <label className="mb-2 block text-sm font-medium">Peso en kg</label>
            <input
              type="number"
              min="0.1"
              max="500"
              step="0.1"
              required
              value={peso}
              onChange={(event) => setPeso(event.target.value)}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-600"
            />
          </div>

          <div className="rounded-xl border border-slate-200 p-4">
            <label className="flex cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                checked={esterilizada}
                onChange={(event) => setEsterilizada(event.target.checked)}
                className="h-4 w-4 accent-emerald-700"
              />
              <span className="text-sm font-medium">
                Mi mascota está esterilizada
              </span>
            </label>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">
              Enfermedades adquiridas
            </label>
            <textarea
              rows={3}
              maxLength={1000}
              value={enfermedadesAdquiridas}
              onChange={(event) =>
                setEnfermedadesAdquiridas(event.target.value)
              }
              placeholder="Diagnósticos confirmados u otras enfermedades conocidas..."
              className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-600"
            />
            <p className="mt-1 text-xs text-slate-400">
              {enfermedadesAdquiridas.length}/1000 caracteres
            </p>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">
              Observaciones
            </label>
            <textarea
              required
              maxLength={1000}
              rows={3}
              value={observaciones}
              onChange={(event) => setObservaciones(event.target.value)}
              placeholder="Alergias, cuidados especiales, etc."
              className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-600"
            />
          </div>
        </div>

        {error && (
          <p role="alert" className="mt-4 text-sm text-red-600">
            {error}
          </p>
        )}

        <div className="mt-6 flex gap-3">
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
            {saving ? "Guardando..." : "Guardar mascota"}
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium">{label}</label>
      <input
        required
        maxLength={100}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-600"
      />
    </div>
  );
}
