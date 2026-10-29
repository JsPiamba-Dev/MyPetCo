"use client";
import { useState, type FormEvent } from "react";
import {
  publicacionesService,
  type EspecieObjetivo,
} from "../../services/publicaciones.service";
const cls =
  "mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100";
export default function PublicarServicioVeterinaria() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    setBusy(true);
    setError("");
    setOk("");
    const f = new FormData(form);
    try {
      await publicacionesService.crearServicio({
        titulo: String(f.get("titulo") || "").trim(),
        descripcion: String(f.get("descripcion") || "").trim(),
        ciudad: String(f.get("ciudad") || "").trim(),
        imagen: String(f.get("imagen") || "").trim(),
        categoria: String(f.get("categoria") || "").trim(),
        especie_objetivo: String(f.get("especie") || "") as
          | EspecieObjetivo
          | "",
        modalidad: String(f.get("modalidad") || "Presencial").trim(),
        precio_desde: f.get("precio") ? Number(f.get("precio")) : null,
        requisitos: String(f.get("requisitos") || "").trim(),
      });
      form.reset();
      setOk("Servicio veterinario enviado para publicación.");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No fue posible publicar el servicio.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:p-7">
      <h2 className="text-xl font-semibold">Publicar servicio veterinario</h2>
      <p className="mt-1 text-sm text-slate-500">
        Describe la atención clínica que ofrece tu veterinaria.
      </p>
      <form onSubmit={submit} className="mt-6 grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-medium">
          Nombre del servicio
          <input
            className={cls}
            name="titulo"
            required
            maxLength={150}
            placeholder="Consulta general, vacunación…"
          />
        </label>
        <label className="text-sm font-medium">
          Categoría clínica
          <input
            className={cls}
            name="categoria"
            required
            maxLength={100}
            placeholder="Consulta, diagnóstico, cirugía…"
          />
        </label>
        <label className="text-sm font-medium">
          Modalidad
          <input
            className={cls}
            name="modalidad"
            defaultValue="Presencial"
            maxLength={60}
          />
        </label>
        <label className="text-sm font-medium">
          Precio desde (COP)
          <input
            className={cls}
            name="precio"
            type="number"
            min="0"
            step="0.01"
          />
        </label>
        <label className="text-sm font-medium">
          Especie
          <select className={cls} name="especie" defaultValue="">
            <option value="">Perros y gatos / no especificada</option>
            <option value="PERRO">Perro</option>
            <option value="GATO">Gato</option>
          </select>
        </label>
        <label className="text-sm font-medium">
          Ciudad
          <input className={cls} name="ciudad" maxLength={100} />
        </label>
        <label className="text-sm font-medium sm:col-span-2">
          URL de imagen
          <input
            className={cls}
            name="imagen"
            type="url"
            placeholder="https://…"
          />
        </label>
        <label className="text-sm font-medium sm:col-span-2">
          Descripción clínica
          <textarea className={cls} name="descripcion" rows={3} />
        </label>
        <label className="text-sm font-medium sm:col-span-2">
          Preparación o requisitos para la consulta
          <textarea className={cls} name="requisitos" rows={2} />
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
            disabled={busy}
            className="rounded-xl bg-[#173d32] px-5 py-3 font-semibold text-white disabled:opacity-50"
          >
            {busy ? "Publicando…" : "Publicar servicio"}
          </button>
        </div>
      </form>
    </section>
  );
}
