"use client";

import { Cat, Dog, PawPrint, Plus, Pencil } from "lucide-react";

import type { UserRole } from "../../services/auth.service";
import type { Pet } from "../../services/pets.service";

import CatalogoProveedores from "../propietario/catalogo-proveedores";
import Vacunacion from "../propietario/vacunacion";
import CalendarioSalud from "../propietario/calendario-salud";
import SolicitarCita from "../propietario/solicitar-cita";
import MisCitas from "../propietario/mis-citas";

import PublicarProducto from "../empresa/publicar-producto";
import PublicarServicioEmpresa from "../empresa/publicar-servicio";

import PublicarServicioVeterinaria from "../veterinaria/publicar-servicio";
import GestionarCitas from "../veterinaria/gestionar-citas";

import PanelAdministracion from "../admin/panel-administracion";

import SectionHeading from "./SectionHeading";
import Stat from "./Stat";
import UserProfileSettings from "./UserProfileSettings";

type ProfileData = {
  id: string;
  nombre: string;
  telefono?: string | null;
  ciudad?: string | null;
  direccion?: string | null;
  correo: string;
};

type SaveProfileData = {
  nombre: string;
  telefono: string;
  ciudad: string;
  direccion: string;
};

type Props = {
  role: UserRole;
  pets: Pet[];
  token: string;
  activeSection: string;
  onAddPet: () => void;
  currentUser?: ProfileData | null;
  onEditPet?: (pet: Pet) => void;

  onSaveProfile?: (data: SaveProfileData) => Promise<void>;

  onChangeEmail?: (email: string, contrasenaActual: string) => Promise<void>;

  onChangePassword?: (
    contrasenaActual: string,
    nuevaContrasena: string,
  ) => Promise<void>;

  onRequestPasswordReset?: () => Promise<void>;
};

function Placeholder({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
      <SectionHeading title={title} description={description} />

      <p className="text-sm text-slate-500">
        Este módulo necesita conectarse a su servicio correspondiente para
        mostrar y administrar datos reales.
      </p>
    </section>
  );
}

export default function DashboardContent({
  role,
  pets,
  token,
  activeSection,
  onAddPet,
  currentUser,
  onEditPet,
  onSaveProfile,
  onChangeEmail,
  onChangePassword,
  onRequestPasswordReset,
}: Props) {
  // Perfil y seguridad disponibles para todos los roles.
  if (activeSection === "editar-perfil" || activeSection === "configuracion") {
    return (
      <UserProfileSettings
        initialProfile={currentUser ?? undefined}
        onSaveProfile={onSaveProfile}
        onChangeEmail={onChangeEmail}
        onChangePassword={onChangePassword}
        onRequestPasswordReset={onRequestPasswordReset}
      />
    );
  }

  // Secciones del propietario de mascotas.
  if (role === "PROPIETARIO") {
    switch (activeSection) {
      case "catalogo":
        return <CatalogoProveedores />;

      case "mascotas":
        return (
          <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:p-7">
            <SectionHeading
              title="Mis mascotas"
              description="Consulta y actualiza sus perfiles."
              action={
                <button
                  type="button"
                  onClick={onAddPet}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#173d32] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#245545]"
                >
                  <Plus size={17} />
                  Añadir mascota
                </button>
              }
            />

            <div className="mb-6 grid gap-4 sm:grid-cols-2">
              <Stat
                icon={<PawPrint />}
                label="Mascotas registradas"
                value={pets.length}
                note="Tus compañeros"
              />

              <Stat
                icon={<PawPrint />}
                label="Perfiles editables"
                value={pets.length}
                note="Peso, observaciones y salud"
              />
            </div>

            {pets.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center">
                <PawPrint className="mx-auto mb-3 text-slate-400" size={32} />

                <p className="font-semibold">Todavía no tienes mascotas</p>

                <p className="mt-2 text-sm text-slate-500">
                  Registra una mascota para administrar sus datos.
                </p>

                <button
                  type="button"
                  onClick={onAddPet}
                  className="mt-4 rounded-xl bg-[#173d32] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#245545]"
                >
                  Registrar mascota
                </button>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {pets.map((pet) => (
                  <article
                    key={pet.id}
                    className="rounded-xl border border-slate-100 p-4 transition hover:border-slate-200 hover:shadow-sm"
                  >
                    <div className="mb-4 flex items-center gap-3">
                      <div className="rounded-xl bg-emerald-50 p-3 text-emerald-800">
                        {pet.especie === "GATO" ? (
                          <Cat size={23} />
                        ) : (
                          <Dog size={23} />
                        )}
                      </div>

                      <div className="min-w-0">
                        <h3 className="truncate font-semibold">{pet.nombre}</h3>

                        <p className="text-sm text-slate-500">
                          {pet.especie}
                          {pet.raza ? ` · ${pet.raza}` : ""}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2 text-sm text-slate-600">
                      <p>
                        <span className="font-medium">Peso:</span>{" "}
                        {pet.pesoKg != null && pet.pesoKg !== ""
                          ? `${pet.pesoKg} kg`
                          : "No registrado"}
                      </p>

                      <p className="break-words">
                        <span className="font-medium">Observaciones:</span>{" "}
                        {pet.observaciones || "Sin observaciones"}
                      </p>
                    </div>

                    <button
                      type="button"
                      disabled={!onEditPet}
                      onClick={() => onEditPet?.(pet)}
                      className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Pencil size={16} />
                      Editar datos de salud
                    </button>
                  </article>
                ))}
              </div>
            )}
          </section>
        );

      case "vacunacion":
        return <Vacunacion pets={pets} token={token} />;

      case "calendario-salud":
        return <CalendarioSalud pets={pets} />;

      case "solicitar-cita":
        return <SolicitarCita pets={pets} />;

      case "mis-citas":
        return <MisCitas />;

      default:
        return <CatalogoProveedores />;
    }
  }

  // Secciones de empresa.
  if (role === "EMPRESA") {
    switch (activeSection) {
      case "perfil-negocio":
        return (
          <Placeholder
            title="Perfil de empresa"
            description="Consulta los datos de tu establecimiento."
          />
        );

      case "publicar-producto":
        return <PublicarProducto />;

      case "publicar-servicio":
        return <PublicarServicioEmpresa />;

      case "mis-productos":
        return (
          <Placeholder
            title="Mis productos"
            description="Administra tus productos publicados."
          />
        );

      case "mis-servicios":
        return (
          <Placeholder
            title="Mis servicios"
            description="Administra los servicios de tu empresa."
          />
        );

      default:
        return <PublicarProducto />;
    }
  }

  // Secciones de veterinaria.
  if (role === "VETERINARIA") {
    switch (activeSection) {
      case "perfil-negocio":
        return (
          <Placeholder
            title="Perfil veterinario"
            description="Consulta los datos de tu establecimiento."
          />
        );

      case "publicar-servicio":
        return <PublicarServicioVeterinaria />;

      case "gestionar-citas":
        return <GestionarCitas />;

      case "mis-servicios":
        return (
          <Placeholder
            title="Mis servicios"
            description="Administra los servicios publicados."
          />
        );

      default:
        return <GestionarCitas />;
    }
  }

  // Secciones de administración.
  switch (activeSection) {
    case "administracion":
      return <PanelAdministracion />;

    case "usuarios":
      return (
        <Placeholder
          title="Usuarios"
          description="Administra las cuentas registradas en la plataforma."
        />
      );

    case "proveedores":
      return (
        <Placeholder
          title="Proveedores"
          description="Consulta y administra los proveedores."
        />
      );

    case "empresas":
      return (
        <Placeholder
          title="Empresas"
          description="Consulta y administra las empresas."
        />
      );

    case "veterinarias":
      return (
        <Placeholder
          title="Veterinarias"
          description="Consulta y administra las veterinarias."
        />
      );

    case "citas":
      return (
        <Placeholder
          title="Citas"
          description="Consulta y administra las citas de la plataforma."
        />
      );

    case "catalogo-admin":
      return (
        <Placeholder
          title="Catálogo administrativo"
          description="Administra las publicaciones del catálogo."
        />
      );

    default:
      return <PanelAdministracion />;
  }
}
