"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { apiFetch } from "../../lib/api";
import {
  authService,
  type User,
  type UserRole,
} from "../../services/auth.service";
import {
  petsService,
  type Pet,
  type UpdatePetInput,
} from "../../services/pets.service";

import DashboardLayout from "../../components/dashboard/DashboardLayout";
import DashboardSidebar from "../../components/dashboard/DashboardSidebar";
import DashboardHeader from "../../components/dashboard/DashboardHeader";
import DashboardContent from "../../components/dashboard/DashboardContent";
import PetFormModal from "../../components/dashboard/PetFormModal";
import EditPetModal, {
  type PetHealthUpdate,
} from "../../components/dashboard/EditPetModal";

type ProviderProfile = {
  nombre_comercial: string;
  descripcion: string | null;
  telefono_contacto: string | null;
  ciudad: string | null;
  direccion: string | null;
  sitio_web: string | null;
  estado_proveedor: string;
  veterinaria?: {
    nombre_responsable: string;
    registro_profesional: string;
    horario_atencion: string | null;
    servicios_clinicos: string | null;
  } | null;
  empresa?: {
    identificacion_tributaria: string;
    categoria_comercial: string | null;
  } | null;
};

type CurrentUser = {
  id: string;
  nombre: string;
  telefono: string | null;
  ciudad: string | null;
  direccion: string | null;
  cuenta: {
    correo: string;
    estado: string;
    rol: UserRole;
  };
  proveedor?: ProviderProfile | null;
};

type NewPetData = {
  nombre: string;
  especie: "PERRO" | "GATO";
  raza: string;
  pesoKg: number;
  fechaNacimiento: string;
  observaciones: string;
  esterilizada: boolean;
  enfermedadesAdquiridas: string;
};

type SaveProfileData = {
  nombre: string;
  telefono: string;
  ciudad: string;
  direccion: string;
};

const INITIAL_SECTIONS: Record<UserRole, string> = {
  PROPIETARIO: "catalogo",
  EMPRESA: "perfil-negocio",
  VETERINARIA: "perfil-negocio",
  ADMINISTRADOR: "administracion",
};

export default function DashboardPage() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [pets, setPets] = useState<Pet[]>([]);

  const [activeSection, setActiveSection] = useState("catalogo");
  const [loading, setLoading] = useState(true);
  const [savingPet, setSavingPet] = useState(false);
  const [savingPetHealth, setSavingPetHealth] = useState(false);

  const [showPetForm, setShowPetForm] = useState(false);
  const [editingPet, setEditingPet] = useState<Pet | null>(null);
  const [error, setError] = useState("");

  // Actualizar el perfil local con la respuesta del backend.
  const refreshCurrentUser = useCallback(
    async (activeToken: string): Promise<CurrentUser> => {
      const me = await apiFetch<CurrentUser>("/auth/me", {
        headers: {
          Authorization: `Bearer ${activeToken}`,
        },
      });

      setCurrentUser(me);

      setUser({
        id: me.id,
        nombre: me.nombre,
        correo: me.cuenta.correo,
        rol: me.cuenta.rol,
      });

      return me;
    },
    [],
  );

  // Inicializar sesión, usuario y mascotas.
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

        const role = me.cuenta.rol;

        setToken(savedToken);
        setCurrentUser(me);

        setUser({
          id: me.id,
          nombre: me.nombre,
          correo: me.cuenta.correo,
          rol: role,
        });

        setActiveSection(INITIAL_SECTIONS[role]);

        if (role === "PROPIETARIO") {
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

  // Navegar entre las secciones del dashboard.
  const handleSectionChange = useCallback((section: string) => {
    setActiveSection(section);
    setError("");
  }, []);

  // Abrir el formulario de registro de mascota.
  const handleAddPet = useCallback(() => {
    if (user?.rol !== "PROPIETARIO") return;

    setError("");
    setShowPetForm(true);
  }, [user?.rol]);

  const handleClosePetForm = useCallback(() => {
    if (savingPet) return;

    setShowPetForm(false);
    setError("");
  }, [savingPet]);

  // Registrar una mascota.
  async function handleSavePet(data: NewPetData): Promise<void> {
    if (user?.rol !== "PROPIETARIO") {
      setError("Solo un propietario puede registrar mascotas.");
      return;
    }

    if (!token) {
      authService.logout();
      router.replace("/login");
      return;
    }

    setSavingPet(true);
    setError("");

    try {
      const newPet = await petsService.create(data);

      setPets((previous) => [
        newPet,
        ...previous.filter((pet) => pet.id !== newPet.id),
      ]);

      setShowPetForm(false);
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

  // Abrir la edición de una mascota.
  const handleEditPet = useCallback((pet: Pet) => {
    setError("");
    setEditingPet(pet);
  }, []);

  // Actualizar los datos de salud y esterilización de una mascota.
  const handleSavePetHealth = useCallback(
    async (data: PetHealthUpdate): Promise<void> => {
      if (!editingPet) {
        throw new Error("No hay una mascota seleccionada.");
      }

      if (user?.rol !== "PROPIETARIO") {
        throw new Error("Solo un propietario puede editar sus mascotas.");
      }

      if (!token) {
        authService.logout();
        router.replace("/login");
        throw new Error("Tu sesión ha expirado. Inicia sesión nuevamente.");
      }

      setSavingPetHealth(true);
      setError("");

      try {
        const pesoKg = Number(data.pesoKg);

        if (!Number.isFinite(pesoKg) || pesoKg <= 0 || pesoKg > 500) {
          throw new Error(
            "El peso debe ser mayor que 0 y no superar los 500 kg.",
          );
        }

        const input: UpdatePetInput = {
          pesoKg,
          observaciones: data.observaciones.trim(),
          enfermedadesAdquiridas: data.enfermedadesAdquiridas.trim(),
          esterilizada: data.esterilizada,
        };

        const updatedPet = await petsService.update(editingPet.id, input);

        setPets((previous) =>
          previous.map((pet) => (pet.id === updatedPet.id ? updatedPet : pet)),
        );

        setEditingPet(null);
      } catch (err) {
        throw new Error(
          err instanceof Error
            ? err.message
            : "No fue posible actualizar los datos de salud.",
        );
      } finally {
        setSavingPetHealth(false);
      }
    },
    [editingPet, token, user?.rol, router],
  );

  // Guardar el perfil personal.
  const handleSaveProfile = useCallback(
    async (data: SaveProfileData): Promise<void> => {
      if (!token) {
        throw new Error("Tu sesión ha expirado. Inicia sesión nuevamente.");
      }

      setError("");

      try {
        await authService.updateProfile({
          nombre: data.nombre.trim(),
          telefono: data.telefono.trim(),
          ciudad: data.ciudad.trim(),
          direccion: data.direccion.trim(),
        });

        await refreshCurrentUser(token);
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "No fue posible actualizar tu perfil.";

        setError(message);
        throw err instanceof Error ? err : new Error(message);
      }
    },
    [token, refreshCurrentUser],
  );

  // Cambiar correo electrónico con validación en el backend.
  const handleChangeEmail = useCallback(
    async (email: string, contrasenaActual: string): Promise<void> => {
      if (!token) {
        throw new Error("Tu sesión ha expirado. Inicia sesión nuevamente.");
      }

      setError("");

      try {
        await authService.changeEmail({
          correo: email.trim().toLowerCase(),
          contrasenaActual,
        });

        await refreshCurrentUser(token);
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "No fue posible cambiar el correo electrónico.";

        setError(message);
        throw err instanceof Error ? err : new Error(message);
      }
    },
    [token, refreshCurrentUser],
  );

  // Cambiar la contraseña.
  const handleChangePassword = useCallback(
    async (
      contrasenaActual: string,
      nuevaContrasena: string,
    ): Promise<void> => {
      if (!token) {
        throw new Error("Tu sesión ha expirado. Inicia sesión nuevamente.");
      }

      setError("");

      try {
        await authService.changePassword({
          contrasenaActual,
          nuevaContrasena,
        });
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "No fue posible cambiar la contraseña.";

        setError(message);
        throw err instanceof Error ? err : new Error(message);
      }
    },
    [token],
  );

  // Solicitar instrucciones para restablecer la contraseña.
  const handleRequestPasswordReset = useCallback(async (): Promise<void> => {
    const email = user?.correo;

    if (!email) {
      throw new Error("No se encontró el correo de tu cuenta.");
    }

    setError("");

    try {
      await authService.forgotPassword(email);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "No fue posible solicitar la recuperación de contraseña.";

      setError(message);
      throw err instanceof Error ? err : new Error(message);
    }
  }, [user?.correo]);

  // Cerrar sesión.
  const handleLogout = useCallback(() => {
    authService.logout();

    setUser(null);
    setCurrentUser(null);
    setToken(null);
    setPets([]);
    setShowPetForm(false);
    setEditingPet(null);
    setError("");

    router.replace("/");
  }, [router]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f8faf8]">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-emerald-100 border-t-emerald-700" />

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
      <main className="flex min-h-screen items-center justify-center bg-[#f8faf8]">
        <p className="text-slate-500">Redirigiendo al inicio de sesión...</p>
      </main>
    );
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-[#f8faf8] lg:flex">
        <DashboardSidebar
          role={user.rol}
          activeSection={activeSection}
          onSectionChange={handleSectionChange}
        />

        <div className="min-w-0 flex-1">
          <DashboardHeader
            name={user.nombre || "Bienvenido"}
            email={user.correo}
            role={user.rol}
            onLogout={handleLogout}
          />

          <main className="mx-auto max-w-7xl p-5 sm:p-8 lg:p-10">
            <div className="mb-7">
              <p className="mb-2 text-sm font-medium text-emerald-700">
                {user.rol === "PROPIETARIO"
                  ? "TU ESPACIO DE BIENESTAR"
                  : user.rol === "EMPRESA"
                    ? "PANEL COMERCIAL"
                    : user.rol === "VETERINARIA"
                      ? "PANEL PROFESIONAL"
                      : "ADMINISTRACIÓN"}
              </p>

              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                Hola, {user.nombre || "bienvenido"} 👋
              </h1>

              <p className="mt-2 text-slate-500">
                {user.rol === "PROPIETARIO"
                  ? "Administra los cuidados y servicios para tus mascotas."
                  : user.rol === "EMPRESA"
                    ? "Gestiona los productos y servicios de tu negocio."
                    : user.rol === "VETERINARIA"
                      ? "Gestiona tus servicios veterinarios y citas."
                      : "Administra usuarios y recursos de la plataforma."}
              </p>
            </div>

            {error && (
              <div
                role="alert"
                className="mb-6 flex items-start justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
              >
                <p>{error}</p>

                <button
                  type="button"
                  onClick={() => setError("")}
                  className="font-semibold"
                  aria-label="Cerrar mensaje"
                >
                  ✕
                </button>
              </div>
            )}

            <DashboardContent
              role={user.rol}
              pets={pets}
              token={token}
              activeSection={activeSection}
              onAddPet={handleAddPet}
              currentUser={
                currentUser
                  ? {
                      id: currentUser.id,
                      nombre: currentUser.nombre,
                      telefono: currentUser.telefono,
                      ciudad: currentUser.ciudad,
                      direccion: currentUser.direccion,
                      correo: currentUser.cuenta.correo,
                    }
                  : null
              }
              onEditPet={handleEditPet}
              onSaveProfile={handleSaveProfile}
              onChangeEmail={handleChangeEmail}
              onChangePassword={handleChangePassword}
              onRequestPasswordReset={handleRequestPasswordReset}
            />

            <p className="mt-8 text-center text-xs text-slate-400">
              MyPetCo · Cuidamos a quienes hacen especial tu vida.
            </p>
          </main>
        </div>

        {showPetForm && user.rol === "PROPIETARIO" && (
          <PetFormModal
            saving={savingPet}
            onClose={handleClosePetForm}
            onSubmit={handleSavePet}
          />
        )}

        {editingPet && user.rol === "PROPIETARIO" && (
          <EditPetModal
            pet={editingPet}
            saving={savingPetHealth}
            onClose={() => {
              if (!savingPetHealth) {
                setEditingPet(null);
              }
            }}
            onSubmit={handleSavePetHealth}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
