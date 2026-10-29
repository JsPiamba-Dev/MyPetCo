"use client";
import { useCallback, useEffect, useState } from "react";
import { citasService, type Cita } from "../../services/citas.service";
const labels: Record<string, string> = {
  SOLICITADA: "Pendiente de respuesta",
  CONFIRMADA: "Confirmada",
  RECHAZADA: "No aceptada",
  CANCELADA: "Cancelada",
  COMPLETADA: "Completada",
};
const pill: Record<string, string> = {
  SOLICITADA: "bg-amber-50 text-amber-800",
  CONFIRMADA: "bg-emerald-50 text-emerald-800",
  RECHAZADA: "bg-red-50 text-red-700",
  CANCELADA: "bg-slate-100 text-slate-600",
  COMPLETADA: "bg-blue-50 text-blue-800",
};
const dateLabel = (v: string) =>
  new Intl.DateTimeFormat("es-CO", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(v));
export default function MisCitas() {
  const [items, setItems] = useState<Cita[]>([]);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    setBusy(true);
    setError("");
    try {
      const r = await citasService.misCitas();
      setItems(Array.isArray(r) ? r : []);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "No se pudieron cargar tus citas.",
      );
    } finally {
      setBusy(false);
    }
  }, []);
  useEffect(() => {
    void load();
  }, [load]);
  async function cancelar(id: string) {
    if (!window.confirm("¿Quieres cancelar esta solicitud de cita?")) return;
    try {
      await citasService.cambiarEstado(id, "CANCELADA");
      await load();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "No fue posible cancelar la cita.",
      );
    }
  }
  return (
    <section
      id="mis-citas"
      className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:p-7"
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">Mis citas</h2>
          <p className="mt-1 text-sm text-slate-500">
            Consulta las solicitudes y su estado.
          </p>
        </div>
        <button
          onClick={() => void load()}
          className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold"
        >
          Actualizar
        </button>
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
          Cargando citas…
        </p>
      ) : items.length === 0 ? (
        <p className="mt-5 rounded-xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">
          Todavía no tienes citas registradas.
        </p>
      ) : (
        <div className="mt-5 space-y-3">
          {items.map((c) => (
            <article
              key={c.id}
              className="rounded-xl border border-slate-100 p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold">
                    {c.servicio_titulo || "Cita veterinaria"}
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    {c.proveedor_nombre || "Veterinaria"} ·{" "}
                    {c.mascota_nombre || "Mi mascota"}
                  </p>
                  <p className="mt-2 text-sm">
                    {dateLabel(c.fecha_solicitada)}
                  </p>
                  {c.motivo && (
                    <p className="mt-2 text-sm text-slate-600">
                      Motivo: {c.motivo}
                    </p>
                  )}
                  {c.notas_proveedor && (
                    <p className="mt-2 text-sm text-slate-600">
                      Nota de la veterinaria: {c.notas_proveedor}
                    </p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-3">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${pill[c.estado] || "bg-slate-100 text-slate-600"}`}
                  >
                    {labels[c.estado] || c.estado}
                  </span>
                  {(c.estado === "SOLICITADA" || c.estado === "CONFIRMADA") && (
                    <button
                      onClick={() => void cancelar(c.id)}
                      className="text-sm font-semibold text-red-700 hover:underline"
                    >
                      Cancelar cita
                    </button>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
