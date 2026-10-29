"use client";
import { useState, type FormEvent } from "react";
import {
  publicacionesService,
  type EspecieObjetivo,
  type EtapaVida,
} from "../../services/publicaciones.service";

const inputClass =
  "mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100";
export default function PublicarProducto() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    setError("");
    setOk("");
    setBusy(true);
    const f = new FormData(form);
    try {
      await publicacionesService.crearProducto({
        titulo: String(f.get("titulo") || "").trim(),
        descripcion: String(f.get("descripcion") || "").trim(),
        ciudad: String(f.get("ciudad") || "").trim(),
        imagen: String(f.get("imagen") || "").trim(),
        categoria: String(f.get("categoria") || "").trim(),
        especie_objetivo: String(f.get("especie") || "") as
          | EspecieObjetivo
          | "",
        etapa_vida: String(f.get("etapa") || "NO_ESPECIFICADA") as EtapaVida,
        precio: f.get("precio") ? Number(f.get("precio")) : null,
        moneda: "COP",
        enlace_compra: String(f.get("enlace") || "").trim(),
        disponibilidad: String(f.get("disponibilidad") || "").trim(),
      });
      form.reset();
      setOk("Producto enviado para publicación.");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No fue posible publicar el producto.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:p-7">
      <h2 className="text-xl font-semibold">Publicar producto</h2>
      <p className="mt-1 text-sm text-slate-500">
        Completa los datos del producto para el catálogo de MyPetCo.
      </p>
      <form onSubmit={submit} className="mt-6 grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-medium">
          Nombre del producto
          <input
            className={inputClass}
            name="titulo"
            required
            maxLength={150}
          />
        </label>
        <label className="text-sm font-medium">
          Categoría
          <input
            className={inputClass}
            name="categoria"
            required
            maxLength={100}
            placeholder="Alimento, higiene, accesorios…"
          />
        </label>
        <label className="text-sm font-medium">
          Precio (COP)
          <input
            className={inputClass}
            name="precio"
            type="number"
            min="0"
            step="0.01"
          />
        </label>
        <label className="text-sm font-medium">
          Disponibilidad
          <input
            className={inputClass}
            name="disponibilidad"
            placeholder="En stock, bajo pedido…"
          />
        </label>
        <label className="text-sm font-medium">
          Especie
          <select className={inputClass} name="especie" defaultValue="">
            <option value="">Todas / no especificada</option>
            <option value="PERRO">Perro</option>
            <option value="GATO">Gato</option>
          </select>
        </label>
        <label className="text-sm font-medium">
          Etapa de vida
          <select
            className={inputClass}
            name="etapa"
            defaultValue="NO_ESPECIFICADA"
          >
            <option value="NO_ESPECIFICADA">No especificada</option>
            <option value="CACHORRO_GATITO">Cachorro / gatito</option>
            <option value="JOVEN">Joven</option>
            <option value="ADULTO">Adulto</option>
            <option value="SENIOR">Senior</option>
          </select>
        </label>
        <label className="text-sm font-medium">
          Ciudad
          <input className={inputClass} name="ciudad" maxLength={100} />
        </label>
        <label className="text-sm font-medium">
          URL de imagen
          <input
            className={inputClass}
            name="imagen"
            type="url"
            placeholder="https://…"
          />
        </label>
        <label className="text-sm font-medium sm:col-span-2">
          Enlace de compra
          <input
            className={inputClass}
            name="enlace"
            type="url"
            placeholder="https://…"
          />
        </label>
        <label className="text-sm font-medium sm:col-span-2">
          Descripción
          <textarea className={inputClass} name="descripcion" rows={3} />
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
            {busy ? "Publicando…" : "Publicar producto"}
          </button>
        </div>
      </form>
    </section>
  );
}
