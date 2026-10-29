"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  publicacionesService,
  type Publicacion,
  type TipoProveedor,
} from "../../services/publicaciones.service";
const field =
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-600";
function proveedorDe(p: Publicacion) {
  return p.proveedor ?? p.proveedores;
}
function esVeterinaria(p: Publicacion) {
  const prov = proveedorDe(p);
  return Boolean(prov && (prov as { veterinarias?: unknown }).veterinarias);
}
function precio(p: Publicacion) {
  const raw =
    p.tipo === "PRODUCTO" ? p.productos?.precio : p.servicios?.precio_desde;
  if (raw == null || raw === "") return "Consultar precio";
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(Number(raw));
}
export default function CatalogoProveedores() {
  const [items, setItems] = useState<Publicacion[]>([]);
  const [q, setQ] = useState("");
  const [tipo, setTipo] = useState<"TODOS" | "PRODUCTO" | "SERVICIO">("TODOS");
  const [proveedor, setProveedor] = useState<"TODOS" | TipoProveedor>("TODOS");
  const [ciudad, setCiudad] = useState("");
  const [especie, setEspecie] = useState<"TODAS" | "PERRO" | "GATO">("TODAS");
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    setBusy(true);
    setError("");
    try {
      const result = await publicacionesService.listar({
        q: q.trim() || undefined,
        tipo,
        proveedor,
        ciudad: ciudad.trim() || undefined,
        especie,
      });
      setItems(Array.isArray(result) ? result : []);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "No fue posible cargar el catálogo.",
      );
    } finally {
      setBusy(false);
    }
  }, [q, tipo, proveedor, ciudad, especie]);
  useEffect(() => {
    void load();
  }, [load]);
  const visibles = useMemo(
    () =>
      items.filter(
        (p) =>
          p.activa !== false &&
          (proveedor === "TODOS" ||
            (proveedor === "VETERINARIA"
              ? esVeterinaria(p)
              : !esVeterinaria(p))),
      ),
    [items, proveedor],
  );
  return (
    <section
      id="catalogo-proveedores"
      className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:p-7"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">
            Catálogo de productos y servicios
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Encuentra empresas y veterinarias que ofrecen productos y atención
            para tus mascotas.
          </p>
        </div>
        <button
          onClick={() => void load()}
          className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold hover:bg-slate-50"
        >
          Actualizar
        </button>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <input
          className={field}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar por nombre o descripción…"
          aria-label="Buscar catálogo"
        />
        <input
          className={field}
          value={ciudad}
          onChange={(e) => setCiudad(e.target.value)}
          placeholder="Filtrar por ciudad"
          aria-label="Ciudad"
        />
        <select
          className={field}
          value={tipo}
          onChange={(e) => setTipo(e.target.value as typeof tipo)}
        >
          <option value="TODOS">Productos y servicios</option>
          <option value="PRODUCTO">Solo productos</option>
          <option value="SERVICIO">Solo servicios</option>
        </select>
        <select
          className={field}
          value={proveedor}
          onChange={(e) => setProveedor(e.target.value as typeof proveedor)}
        >
          <option value="TODOS">Todas las organizaciones</option>
          <option value="EMPRESA">Empresas</option>
          <option value="VETERINARIA">Veterinarias</option>
        </select>
        <select
          className={field}
          value={especie}
          onChange={(e) => setEspecie(e.target.value as typeof especie)}
        >
          <option value="TODAS">Cualquier especie</option>
          <option value="PERRO">Perros</option>
          <option value="GATO">Gatos</option>
        </select>
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
        <p className="py-10 text-center text-sm text-slate-500">
          Cargando catálogo…
        </p>
      ) : visibles.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">
          No encontramos publicaciones con esos filtros.
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {visibles.map((p) => {
            const prov = proveedorDe(p);
            const vet = esVeterinaria(p);
            return (
              <article
                key={p.id}
                className="overflow-hidden rounded-2xl border border-slate-100 transition hover:border-emerald-200 hover:shadow-sm"
              >
                {p.imagen ? (
                  <img
                    src={p.imagen}
                    alt=""
                    className="h-40 w-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex h-32 items-center justify-center bg-emerald-50 text-3xl">
                    {p.tipo === "PRODUCTO" ? "🛍️" : "🐾"}
                  </div>
                )}
                <div className="p-4">
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800">
                      {p.tipo === "PRODUCTO" ? "Producto" : "Servicio"}
                    </span>
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600">
                      {vet ? "Veterinaria" : "Empresa"}
                    </span>
                  </div>
                  <h3 className="mt-3 font-semibold">{p.titulo}</h3>
                  <p className="mt-1 text-sm text-slate-500">
                    {prov?.nombre_comercial || "Proveedor MyPetCo"}
                    {p.ciudad || prov?.ciudad
                      ? ` · ${p.ciudad || prov?.ciudad}`
                      : ""}
                  </p>
                  <p className="mt-3 line-clamp-3 text-sm leading-5 text-slate-600">
                    {p.descripcion || "Sin descripción adicional."}
                  </p>
                  <p className="mt-4 font-semibold text-emerald-900">
                    {precio(p)}
                  </p>
                  {p.tipo === "PRODUCTO" && p.productos?.enlace_compra && (
                    <a
                      className="mt-3 inline-flex text-sm font-semibold text-emerald-800 hover:underline"
                      href={p.productos.enlace_compra}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Ver producto ↗
                    </a>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
