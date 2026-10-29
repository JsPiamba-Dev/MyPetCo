"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  CalendarDays,
  Heart,
  PawPrint,
  ShieldCheck,
  Sparkles,
  ShoppingBag,
  Stethoscope,
  RefreshCw,
  Search,
  MapPin,
  LogIn,
} from "lucide-react";

import {
  publicacionesService,
  type Publicacion,
  type TipoProveedor,
} from "../services/publicaciones.service";

const field =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100";

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

function CatalogoPublico() {
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
      const result = await publicacionesService.listarPublico({
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
      id="catalogo"
      className="scroll-mt-8 border-t border-slate-100 bg-[#f8faf8] py-16 sm:py-24"
    >
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-emerald-900">
              <ShoppingBag size={14} />
              Explora MyPetCo
            </span>

            <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Todo para su bienestar, en un solo lugar.
            </h2>

            <p className="mt-4 max-w-xl leading-7 text-slate-600">
              Descubre productos, servicios y atención veterinaria de
              organizaciones que hacen parte de nuestra comunidad.
            </p>
          </div>

          <Link
            href="/login"
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#173d32] px-5 py-3 font-semibold text-white transition hover:bg-emerald-900"
          >
            Explorar con mi cuenta
            <ArrowRight size={17} />
          </Link>
        </div>

        <div className="mt-9 rounded-3xl border border-slate-100 bg-white p-4 shadow-sm sm:p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h3 className="font-semibold text-slate-900">
              Encuentra lo que necesitas
            </h3>

            <button
              type="button"
              onClick={() => void load()}
              disabled={busy}
              className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-50 disabled:opacity-50"
            >
              <RefreshCw size={15} className={busy ? "animate-spin" : ""} />
              Actualizar
            </button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div className="relative">
              <Search
                size={17}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                className={`${field} pl-10`}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Nombre o descripción"
                aria-label="Buscar en el catálogo"
              />
            </div>

            <div className="relative">
              <MapPin
                size={17}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                className={`${field} pl-10`}
                value={ciudad}
                onChange={(e) => setCiudad(e.target.value)}
                placeholder="Filtrar por ciudad"
                aria-label="Filtrar por ciudad"
              />
            </div>

            <select
              className={field}
              value={tipo}
              onChange={(e) => setTipo(e.target.value as typeof tipo)}
              aria-label="Tipo de publicación"
            >
              <option value="TODOS">Productos y servicios</option>
              <option value="PRODUCTO">Solo productos</option>
              <option value="SERVICIO">Solo servicios</option>
            </select>

            <select
              className={field}
              value={proveedor}
              onChange={(e) => setProveedor(e.target.value as typeof proveedor)}
              aria-label="Tipo de proveedor"
            >
              <option value="TODOS">Todas las organizaciones</option>
              <option value="EMPRESA">Empresas</option>
              <option value="VETERINARIA">Veterinarias</option>
            </select>

            <select
              className={field}
              value={especie}
              onChange={(e) => setEspecie(e.target.value as typeof especie)}
              aria-label="Especie de mascota"
            >
              <option value="TODAS">Cualquier especie</option>
              <option value="PERRO">Perros</option>
              <option value="GATO">Gatos</option>
            </select>
          </div>
        </div>

        {error && (
          <div
            role="alert"
            className="mt-6 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-700"
          >
            <p>{error}</p>
            <button
              type="button"
              onClick={() => void load()}
              className="mt-2 font-semibold underline"
            >
              Intentar de nuevo
            </button>
          </div>
        )}

        {busy ? (
          <div className="py-16 text-center">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-emerald-100 border-t-emerald-700" />
            <p className="mt-4 text-sm text-slate-500">
              Cargando productos y servicios...
            </p>
          </div>
        ) : visibles.length === 0 ? (
          <div className="mt-8 rounded-3xl border border-dashed border-slate-200 bg-white px-6 py-14 text-center">
            <PawPrint size={35} className="mx-auto text-emerald-700" />
            <h3 className="mt-4 font-semibold text-slate-900">
              No encontramos publicaciones
            </h3>
            <p className="mt-2 text-sm text-slate-500">
              Prueba con otros términos o cambia los filtros.
            </p>
            <button
              type="button"
              onClick={() => {
                setQ("");
                setCiudad("");
                setTipo("TODOS");
                setProveedor("TODOS");
                setEspecie("TODAS");
              }}
              className="mt-4 rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Limpiar filtros
            </button>
          </div>
        ) : (
          <>
            <div className="mt-7 flex items-center justify-between gap-3">
              <p className="text-sm text-slate-500">
                {visibles.length}{" "}
                {visibles.length === 1
                  ? "publicación disponible"
                  : "publicaciones disponibles"}
              </p>
              <span className="hidden items-center gap-1.5 text-xs text-slate-400 sm:flex">
                <ShieldCheck size={15} />
                Comunidad MyPetCo
              </span>
            </div>

            <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {visibles.map((p) => {
                const prov = proveedorDe(p);
                const vet = esVeterinaria(p);

                return (
                  <article
                    key={p.id}
                    className="group flex h-full flex-col overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:border-emerald-200 hover:shadow-xl hover:shadow-emerald-950/5"
                  >
                    <div className="relative overflow-hidden bg-emerald-50">
                      {p.imagen ? (
                        <img
                          src={p.imagen}
                          alt={p.titulo}
                          className="h-52 w-full object-cover transition duration-500 group-hover:scale-105"
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex h-44 items-center justify-center bg-gradient-to-br from-emerald-50 to-[#e1eee2]">
                          <span className="rounded-3xl bg-white/80 p-6 text-emerald-800 shadow-sm">
                            {p.tipo === "PRODUCTO" ? (
                              <ShoppingBag size={42} strokeWidth={1.4} />
                            ) : (
                              <Stethoscope size={42} strokeWidth={1.4} />
                            )}
                          </span>
                        </div>
                      )}

                      <span className="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1.5 text-xs font-bold text-emerald-900 shadow-sm">
                        {p.tipo === "PRODUCTO" ? "Producto" : "Servicio"}
                      </span>
                    </div>

                    <div className="flex flex-1 flex-col p-5">
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span className="rounded-full bg-slate-100 px-2.5 py-1">
                          {vet ? "Veterinaria" : "Empresa"}
                        </span>
                        {(p.ciudad || prov?.ciudad) && (
                          <span className="flex min-w-0 items-center gap-1 truncate">
                            <MapPin size={13} />
                            {p.ciudad || prov?.ciudad}
                          </span>
                        )}
                      </div>

                      <h3 className="mt-4 text-lg font-bold leading-snug text-slate-900">
                        {p.titulo}
                      </h3>

                      <p className="mt-1 text-sm font-medium text-emerald-800">
                        {prov?.nombre_comercial || "Proveedor MyPetCo"}
                      </p>

                      <p className="mt-3 line-clamp-3 flex-1 text-sm leading-6 text-slate-600">
                        {p.descripcion ||
                          "Consulta más detalles de esta publicación al iniciar sesión."}
                      </p>

                      <div className="mt-5 border-t border-slate-100 pt-4">
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                          Precio
                        </p>
                        <p className="mt-1 text-xl font-bold text-emerald-950">
                          {precio(p)}
                        </p>

                        <Link
                          href="/login"
                          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#173d32] px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-900"
                        >
                          {p.tipo === "PRODUCTO"
                            ? "Comprar"
                            : "Consultar servicio"}
                          <LogIn size={16} />
                        </Link>

                        <p className="mt-2 text-center text-xs text-slate-400">
                          Inicia sesión para continuar
                        </p>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </>
        )}

        <div className="mt-10 rounded-3xl bg-[#eaf3eb] p-6 sm:flex sm:items-center sm:justify-between sm:gap-6 sm:p-8">
          <div>
            <h3 className="text-xl font-bold text-slate-900">
              ¿Encontraste algo para tu mascota?
            </h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Inicia sesión para continuar y descubrir las opciones disponibles
              para el cuidado de tu compañero.
            </p>
          </div>
          <Link
            href="/login"
            className="mt-5 inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 font-semibold text-emerald-900 shadow-sm transition hover:bg-emerald-50 sm:mt-0"
          >
            Iniciar sesión
            <ArrowRight size={17} />
          </Link>
        </div>
      </div>
    </section>
  );
}

export default function HomePage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#f8faf8] text-slate-900">
      <header className="sticky top-0 z-40 border-b border-slate-100 bg-white/95 backdrop-blur">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
          <Link href="/" className="flex items-center gap-3">
            <span className="rounded-xl bg-emerald-100 p-2.5 text-emerald-800">
              <PawPrint size={25} />
            </span>
            <span className="text-xl font-bold tracking-tight">MyPetCo</span>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            <a
              href="#catalogo"
              className="hidden rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 md:inline-flex"
            >
              Catálogo
            </a>
            <Link
              href="/login"
              className="rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 sm:px-4"
            >
              Iniciar sesión
            </Link>
            <Link
              href="/register"
              className="rounded-xl bg-[#173d32] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-900 sm:px-5"
            >
              Crear cuenta
            </Link>
          </div>
        </nav>
      </header>

      <section className="relative">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-5 pt-6 pb-12 sm:px-8 sm:pt-8 sm:pb-16 lg:grid-cols-2 lg:gap-16 lg:pt-10 lg:pb-20">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-800">
              <Heart size={16} />
              Más amor, mejor cuidado
            </div>

            <h1 className="max-w-2xl text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
              Ellos hacen tu vida especial.
              <span className="mt-2 block text-emerald-800">
                Cuida cada momento de la suya.
              </span>
            </h1>

            <p className="mt-6 max-w-xl text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">
              Organiza la información de tus mascotas, lleva un seguimiento de
              sus cuidados y descubre productos y servicios para su bienestar
              con MyPetCo.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/register"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#173d32] px-6 py-4 font-semibold text-white shadow-lg shadow-emerald-950/10 transition hover:-translate-y-0.5 hover:bg-emerald-900"
              >
                Comenzar gratis
                <ArrowRight size={18} />
              </Link>

              <a
                href="#catalogo"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-4 font-semibold text-slate-700 transition hover:border-emerald-300 hover:bg-emerald-50"
              >
                Ver catálogo
                <ShoppingBag size={18} />
              </a>
            </div>

            <div className="mt-8 flex flex-wrap gap-x-5 gap-y-3 text-sm text-slate-500">
              <span className="flex items-center gap-2">
                <ShieldCheck size={17} className="text-emerald-700" />
                Tu espacio personal
              </span>
              <span className="flex items-center gap-2">
                <Heart size={17} className="text-emerald-700" />
                Cuidado organizado
              </span>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-lg">
            <div className="absolute -left-4 top-10 h-32 w-32 rounded-full bg-emerald-100/80 blur-2xl" />
            <div className="absolute -right-3 bottom-8 h-40 w-40 rounded-full bg-amber-100/80 blur-2xl" />

            <div className="relative rounded-[2rem] border border-white bg-white p-5 shadow-2xl shadow-emerald-950/10 sm:p-8">
              <div className="rounded-[1.5rem] bg-[#edf5ee] p-6 sm:p-10">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-emerald-800">
                      UN HOGAR MÁS FELIZ
                    </p>
                    <h2 className="mt-2 text-2xl font-bold">
                      Su bienestar importa
                    </h2>
                  </div>
                  <div className="rounded-2xl bg-white p-3 text-emerald-800 shadow-sm">
                    <PawPrint size={27} />
                  </div>
                </div>

                <div className="my-8 flex items-center justify-center gap-5">
                  <div className="flex h-32 w-32 items-center justify-center rounded-[2rem] bg-[#d7e9d9] text-emerald-900 sm:h-40 sm:w-40">
                    <PawPrint size={82} strokeWidth={1.4} />
                  </div>
                  <div className="flex flex-col gap-3">
                    <span className="rounded-2xl bg-white p-3 text-emerald-800 shadow-sm">
                      <Heart size={24} />
                    </span>
                    <span className="rounded-2xl bg-white p-3 text-emerald-800 shadow-sm">
                      <Sparkles size={24} />
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-3 rounded-xl bg-white p-4">
                    <span className="rounded-lg bg-emerald-50 p-2 text-emerald-800">
                      <CalendarDays size={20} />
                    </span>
                    <div>
                      <p className="text-sm font-semibold">
                        Cuidados organizados
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        Ten a mano sus datos importantes
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 rounded-xl bg-white p-4">
                    <span className="rounded-lg bg-rose-50 p-2 text-rose-700">
                      <Heart size={20} />
                    </span>
                    <div>
                      <p className="text-sm font-semibold">
                        Más tiempo para quererlos
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        Dedícate a lo que más importa
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="absolute -bottom-5 -left-3 flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-lg sm:-left-7">
              <div className="rounded-xl bg-amber-50 p-2.5 text-amber-700">
                <Heart size={21} />
              </div>
              <div>
                <p className="text-sm font-bold">Amor en cada detalle</p>
                <p className="mt-1 text-xs text-slate-500">
                  Todos los días cuentan
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-slate-100 bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-emerald-700">
              TODO EN UN SOLO LUGAR
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              Cuidarlos puede ser más sencillo
            </h2>
            <p className="mt-4 leading-7 text-slate-500">
              Una forma práctica de mantener organizada la información de los
              integrantes más peludos de tu familia.
            </p>
          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-3">
            <article className="rounded-2xl border border-slate-100 bg-[#fbfcfb] p-6 transition hover:-translate-y-1 hover:shadow-lg">
              <div className="inline-flex rounded-xl bg-emerald-100 p-3 text-emerald-800">
                <PawPrint size={24} />
              </div>
              <h3 className="mt-5 text-lg font-bold">Sus perfiles</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Registra sus nombres, especie y otros datos importantes para
                tenerlos siempre disponibles.
              </p>
            </article>

            <article className="rounded-2xl border border-slate-100 bg-[#fbfcfb] p-6 transition hover:-translate-y-1 hover:shadow-lg">
              <div className="inline-flex rounded-xl bg-amber-100 p-3 text-amber-800">
                <CalendarDays size={24} />
              </div>
              <h3 className="mt-5 text-lg font-bold">Organización diaria</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Ten un espacio pensado para ayudarte a organizar sus rutinas y
                necesidades de cuidado.
              </p>
            </article>

            <article className="rounded-2xl border border-slate-100 bg-[#fbfcfb] p-6 transition hover:-translate-y-1 hover:shadow-lg">
              <div className="inline-flex rounded-xl bg-rose-100 p-3 text-rose-800">
                <Heart size={24} />
              </div>
              <h3 className="mt-5 text-lg font-bold">Bienestar con cariño</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Reúne su información para acompañarlos mejor en cada etapa de su
                vida.
              </p>
            </article>
          </div>
        </div>
      </section>

      <CatalogoPublico />

      <section className="bg-[#173d32] px-5 py-16 text-white sm:px-8 sm:py-20">
        <div className="mx-auto flex max-w-5xl flex-col items-center text-center">
          <PawPrint size={36} className="text-emerald-300" />
          <h2 className="mt-5 text-3xl font-bold tracking-tight sm:text-4xl">
            Su historia merece un espacio especial.
          </h2>
          <p className="mt-4 max-w-2xl leading-7 text-white/75">
            Crea tu cuenta y empieza a organizar el cuidado de quienes llenan
            tus días de alegría.
          </p>
          <Link
            href="/register"
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-6 py-4 font-semibold text-[#173d32] transition hover:bg-emerald-50"
          >
            Crear mi cuenta
            <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      <footer className="bg-white px-5 py-6 sm:px-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 text-center text-sm text-slate-500 sm:flex-row sm:text-left">
          <Link
            href="/"
            className="flex items-center gap-2 font-bold text-slate-800"
          >
            <PawPrint size={19} className="text-emerald-800" />
            MyPetCo
          </Link>
          <p>Cuidamos a quienes hacen especial tu vida.</p>
        </div>
      </footer>
    </main>
  );
}
