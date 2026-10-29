"use client";
import { useCallback, useEffect, useState } from "react";
import {
  citasService,
  type Cita,
  type CitaEstado,
} from "../../services/citas.service";
const labels: Record<string, string> = {
  SOLICITADA: "Solicitada",
  CONFIRMADA: "Confirmada",
  RECHAZADA: "Rechazada",
  CANCELADA: "Cancelada",
  COMPLETADA: "Completada",
};
const dt = (v: string) =>
  new Intl.DateTimeFormat("es-CO", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(v));
export default function GestionarCitas() {
  const [items, setItems] = useState<Cita[]>([]);
  const [filtro, setFiltro] = useState<CitaEstado | "TODAS">("TODAS");
  const [busy, setBusy] = useState(true);
  const [working, setWorking] = useState("");
  const [error, setError] = useState("");
  const [nota, setNota] = useState<Record<string, string>>({});
  const load = useCallback(async () => {
    setBusy(true);
    setError("");
    try {
      const r = await citasService.gestionar({ estado: filtro });
      setItems(Array.isArray(r) ? r : []);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "No se pudieron cargar las citas.",
      );
    } finally {
      setBusy(false);
    }
  }, [filtro]);
  useEffect(() => {
    void load();
  }, [load]);
  async function update(
    id: string,
    estado: Extract<
      CitaEstado,
      "CONFIRMADA" | "RECHAZADA" | "CANCELADA" | "COMPLETADA"
    >,
  ) {
    setWorking(id);
    setError("");
    try {
      await citasService.cambiarEstado(id, estado, nota[id]);
      await load();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "No fue posible actualizar la cita.",
      );
    } finally {
      setWorking("");
    }
  }
  return (
    <section
      id="gestionar-citas"
      className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:p-7"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">Gestionar citas</h2>
          <p className="mt-1 text-sm text-slate-500">
            Revisa solicitudes de tutores y actualiza su estado.
          </p>
        </div>
        <button
          onClick={() => void load()}
          className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold"
        >
          Actualizar
        </button>
      </div>
      <div className="mt-5 max-w-xs">
        <label className="text-sm font-medium">
          Filtrar por estado
          <select
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
            value={filtro}
            onChange={(e) => setFiltro(e.target.value as typeof filtro)}
          >
            <option value="TODAS">Todos los estados</option>
            <option value="SOLICITADA">Solicitadas</option>
            <option value="CONFIRMADA">Confirmadas</option>
            <option value="RECHAZADA">Rechazadas</option>
            <option value="CANCELADA">Canceladas</option>
            <option value="COMPLETADA">Completadas</option>
          </select>
        </label>
      </div>
      {error && (
        <p
          role="alert"
          className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700"
        >
          {error}
        </p>
      )}
      {busy ? (
        <p className="py-8 text-center text-sm text-slate-500">
          Cargando solicitudes…
        </p>
      ) : items.length === 0 ? (
        <p className="mt-5 rounded-xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">
          No hay citas para este filtro.
        </p>
      ) : (
        <div className="mt-5 space-y-3">
          {items.map((c) => (
            <article
              key={c.id}
              className="rounded-xl border border-slate-100 p-4"
            >
              <div className="flex flex-wrap justify-between gap-2">
                <div>
                  <h3 className="font-semibold">
                    {c.servicio_titulo || "Cita veterinaria"}
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    {c.propietario_nombre || "Propietario"} ·{" "}
                    {c.mascota_nombre || "Mascota"}
                  </p>
                  <p className="mt-2 text-sm">
                    Fecha solicitada: {dt(c.fecha_solicitada)}
                  </p>
                  {c.motivo && (
                    <p className="mt-2 text-sm text-slate-600">
                      Motivo: {c.motivo}
                    </p>
                  )}
                </div>
                <span className="h-fit rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold">
                  {labels[c.estado] || c.estado}
                </span>
              </div>
              {c.estado === "SOLICITADA" && (
                <div className="mt-4">
                  <label className="text-sm font-medium">
                    Nota para el propietario (opcional)
                    <textarea
                      className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                      rows={2}
                      value={nota[c.id] || ""}
                      onChange={(e) =>
                        setNota((old) => ({ ...old, [c.id]: e.target.value }))
                      }
                    />
                  </label>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      disabled={working === c.id}
                      onClick={() => void update(c.id, "CONFIRMADA")}
                      className="rounded-lg bg-[#173d32] px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
                    >
                      Confirmar
                    </button>
                    <button
                      disabled={working === c.id}
                      onClick={() => void update(c.id, "RECHAZADA")}
                      className="rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-700 disabled:opacity-50"
                    >
                      Rechazar
                    </button>
                  </div>
                </div>
              )}
              {c.estado === "CONFIRMADA" && (
                <button
                  disabled={working === c.id}
                  onClick={() => void update(c.id, "COMPLETADA")}
                  className="mt-4 rounded-lg border border-emerald-200 px-3 py-2 text-sm font-semibold text-emerald-800 disabled:opacity-50"
                >
                  Marcar como completada
                </button>
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
