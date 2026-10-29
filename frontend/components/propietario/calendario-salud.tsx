
"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  CircleCheck,
  Clock,
  Plus,
  RefreshCw,
  X,
} from "lucide-react";

import type { Pet } from "../../services/pets.service";
import {
  recordatoriosService,
  type CrearRecordatorioDto,
  type Recordatorio,
  type RecordatorioTipo,
} from "../../services/recordatorios.service";

type Props = {
  pets: Pet[];
};

const TIPOS: { value: RecordatorioTipo; label: string }[] = [
  { value: "VACUNACION", label: "Vacunación" },
  { value: "CONTROL_VETERINARIO", label: "Control veterinario" },
  { value: "DESPARASITACION", label: "Desparasitación" },
  { value: "ESTERILIZACION", label: "Esterilización" },
  { value: "MEDICACION", label: "Medicación" },
  { value: "OTRO", label: "Otro cuidado" },
];

const ESTADOS_TERMINALES = ["COMPLETADO", "CANCELADO"];

function dateKey(value: string | Date): string {
  const date =
    value instanceof Date ? value : new Date(value);

  // La fecha de los recordatorios se interpreta en la zona
  // horaria local del usuario.
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function parseDateKey(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function localDateTime(value: string): string {
  const date = new Date(value);
  return date.toLocaleString("es-CO", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function tipoLabel(tipo: RecordatorioTipo): string {
  return TIPOS.find((item) => item.value === tipo)?.label ?? tipo;
}

function errorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : "Ocurrió un error inesperado.";
}

export default function CalendarioSalud({ pets }: Props) {
  const [eventos, setEventos] = useState<Recordatorio[]>([]);
  const [mes, setMes] = useState(() => {
    const hoy = new Date();
    return new Date(hoy.getFullYear(), hoy.getMonth(), 1);
  });
  const [fechaSeleccionada, setFechaSeleccionada] =
    useState(() => dateKey(new Date()));
  const [mascotaId, setMascotaId] = useState("");
  const [tipoFiltro, setTipoFiltro] = useState("");
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [accionId, setAccionId] = useState("");
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [tipo, setTipo] =
    useState<RecordatorioTipo>("CONTROL_VETERINARIO");
  const [fecha, setFecha] = useState(() => dateKey(new Date()));
  const [hora, setHora] = useState("09:00");
  const [mascotaNuevaId, setMascotaNuevaId] = useState("");

  const cargarEventos = useCallback(async () => {
    setCargando(true);
    setError("");

    try {
      const lista = await recordatoriosService.listar({
        mascotaId: mascotaId || undefined,
      });

      setEventos(lista);
    } catch (err) {
      setError(
        `No fue posible cargar los recordatorios: ${errorMessage(err)}`,
      );
    } finally {
      setCargando(false);
    }
  }, [mascotaId]);

  useEffect(() => {
    void cargarEventos();
  }, [cargarEventos]);

  useEffect(() => {
    if (!mascotaNuevaId && pets.length > 0) {
      setMascotaNuevaId(pets[0].id);
    }
  }, [pets, mascotaNuevaId]);

  const diasCalendario = useMemo(() => {
    const primerDia = new Date(
      mes.getFullYear(),
      mes.getMonth(),
      1,
    );

    // Lunes como primer día de la semana.
    const desplazamiento = (primerDia.getDay() + 6) % 7;
    const inicio = new Date(
      mes.getFullYear(),
      mes.getMonth(),
      1 - desplazamiento,
    );

    return Array.from({ length: 42 }, (_, index) => {
      const dia = new Date(inicio);
      dia.setDate(inicio.getDate() + index);
      return dia;
    });
  }, [mes]);

  const eventosFiltrados = useMemo(() => {
    return eventos.filter((evento) => {
      const coincideTipo = !tipoFiltro || evento.tipo === tipoFiltro;
      const coincideFecha =
        dateKey(evento.fecha_programada) === fechaSeleccionada;

      return coincideTipo && coincideFecha;
    });
  }, [eventos, tipoFiltro, fechaSeleccionada]);

  const eventosMes = useMemo(() => {
    return eventos.filter((evento) => {
      const fechaEvento = new Date(evento.fecha_programada);

      return (
        fechaEvento.getFullYear() === mes.getFullYear() &&
        fechaEvento.getMonth() === mes.getMonth() &&
        (!tipoFiltro || evento.tipo === tipoFiltro)
      );
    });
  }, [eventos, mes, tipoFiltro]);

  const pendientes = eventos.filter(
    (evento) => !ESTADOS_TERMINALES.includes(evento.estado),
  ).length;

  function cambiarMes(cantidad: number) {
    setMes(
      (actual) =>
        new Date(
          actual.getFullYear(),
          actual.getMonth() + cantidad,
          1,
        ),
    );
  }

  function abrirFormulario() {
    setError("");
    setMensaje("");
    setFecha(fechaSeleccionada);
    setTitulo("");
    setDescripcion("");
    setTipo("CONTROL_VETERINARIO");
    setMostrarFormulario(true);
  }

  async function crearRecordatorio(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setMensaje("");

    if (!mascotaNuevaId || !titulo.trim() || !fecha || !hora) {
      setError("Completa la mascota, el título, la fecha y la hora.");
      return;
    }

    const fechaLocal = new Date(`${fecha}T${hora}:00`);

    if (Number.isNaN(fechaLocal.getTime())) {
      setError("La fecha u hora ingresada no es válida.");
      return;
    }

    if (fechaLocal.getTime() < Date.now() - 60_000) {
      setError("Selecciona una fecha y hora futuras.");
      return;
    }

    const dto: CrearRecordatorioDto = {
      mascota_id: mascotaNuevaId,
      titulo: titulo.trim(),
      descripcion: descripcion.trim() || undefined,
      fecha_programada: fechaLocal.toISOString(),
      tipo,
    };

    setGuardando(true);

    try {
      await recordatoriosService.crear(dto);
      setMostrarFormulario(false);
      setMensaje("Recordatorio creado correctamente.");
      await cargarEventos();
    } catch (err) {
      setError(
        `No fue posible crear el recordatorio: ${errorMessage(err)}`,
      );
    } finally {
      setGuardando(false);
    }
  }

  async function ejecutarAccion(
    evento: Recordatorio,
    accion: "completar" | "cancelar",
  ) {
    const confirmacion =
      accion === "cancelar"
        ? "¿Deseas cancelar este recordatorio?"
        : "¿Confirmas que este cuidado ya se realizó?";

    if (!window.confirm(confirmacion)) return;

    setError("");
    setMensaje("");
    setAccionId(evento.id);

    try {
      if (accion === "completar") {
        await recordatoriosService.completar(evento.id);
      } else {
        await recordatoriosService.cancelar(evento.id);
      }

      setMensaje(
        accion === "completar"
          ? "Cuidado marcado como completado."
          : "Recordatorio cancelado.",
      );
      await cargarEventos();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setAccionId("");
    }
  }

  const hoy = dateKey(new Date());

  return (
    <section
      id="calendario-salud"
      className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:p-7"
    >
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="mb-2 flex items-center gap-2 text-emerald-800">
            <CalendarDays size={21} />
            <span className="text-sm font-semibold">
              BIENESTAR Y PREVENCIÓN
            </span>
          </div>
          <h2 className="text-xl font-semibold text-slate-900">
            Calendario de salud
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Organiza los próximos cuidados de tus mascotas.
          </p>
        </div>

        <button
          type="button"
          onClick={abrirFormulario}
          disabled={pets.length === 0}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#173d32] px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-900 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus size={17} />
          Nuevo recordatorio
        </button>
      </div>

      {error && (
        <div
          role="alert"
          className="mb-4 flex items-start justify-between gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
        >
          <span>{error}</span>
          <button
            type="button"
            aria-label="Cerrar error"
            onClick={() => setError("")}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {mensaje && (
        <div
          role="status"
          className="mb-4 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800"
        >
          {mensaje}
        </div>
      )}

      <div className="mb-5 grid gap-3 sm:grid-cols-2">
        <label className="text-sm font-medium text-slate-600">
          Mascota
          <select
            value={mascotaId}
            onChange={(e) => {
              setMascotaId(e.target.value);
              setFechaSeleccionada(hoy);
            }}
            className="mt-2 w-full rounded-xl border border-slate-200 bg-white p-3 text-slate-800 outline-none focus:border-emerald-700"
          >
            <option value="">Todas mis mascotas</option>
            {pets.map((pet) => (
              <option key={pet.id} value={pet.id}>
                {pet.nombre}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm font-medium text-slate-600">
          Tipo de cuidado
          <select
            value={tipoFiltro}
            onChange={(e) => setTipoFiltro(e.target.value)}
            className="mt-2 w-full rounded-xl border border-slate-200 bg-white p-3 text-slate-800 outline-none focus:border-emerald-700"
          >
            <option value="">Todos los tipos</option>
            {TIPOS.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mb-5 flex items-center justify-between gap-3 rounded-xl bg-[#f1f8f3] p-4">
        <div>
          <p className="text-sm text-emerald-800">Cuidados pendientes</p>
          <p className="mt-1 text-2xl font-semibold text-[#173d32]">
            {pendientes}
          </p>
        </div>

        <button
          type="button"
          onClick={() => void cargarEventos()}
          disabled={cargando}
          className="inline-flex items-center gap-2 rounded-lg border border-emerald-100 bg-white px-3 py-2 text-sm font-medium text-emerald-800 hover:bg-emerald-50 disabled:opacity-50"
        >
          <RefreshCw size={15} className={cargando ? "animate-spin" : ""} />
          Actualizar
        </button>
      </div>

      <div className="rounded-2xl border border-slate-100 p-3 sm:p-5">
        <div className="mb-5 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => cambiarMes(-1)}
            aria-label="Mes anterior"
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100"
          >
            <ChevronLeft size={20} />
          </button>

          <h3 className="font-semibold capitalize text-slate-800">
            {mes.toLocaleDateString("es-CO", {
              month: "long",
              year: "numeric",
            })}
          </h3>

          <button
            type="button"
            onClick={() => cambiarMes(1)}
            aria-label="Mes siguiente"
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center">
          {["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map(
            (dia) => (
              <div
                key={dia}
                className="py-2 text-xs font-semibold text-slate-400"
              >
                {dia}
              </div>
            ),
          )}

          {diasCalendario.map((dia) => {
            const key = dateKey(dia);
            const esMesActual = dia.getMonth() === mes.getMonth();
            const seleccionado = key === fechaSeleccionada;
            const tieneEventos = eventosMes.some(
              (evento) => dateKey(evento.fecha_programada) === key,
            );
            const tienePendientes = eventosMes.some(
              (evento) =>
                dateKey(evento.fecha_programada) === key &&
                !ESTADOS_TERMINALES.includes(evento.estado),
            );

            return (
              <button
                key={key}
                type="button"
                onClick={() => setFechaSeleccionada(key)}
                aria-pressed={seleccionado}
                className={[
                  "relative flex min-h-11 flex-col items-center justify-center rounded-xl text-sm transition sm:min-h-14",
                  esMesActual ? "text-slate-800" : "text-slate-300",
                  seleccionado
                    ? "bg-[#173d32] font-semibold text-white"
                    : "hover:bg-emerald-50",
                  key === hoy && !seleccionado
                    ? "ring-1 ring-emerald-600"
                    : "",
                ].join(" ")}
              >
                {dia.getDate()}
                {tieneEventos && (
                  <span
                    className={[
                      "mt-1 h-1.5 w-1.5 rounded-full",
                      seleccionado
                        ? "bg-white"
                        : tienePendientes
                          ? "bg-emerald-600"
                          : "bg-slate-300",
                    ].join(" ")}
                  />
                )}
              </button>
            );
          })}
        </div>

        <p className="mt-4 text-xs text-slate-400">
          Los puntos indican días con recordatorios. Selecciona un día para
          ver sus cuidados.
        </p>
      </div>

      <div className="mt-7">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h3 className="font-semibold text-slate-900">
              Agenda del día
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              {parseDateKey(fechaSeleccionada).toLocaleDateString("es-CO", {
                dateStyle: "full",
              })}
            </p>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
            {eventosFiltrados.length} eventos
          </span>
        </div>

        {cargando ? (
          <p className="py-6 text-center text-sm text-slate-500">
            Cargando calendario...
          </p>
        ) : eventosFiltrados.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 p-7 text-center">
            <CalendarDays className="mx-auto mb-3 text-slate-300" size={28} />
            <p className="font-medium text-slate-700">
              No hay cuidados programados para este día.
            </p>
            <button
              type="button"
              onClick={abrirFormulario}
              disabled={pets.length === 0}
              className="mt-3 text-sm font-semibold text-emerald-800 hover:underline disabled:opacity-50"
            >
              Añadir recordatorio
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {eventosFiltrados.map((evento) => {
              const mascota = pets.find(
                (pet) => pet.id === evento.mascota_id,
              );
              const terminal = ESTADOS_TERMINALES.includes(evento.estado);

              return (
                <article
                  key={evento.id}
                  className="rounded-xl border border-slate-100 p-4"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800">
                      <CalendarDays size={21} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="font-semibold text-slate-900">
                          {evento.titulo}
                        </h4>
                        <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600">
                          {tipoLabel(evento.tipo)}
                        </span>
                      </div>

                      <p className="mt-1 text-sm text-slate-500">
                        {mascota?.nombre ?? evento.mascotas?.nombre ?? "Mascota"}
                      </p>

                      <p className="mt-2 flex items-center gap-2 text-sm text-slate-600">
                        <Clock size={15} />
                        {localDateTime(evento.fecha_programada)}
                      </p>

                      {evento.descripcion && (
                        <p className="mt-2 whitespace-pre-wrap text-sm text-slate-500">
                          {evento.descripcion}
                        </p>
                      )}

                      <p className="mt-2 text-xs text-slate-400">
                        Estado: {evento.estado.replaceAll("_", " ")}
                      </p>

                      {!terminal && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          <button
                            type="button"
                            disabled={accionId === evento.id}
                            onClick={() =>
                              void ejecutarAccion(evento, "completar")
                            }
                            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 disabled:opacity-50"
                          >
                            <CircleCheck size={15} />
                            Completar
                          </button>

                          <button
                            type="button"
                            disabled={accionId === evento.id}
                            onClick={() =>
                              void ejecutarAccion(evento, "cancelar")
                            }
                            className="rounded-lg px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
                          >
                            Cancelar
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      {mostrarFormulario && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/40 p-4 backdrop-blur-sm">
          <form
            onSubmit={crearRecordatorio}
            className="my-auto w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl sm:p-8"
          >
            <div className="mb-6 flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-emerald-700">
                  NUEVO CUIDADO
                </p>
                <h3 className="mt-1 text-xl font-semibold text-slate-900">
                  Crear recordatorio
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setMostrarFormulario(false)}
                disabled={guardando}
                aria-label="Cerrar formulario"
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
              >
                <X size={19} />
              </button>
            </div>

            <div className="space-y-4">
              <label className="block text-sm font-medium text-slate-700">
                Mascota
                <select
                  required
                  value={mascotaNuevaId}
                  onChange={(e) => setMascotaNuevaId(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-slate-200 p-3"
                >
                  <option value="">Selecciona una mascota</option>
                  {pets.map((pet) => (
                    <option key={pet.id} value={pet.id}>
                      {pet.nombre}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block text-sm font-medium text-slate-700">
                Título
                <input
                  required
                  maxLength={150}
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  placeholder="Ej. Control veterinario"
                  className="mt-2 w-full rounded-xl border border-slate-200 p-3"
                />
              </label>

              <label className="block text-sm font-medium text-slate-700">
                Tipo de cuidado
                <select
                  value={tipo}
                  onChange={(e) =>
                    setTipo(e.target.value as RecordatorioTipo)
                  }
                  className="mt-2 w-full rounded-xl border border-slate-200 p-3"
                >
                  {TIPOS.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm font-medium text-slate-700">
                  Fecha
                  <input
                    required
                    type="date"
                    value={fecha}
                    onChange={(e) => setFecha(e.target.value)}
                    min={hoy}
                    className="mt-2 w-full rounded-xl border border-slate-200 p-3"
                  />
                </label>

                <label className="block text-sm font-medium text-slate-700">
                  Hora
                  <input
                    required
                    type="time"
                    value={hora}
                    onChange={(e) => setHora(e.target.value)}
                    className="mt-2 w-full rounded-xl border border-slate-200 p-3"
                  />
                </label>
              </div>

              <label className="block text-sm font-medium text-slate-700">
                Descripción (opcional)
                <textarea
                  rows={3}
                  maxLength={2000}
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  placeholder="Detalles del cuidado..."
                  className="mt-2 w-full rounded-xl border border-slate-200 p-3"
                />
              </label>
            </div>

            {error && (
              <p role="alert" className="mt-4 text-sm text-red-600">
                {error}
              </p>
            )}

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setMostrarFormulario(false)}
                disabled={guardando}
                className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700"
              >
                Volver
              </button>
              <button
                type="submit"
                disabled={guardando || pets.length === 0}
                className="rounded-xl bg-[#173d32] px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-900 disabled:opacity-50"
              >
                {guardando ? "Guardando..." : "Guardar recordatorio"}
              </button>
            </div>
          </form>
        </div>
      )}

      {pets.length === 0 && (
        <p className="mt-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-900">
          Primero registra una mascota para crear su calendario de salud.
        </p>
      )}
    </section>
  );
}
