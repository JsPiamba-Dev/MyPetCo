
"use client";

import { useEffect, useState, type FormEvent } from "react";
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Dog,
  LoaderCircle,
  Plus,
  RefreshCw,
  Syringe,
} from "lucide-react";

import {
  vacunasService,
  type Vacuna,
  type RegistroVacunacion,
} from "../../services/vacunas.service";
import type { Pet } from "../../services/pets.service";

type Props = {
  pets: Pet[];
  token: string;
};

const fechaHoy = () => new Date().toISOString().slice(0, 10);

function formatearFecha(fecha: string | null | undefined) {
  if (!fecha) return "No registrada";

  const fechaCorta = fecha.slice(0, 10);
  const [anio, mes, dia] = fechaCorta.split("-");

  if (!anio || !mes || !dia) return fecha;

  return `${dia}/${mes}/${anio}`;
}

function nombreEstado(estado: string) {
  const estados: Record<string, string> = {
    APLICADA_DECLARADA: "Declarada por el propietario",
    APLICADA_VERIFICADA: "Verificada por veterinaria",
    PENDIENTE: "Pendiente",
    POR_VERIFICAR: "Por verificar",
    ANULADA: "Anulada",
  };

  return estados[estado] ?? estado.replaceAll("_", " ");
}

export default function Vacunacion({ pets, token }: Props) {
  const [vacunas, setVacunas] = useState<Vacuna[]>([]);
  const [mascotaId, setMascotaId] = useState(pets[0]?.id ?? "");
  const [registros, setRegistros] = useState<RegistroVacunacion[]>([]);

  const [cargandoVacunas, setCargandoVacunas] = useState(true);
  const [cargandoRegistros, setCargandoRegistros] = useState(false);
  const [guardando, setGuardando] = useState(false);

  const [error, setError] = useState("");
  const [avisoHistorial, setAvisoHistorial] = useState("");
  const [exito, setExito] = useState(false);

  const [vacunaId, setVacunaId] = useState("");
  const [fechaAplicacion, setFechaAplicacion] = useState(fechaHoy());
  const [dosis, setDosis] = useState("");
  const [lote, setLote] = useState("");
  const [observaciones, setObservaciones] = useState("");

  useEffect(() => {
    let activo = true;

    async function cargarVacunas() {
      setCargandoVacunas(true);
      setError("");

      try {
        const resultado = await vacunasService.listar(token);

        if (!activo) return;

        const activas = resultado.filter((vacuna) => vacuna.activa);
        setVacunas(activas);
        setVacunaId((actual) =>
          activas.some((vacuna) => vacuna.id === actual)
            ? actual
            : activas[0]?.id ?? "",
        );
      } catch {
        if (activo) {
          setError("No fue posible cargar el catálogo de vacunas.");
        }
      } finally {
        if (activo) setCargandoVacunas(false);
      }
    }

    void cargarVacunas();

    return () => {
      activo = false;
    };
  }, [token]);

  useEffect(() => {
    let activo = true;

    async function cargarRegistros() {
      setRegistros([]);
      setAvisoHistorial("");
      setExito(false);

      if (!mascotaId) return;

      setCargandoRegistros(true);

      try {
        const resultado = await vacunasService.listarPorMascota(
          mascotaId,
          token,
        );

        if (activo) {
          setRegistros(resultado);
        }
      } catch {
        if (activo) {
          setAvisoHistorial(
            "No se pudo consultar el historial. Verifica que el backend tenga implementado GET /mascotas/:mascotaId/vacunas.",
          );
        }
      } finally {
        if (activo) setCargandoRegistros(false);
      }
    }

    void cargarRegistros();

    return () => {
      activo = false;
    };
  }, [mascotaId, token]);

  async function registrarVacuna(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();

    if (!mascotaId || !vacunaId) {
      setError("Selecciona una mascota y una vacuna.");
      return;
    }

    setGuardando(true);
    setError("");
    setExito(false);

    try {
      const nuevoRegistro = await vacunasService.crear(
        mascotaId,
        {
          vacuna_id: vacunaId,
          fecha_aplicacion: fechaAplicacion || undefined,
          dosis: dosis.trim() || undefined,
          lote: lote.trim() || undefined,
          observaciones: observaciones.trim() || undefined,
        },
        token,
      );

      setRegistros((actuales) => [
        nuevoRegistro,
        ...actuales.filter((registro) => registro.id !== nuevoRegistro.id),
      ]);

      setExito(true);
      setDosis("");
      setLote("");
      setObservaciones("");
    } catch {
      setError("No fue posible registrar la vacuna. Inténtalo nuevamente.");
    } finally {
      setGuardando(false);
    }
  }

  const nombreVacuna = (registro: RegistroVacunacion) =>
    registro.vacuna?.nombre ??
    vacunas.find((vacuna) => vacuna.id === registro.vacuna_id)?.nombre ??
    "Vacuna";

  return (
    <section id="vacunacion" className="scroll-mt-6 space-y-6">
      <div>
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-emerald-100 p-3 text-emerald-800">
            <Syringe size={23} />
          </div>

          <div>
            <h2 className="text-xl font-bold text-slate-900">
              Vacunación
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Registra y consulta las vacunas de tus mascotas.
            </p>
          </div>
        </div>
      </div>

      {pets.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
          <Dog className="mx-auto mb-3 text-slate-400" size={32} />
          <h3 className="font-semibold text-slate-800">
            Aún no tienes mascotas registradas
          </h3>
          <p className="mt-2 text-sm text-slate-500">
            Registra una mascota para poder llevar su control de vacunación.
          </p>
        </div>
      ) : (
        <>
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <label
              htmlFor="mascota-vacunacion"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Selecciona una mascota
            </label>

            <select
              id="mascota-vacunacion"
              value={mascotaId}
              onChange={(evento) => setMascotaId(evento.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100"
            >
              {pets.map((mascota) => (
                <option key={mascota.id} value={mascota.id}>
                  {mascota.nombre}
                </option>
              ))}
            </select>
          </div>

          {error && (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
            >
              <AlertCircle size={18} className="mt-0.5 shrink-0" />
              <p>{error}</p>
            </div>
          )}

          {exito && (
            <div className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
              <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
              <p>La vacuna se registró correctamente.</p>
            </div>
          )}

          <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
            <div className="mb-5">
              <h3 className="font-bold text-slate-900">
                Registrar una vacuna
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Completa los datos de la aplicación que deseas declarar.
              </p>
            </div>

            {cargandoVacunas ? (
              <div className="flex items-center gap-2 py-6 text-sm text-slate-500">
                <LoaderCircle className="animate-spin" size={18} />
                Cargando catálogo de vacunas...
              </div>
            ) : vacunas.length === 0 ? (
              <p className="rounded-xl bg-amber-50 p-4 text-sm text-amber-800">
                No hay vacunas activas disponibles en el catálogo.
              </p>
            ) : (
              <form onSubmit={registrarVacuna} className="space-y-4">
                <div>
                  <label
                    htmlFor="vacuna"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Vacuna *
                  </label>

                  <select
                    id="vacuna"
                    required
                    value={vacunaId}
                    onChange={(evento) => setVacunaId(evento.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100"
                  >
                    {vacunas.map((vacuna) => (
                      <option key={vacuna.id} value={vacuna.id}>
                        {vacuna.nombre}
                        {vacuna.fabricante
                          ? ` — ${vacuna.fabricante}`
                          : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="fecha-aplicacion"
                      className="mb-2 block text-sm font-medium text-slate-700"
                    >
                      Fecha de aplicación
                    </label>
                    <input
                      id="fecha-aplicacion"
                      type="date"
                      max={fechaHoy()}
                      value={fechaAplicacion}
                      onChange={(evento) =>
                        setFechaAplicacion(evento.target.value)
                      }
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="dosis"
                      className="mb-2 block text-sm font-medium text-slate-700"
                    >
                      Dosis
                    </label>
                    <input
                      id="dosis"
                      value={dosis}
                      maxLength={100}
                      onChange={(evento) => setDosis(evento.target.value)}
                      placeholder="Ej. Primera dosis"
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="lote"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Número de lote
                  </label>
                  <input
                    id="lote"
                    value={lote}
                    maxLength={100}
                    onChange={(evento) => setLote(evento.target.value)}
                    placeholder="Opcional"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100"
                  />
                </div>

                <div>
                  <label
                    htmlFor="observaciones"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Observaciones
                  </label>
                  <textarea
                    id="observaciones"
                    value={observaciones}
                    onChange={(evento) =>
                      setObservaciones(evento.target.value)
                    }
                    rows={3}
                    placeholder="Información adicional sobre la aplicación..."
                    className="w-full resize-y rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100"
                  />
                </div>

                <p className="text-xs leading-5 text-slate-500">
                  El registro quedará declarado por el propietario. La
                  verificación veterinaria es un proceso independiente.
                </p>

                <button
                  type="submit"
                  disabled={guardando || !vacunaId}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#173d32] px-5 py-3 font-semibold text-white transition hover:bg-emerald-900 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                >
                  {guardando ? (
                    <LoaderCircle className="animate-spin" size={18} />
                  ) : (
                    <Plus size={18} />
                  )}
                  {guardando ? "Guardando..." : "Registrar vacuna"}
                </button>
              </form>
            )}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-slate-900">
                  Historial de vacunación
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Registros de la mascota seleccionada.
                </p>
              </div>

              {cargandoRegistros && (
                <RefreshCw
                  size={18}
                  className="animate-spin text-emerald-800"
                />
              )}
            </div>

            {avisoHistorial && (
              <p className="mb-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-800">
                {avisoHistorial}
              </p>
            )}

            {!cargandoRegistros && registros.length === 0 ? (
              <div className="rounded-xl bg-slate-50 px-4 py-8 text-center">
                <CalendarDays
                  size={28}
                  className="mx-auto mb-2 text-slate-400"
                />
                <p className="font-medium text-slate-700">
                  No hay registros para mostrar.
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  Cuando registres una vacuna, aparecerá aquí.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {registros.map((registro) => (
                  <article
                    key={registro.id}
                    className="rounded-xl border border-slate-100 p-4"
                  >
                    <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                      <div className="flex items-start gap-3">
                        <div className="rounded-xl bg-emerald-50 p-2 text-emerald-800">
                          <Syringe size={20} />
                        </div>

                        <div>
                          <h4 className="font-semibold text-slate-900">
                            {nombreVacuna(registro)}
                          </h4>
                          <p className="mt-1 text-sm text-slate-500">
                            Aplicación:{" "}
                            {formatearFecha(registro.fecha_aplicacion)}
                          </p>
                          {registro.dosis && (
                            <p className="mt-1 text-sm text-slate-500">
                              Dosis: {registro.dosis}
                            </p>
                          )}
                          {registro.lote && (
                            <p className="mt-1 text-sm text-slate-500">
                              Lote: {registro.lote}
                            </p>
                          )}
                        </div>
                      </div>

                      <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-800">
                        <Clock3 size={14} />
                        {nombreEstado(registro.estado)}
                      </span>
                    </div>

                    {registro.observaciones && (
                      <p className="mt-3 text-sm leading-6 text-slate-600">
                        {registro.observaciones}
                      </p>
                    )}

                    {registro.fecha_proxima_aplicacion && (
                      <p className="mt-3 text-sm text-emerald-800">
                        Próxima aplicación:{" "}
                        {formatearFecha(registro.fecha_proxima_aplicacion)}
                      </p>
                    )}
                  </article>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </section>
  );
}
