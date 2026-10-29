"use client";
import { useEffect, useState, type FormEvent } from "react";
import { citasService } from "../../services/citas.service";
import {
  publicacionesService,
  type Publicacion,
} from "../../services/publicaciones.service";
import type { Pet } from "../../services/pets.service";
const cls =
  "mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-emerald-600";
export default function SolicitarCita({ pets }: { pets: Pet[] }) {
  const [servicios, setServicios] = useState<Publicacion[]>([]);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  useEffect(() => {
    publicacionesService
      .listar({ tipo: "SERVICIO", proveedor: "VETERINARIA" })
      .then((r) => setServicios(Array.isArray(r) ? r : []))
      .catch((e) =>
        setError(
          e instanceof Error
            ? e.message
            : "No se pudieron cargar los servicios veterinarios.",
        ),
      )
      .finally(() => setLoading(false));
  }, []);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    setBusy(true);
    setError("");
    setOk("");
    const f = new FormData(form);
    const servicio = servicios.find(
      (s) => s.id === String(f.get("servicio_id") || ""),
    );
    if (!servicio) {
      setError("Selecciona un servicio veterinario.");
      setBusy(false);
      return;
    }
    try {
      await citasService.solicitar({
        mascota_id: String(f.get("mascota_id") || ""),
        proveedor_id:
          servicio.proveedor_id || servicio.proveedores?.cuenta_id || "",
        servicio_id: servicio.id,
        fecha_solicitada: new Date(String(f.get("fecha") || "")).toISOString(),
        motivo: String(f.get("motivo") || "").trim() || undefined,
      });
      form.reset();
      setOk("Solicitud enviada. La veterinaria deberá confirmar la cita.");
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "No fue posible solicitar la cita.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <section
      id="solicitar-cita"
      className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:p-7"
    >
      <h2 className="text-xl font-semibold">Solicitar cita veterinaria</h2>
      <p className="mt-1 text-sm text-slate-500">
        Elige la mascota, el servicio y la fecha que prefieres.
      </p>
      {pets.length === 0 ? (
        <p className="mt-5 rounded-xl bg-amber-50 p-4 text-sm text-amber-900">
          Primero registra una mascota para poder solicitar una cita.
        </p>
      ) : (
        <form onSubmit={submit} className="mt-6 grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-medium">
            Mascota
            <select className={cls} name="mascota_id" required defaultValue="">
              <option value="" disabled>
                Selecciona tu mascota
              </option>
              {pets.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm font-medium">
            Servicio veterinario
            <select
              className={cls}
              name="servicio_id"
              required
              defaultValue=""
              disabled={loading}
            >
              <option value="" disabled>
                {loading ? "Cargando servicios…" : "Selecciona un servicio"}
              </option>
              {servicios.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.titulo} —{" "}
                  {s.proveedor?.nombre_comercial ||
                    s.proveedores?.nombre_comercial ||
                    "Veterinaria"}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm font-medium">
            Fecha y hora preferidas
            <input
              className={cls}
              name="fecha"
              type="datetime-local"
              required
              min={new Date(Date.now() + 60000).toISOString().slice(0, 16)}
            />
          </label>
          <label className="text-sm font-medium sm:col-span-2">
            Motivo o información para la veterinaria
            <textarea
              className={cls}
              name="motivo"
              rows={3}
              placeholder="Describe brevemente el motivo de la consulta…"
            />
          </label>
          {error && (
            <p
              role="alert"
              className="sm:col-span-2 rounded-xl bg-red-50 p-3 text-sm text-red-700"
            >
              {error}
            </p>
          )}
          {ok && (
            <p
              role="status"
              className="sm:col-span-2 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800"
            >
              {ok}
            </p>
          )}
          <div className="sm:col-span-2">
            <button
              disabled={busy || loading || servicios.length === 0}
              className="rounded-xl bg-[#173d32] px-5 py-3 font-semibold text-white disabled:opacity-50"
            >
              {busy ? "Enviando solicitud…" : "Solicitar cita"}
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
