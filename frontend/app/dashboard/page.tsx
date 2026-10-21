"use client";

import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  Activity,
  CalendarDays,
  Cat,
  Check,
  ChevronRight,
  Dog,
  Heart,
  LogOut,
  PawPrint,
  Plus,
  Sparkles,
  Syringe,
  X,
} from "lucide-react";

import { apiFetch } from "../../lib/api";
import { authService, type User } from "../../services/auth.service";
import { petsService, type Pet } from "../../services/pets.service";

type CurrentUser = {
  id: string;
  nombre: string;
  telefono: string | null;
  ciudad: string | null;
  direccion: string | null;
  cuenta: {
    correo: string;
    estado: string;
  };
};

const MAX_PET_AGE_YEARS = 30;

function getTodayLocalDate(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function parseLocalDate(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return date;
}

function calculatePetAge(birthDate: string): {
  years: number;
  months: number;
  totalMonths: number;
} | null {
  const birth = parseLocalDate(birthDate);

  if (!birth) return null;

  const today = new Date();

  if (birth > today) return null;

  let years = today.getFullYear() - birth.getFullYear();
  let months = today.getMonth() - birth.getMonth();

  if (today.getDate() < birth.getDate()) {
    months--;
  }

  if (months < 0) {
    years--;
    months += 12;
  }

  const totalMonths = years * 12 + months;

  return {
    years,
    months,
    totalMonths,
  };
}

function formatPetAge(birthDate?: string | null): string {
  if (!birthDate) return "Fecha de nacimiento no registrada";

  const age = calculatePetAge(birthDate);

  if (!age) return "Fecha de nacimiento inválida";

  if (age.totalMonths === 0) {
    return "Menos de 1 mes";
  }

  if (age.years === 0) {
    return `${age.months} ${age.months === 1 ? "mes" : "meses"}`;
  }

  if (age.months === 0) {
    return `${age.years} ${age.years === 1 ? "año" : "años"}`;
  }

  return `${age.years} ${age.years === 1 ? "año" : "años"} y ${
    age.months
  } ${age.months === 1 ? "mes" : "meses"}`;
}

function isOlderThanMaximumAge(birthDate: string): boolean {
  const birth = parseLocalDate(birthDate);

  if (!birth) return true;

  const today = new Date();
  const oldestAllowed = new Date(
    today.getFullYear() - MAX_PET_AGE_YEARS,
    today.getMonth(),
    today.getDate(),
  );

  // Ajuste para el 29 de febrero en años no bisiestos.
  if (oldestAllowed.getMonth() !== today.getMonth() && today.getDate() > 28) {
    oldestAllowed.setDate(0);
  }

  return birth < oldestAllowed;
}

export default function DashboardPage() {
  const router = useRouter();

  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showPetForm, setShowPetForm] = useState(false);
  const [savingPet, setSavingPet] = useState(false);

  const [petName, setPetName] = useState("");
  const [species, setSpecies] = useState<"PERRO" | "GATO">("PERRO");
  const [breed, setBreed] = useState("");
  const [weight, setWeight] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [observations, setObservations] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function initialize() {
      const savedToken = authService.getToken();

      if (!savedToken) {
        router.replace("/login");
        setLoading(false);
        return;
      }

      try {
        const me = await apiFetch<CurrentUser>("/auth/me", {
          headers: {
            Authorization: `Bearer ${savedToken}`,
          },
        });

        if (cancelled) return;

        setToken(savedToken);
        setUser({
          id: me.id,
          nombre: me.nombre,
          correo: me.cuenta.correo,
        });

        try {
          const list = await petsService.list();

          if (!cancelled) {
            setPets(list);
          }
        } catch (err) {
          if (!cancelled) {
            setError(
              err instanceof Error
                ? `No se pudieron cargar las mascotas: ${err.message}`
                : "No se pudieron cargar las mascotas.",
            );
          }
        }
      } catch {
        if (cancelled) return;

        authService.logout();
        router.replace("/login");
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void initialize();

    return () => {
      cancelled = true;
    };
  }, [router]);

  function logout() {
    // Eliminar el token y cerrar la sesión.
    authService.logout();

    // Limpiar los datos del dashboard.
    setToken(null);
    setUser(null);
    setPets([]);
    setError("");

    // Volver a la página de inicio.
    router.replace("/");
  }

  function resetPetForm() {
    setPetName("");
    setSpecies("PERRO");
    setBreed("");
    setWeight("");
    setBirthDate("");
    setObservations("");
  }

  function openPetForm() {
    setError("");
    setShowPetForm(true);
  }

  function closePetForm() {
    if (savingPet) return;

    setShowPetForm(false);
    resetPetForm();
  }

  async function addPet(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    if (!token) {
      authService.logout();
      router.replace("/login");
      return;
    }

    const nombre = petName.trim();
    const raza = breed.trim();
    const observacionesLimpias = observations.trim();

    if (
      !nombre ||
      !raza ||
      !weight.trim() ||
      !birthDate ||
      !observacionesLimpias
    ) {
      setError("Todos los campos son obligatorios.");
      return;
    }

    const birth = parseLocalDate(birthDate);
    const today = parseLocalDate(getTodayLocalDate());

    if (!birth || !today) {
      setError("Ingresa una fecha de nacimiento válida.");
      return;
    }

    if (birth > today) {
      setError("La fecha de nacimiento no puede estar en el futuro.");
      return;
    }

    if (isOlderThanMaximumAge(birthDate)) {
      setError("La mascota no puede tener más de 30 años.");
      return;
    }

    const numericWeight = Number(weight);

    if (
      !Number.isFinite(numericWeight) ||
      numericWeight <= 0 ||
      numericWeight > 500
    ) {
      setError("El peso debe ser mayor que 0 y no superar los 500 kg.");
      return;
    }

    setSavingPet(true);

    try {
      const nuevaMascota = await petsService.create({
        nombre,
        especie: species,
        raza,
        pesoKg: numericWeight,
        fechaNacimiento: birthDate,
        observaciones: observacionesLimpias,
      });

      setPets((previous) => [nuevaMascota, ...previous]);
      setShowPetForm(false);
      resetPetForm();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No fue posible registrar la mascota.",
      );
    } finally {
      setSavingPet(false);
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7faf7]">
        <div className="text-center">
          <PawPrint
            className="mx-auto mb-4 animate-pulse text-emerald-700"
            size={36}
          />
          <p className="font-medium text-slate-700">Verificando tu sesión...</p>
          <p className="mt-2 text-sm text-slate-500">
            Preparando tu espacio MyPetCo.
          </p>
        </div>
      </main>
    );
  }

  if (!user || !token) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7faf7]">
        <p className="text-slate-500">Redirigiendo al inicio de sesión...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f8faf8] lg:flex">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-slate-100 bg-white p-6 lg:flex">
        <div className="mb-12 flex items-center gap-3">
          <div className="rounded-xl bg-emerald-100 p-2.5 text-emerald-800">
            <PawPrint size={23} />
          </div>
          <span className="text-xl font-bold text-slate-900">MyPetCo</span>
        </div>

        <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-widest text-slate-400">
          Mi espacio
        </p>

        <div className="flex items-center gap-3 rounded-xl bg-emerald-50 px-3 py-3 font-semibold text-emerald-900">
          <Activity size={19} />
          Resumen
        </div>

        <a
          href="#mascotas"
          className="mt-2 flex items-center gap-3 rounded-xl px-3 py-3 text-slate-500 transition hover:bg-slate-50 hover:text-emerald-800"
        >
          <PawPrint size={19} />
          Mis mascotas
        </a>

        <div className="mt-2 flex items-center gap-3 rounded-xl px-3 py-3 text-slate-500">
          <CalendarDays size={19} />
          Calendario de salud
        </div>

        <div className="mt-2 flex items-center gap-3 rounded-xl px-3 py-3 text-slate-500">
          <Syringe size={19} />
          Vacunación
        </div>

        <div className="mt-auto rounded-2xl bg-[#173d32] p-4 text-white">
          <Heart size={20} className="mb-3 text-emerald-300" />
          <p className="font-semibold">Cuidarlos es quererlos.</p>
          <p className="mt-1 text-sm text-white/65">
            Cada pequeño cuidado cuenta.
          </p>
        </div>
      </aside>

      <section className="min-w-0 flex-1">
        <header className="flex items-center justify-between border-b border-slate-100 bg-white px-5 py-4 sm:px-8 lg:px-10">
          <div className="flex items-center gap-3 lg:hidden">
            <PawPrint className="text-emerald-700" />
            <span className="text-lg font-bold">MyPetCo</span>
          </div>

          <div className="hidden sm:block">
            <p className="text-sm text-slate-500">Tu espacio de bienestar</p>
            <p className="font-semibold">Panel principal</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 font-semibold text-emerald-900">
              {user.nombre.slice(0, 1).toUpperCase()}
            </div>

            <div className="hidden sm:block">
              <p className="text-sm font-semibold">{user.nombre}</p>
              <p className="text-xs text-slate-500">{user.correo}</p>
            </div>

            <button
              type="button"
              onClick={logout}
              title="Cerrar sesión"
              aria-label="Cerrar sesión"
              className="rounded-xl p-2 text-slate-500 transition hover:bg-red-50 hover:text-red-700"
            >
              <LogOut size={18} />
            </button>
          </div>
        </header>

        <div className="mx-auto max-w-7xl p-5 sm:p-8 lg:p-10">
          <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="mb-2 text-sm font-medium text-emerald-700">
                TU ESPACIO DE BIENESTAR
              </p>
              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                Hola, {user.nombre.split(" ")[0]} 👋
              </h1>
              <p className="mt-2 text-slate-500">
                Así va el bienestar de tu familia peluda.
              </p>
            </div>

            <button
              type="button"
              onClick={openPetForm}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#173d32] px-5 py-3.5 font-semibold text-white transition hover:bg-emerald-900"
            >
              <Plus size={18} />
              Añadir mascota
            </button>
          </div>

          {error && (
            <div
              role="alert"
              className="mb-5 flex items-start justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
            >
              <p className="break-words">{error}</p>
              <button
                type="button"
                onClick={() => setError("")}
                aria-label="Cerrar mensaje"
              >
                <X size={16} />
              </button>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <Stat
              icon={<PawPrint />}
              label="Mis mascotas"
              value={String(pets.length)}
              note="Compañeros registrados"
            />
            <Stat
              icon={<Syringe />}
              label="Vacunas registradas"
              value="—"
              note="Mantén su esquema al día"
            />
            <Stat
              icon={<CalendarDays />}
              label="Próximos cuidados"
              value="—"
              note="Organiza tus recordatorios"
            />
          </div>

          <div className="mt-9 grid gap-6 xl:grid-cols-[1.5fr_1fr]">
            <section
              id="mascotas"
              className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:p-7"
            >
              <div className="mb-6 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold">Mis mascotas</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Sus perfiles, siempre a mano.
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-800">
                  {pets.length} registradas
                </span>
              </div>

              {pets.length > 0 ? (
                <div className="space-y-3">
                  {pets.map((pet) => (
                    <div
                      key={pet.id}
                      className="flex items-center gap-4 rounded-xl border border-slate-100 p-4 transition hover:border-emerald-200"
                    >
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-800">
                        {pet.especie === "GATO" ? (
                          <Cat size={27} />
                        ) : (
                          <Dog size={27} />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="font-semibold">{pet.nombre}</p>
                        <p className="mt-1 text-sm text-slate-500">
                          {pet.especie === "GATO" ? "Gato" : "Perro"}
                          {pet.raza ? ` · ${pet.raza}` : ""}
                          {pet.pesoKg != null && pet.pesoKg !== ""
                            ? ` · ${pet.pesoKg} kg`
                            : ""}
                        </p>
                        <p className="mt-1 text-xs text-emerald-700">
                          Edad: {formatPetAge(pet.fechaNacimiento)}
                        </p>
                      </div>

                      <ChevronRight className="text-slate-400" size={19} />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-200 px-6 py-10 text-center">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-800">
                    <PawPrint size={26} />
                  </div>
                  <p className="font-semibold">Tu historia empieza aquí</p>
                  <p className="mx-auto mt-2 max-w-xs text-sm leading-6 text-slate-500">
                    Registra tu primera mascota para empezar a organizar su
                    bienestar.
                  </p>
                  <button
                    type="button"
                    onClick={openPetForm}
                    className="mt-5 inline-flex items-center gap-2 font-semibold text-emerald-800 hover:underline"
                  >
                    Registrar mascota <Plus size={16} />
                  </button>
                </div>
              )}
            </section>

            <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:p-7">
              <div className="mb-5 flex items-center gap-3">
                <div className="rounded-xl bg-amber-50 p-3 text-amber-700">
                  <CalendarDays size={21} />
                </div>
                <div>
                  <h2 className="font-semibold">Rutina de bienestar</h2>
                  <p className="text-sm text-slate-500">
                    Pequeños hábitos, gran diferencia.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {[
                  ["Agua fresca", "Renueva su agua varias veces al día."],
                  ["Movimiento diario", "Adapta el paseo a su edad y energía."],
                  [
                    "Chequeo preventivo",
                    "Consulta con su veterinario las fechas importantes.",
                  ],
                ].map(([title, desc]) => (
                  <div key={title} className="flex gap-3">
                    <div className="mt-0.5 rounded-full bg-emerald-50 p-1.5 text-emerald-700">
                      <Check size={14} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{title}</p>
                      <p className="mt-1 text-sm leading-5 text-slate-500">
                        {desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 rounded-xl bg-[#f1f8f3] p-4">
                <div className="flex gap-2 text-emerald-800">
                  <Sparkles size={17} />
                  <p className="text-sm font-semibold">Un consejo para hoy</p>
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Un registro actualizado ayuda a llevar un mejor seguimiento de
                  su salud.
                </p>
              </div>
            </section>
          </div>

          <p className="mt-8 text-center text-xs text-slate-400">
            MyPetCo · Cuidamos a quienes hacen especial tu vida.
          </p>
        </div>
      </section>

      {showPetForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/40 p-4 backdrop-blur-sm"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget && !savingPet) {
              closePetForm();
            }
          }}
        >
          <form
            onSubmit={addPet}
            className="my-auto w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl sm:p-8"
          >
            <div className="mb-6 flex items-start justify-between">
              <div>
                <p className="text-sm font-semibold text-emerald-700">
                  NUEVO PERFIL
                </p>
                <h2 className="mt-1 text-2xl font-semibold">Añadir mascota</h2>
                <p className="mt-2 text-sm text-slate-500">
                  Todos los campos son obligatorios.
                </p>
              </div>

              <button
                type="button"
                disabled={savingPet}
                onClick={closePetForm}
                aria-label="Cerrar formulario"
                className="rounded-xl p-2 hover:bg-slate-100 disabled:opacity-50"
              >
                <X />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label
                  htmlFor="pet-name"
                  className="mb-2 block text-sm font-medium"
                >
                  Nombre *
                </label>
                <input
                  id="pet-name"
                  required
                  maxLength={100}
                  value={petName}
                  onChange={(e) => setPetName(e.target.value)}
                  placeholder="Ej. Luna"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label
                  htmlFor="pet-birth-date"
                  className="mb-2 block text-sm font-medium"
                >
                  Fecha de nacimiento *
                </label>
                <input
                  id="pet-birth-date"
                  type="date"
                  required
                  max={getTodayLocalDate()}
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-600"
                />
                <p className="mt-1 text-xs text-slate-500">
                  La edad se calculará automáticamente. Máximo permitido: 30
                  años.
                </p>
                {birthDate && parseLocalDate(birthDate) && (
                  <p className="mt-1 text-sm font-medium text-emerald-700">
                    Edad: {formatPetAge(birthDate)}
                  </p>
                )}
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Especie *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {(["PERRO", "GATO"] as const).map((s) => (
                    <button
                      type="button"
                      key={s}
                      onClick={() => setSpecies(s)}
                      aria-pressed={species === s}
                      className={`flex items-center justify-center gap-2 rounded-xl border p-3 font-medium transition ${
                        species === s
                          ? "border-emerald-700 bg-emerald-50 text-emerald-900"
                          : "border-slate-200 text-slate-500 hover:border-emerald-300"
                      }`}
                    >
                      {s === "PERRO" ? <Dog size={18} /> : <Cat size={18} />}
                      {s === "PERRO" ? "Perro" : "Gato"}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label
                  htmlFor="pet-breed"
                  className="mb-2 block text-sm font-medium"
                >
                  Raza *
                </label>
                <input
                  id="pet-breed"
                  required
                  maxLength={100}
                  value={breed}
                  onChange={(e) => setBreed(e.target.value)}
                  placeholder="Ej. Criollo"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label
                  htmlFor="pet-weight"
                  className="mb-2 block text-sm font-medium"
                >
                  Peso en kg *
                </label>
                <input
                  id="pet-weight"
                  type="number"
                  required
                  min="0.1"
                  max="500"
                  step="0.1"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder="Ej. 8.5"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label
                  htmlFor="pet-observations"
                  className="mb-2 block text-sm font-medium"
                >
                  Observaciones *
                </label>
                <textarea
                  id="pet-observations"
                  required
                  maxLength={1000}
                  value={observations}
                  onChange={(e) => setObservations(e.target.value)}
                  placeholder="Alergias, cuidados especiales u otra información relevante"
                  rows={3}
                  className="w-full resize-y rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-600"
                />
              </div>
            </div>

            <div className="mt-7 flex gap-3">
              <button
                type="button"
                disabled={savingPet}
                onClick={closePetForm}
                className="flex-1 rounded-xl border border-slate-200 px-4 py-3 font-semibold disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={savingPet}
                className="flex-1 rounded-xl bg-[#173d32] px-4 py-3 font-semibold text-white disabled:opacity-60"
              >
                {savingPet ? "Guardando..." : "Guardar mascota"}
              </button>
            </div>
          </form>
        </div>
      )}
    </main>
  );
}

function Stat({
  icon,
  label,
  value,
  note,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  note: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-sm text-slate-500">{label}</span>
        <span className="rounded-xl bg-emerald-50 p-2.5 text-emerald-800">
          {icon}
        </span>
      </div>
      <p className="mt-4 text-3xl font-semibold tracking-tight">{value}</p>
      <p className="mt-1 text-sm text-slate-500">{note}</p>
    </div>
  );
}
