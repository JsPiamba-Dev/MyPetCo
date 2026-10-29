"use client";

import { LogOut, PawPrint } from "lucide-react";
import type { UserRole } from "../../services/auth.service";

type Props = {
  name: string;
  email: string;
  role: UserRole;
  onLogout: () => void;
};

const ROLE_LABELS: Record<UserRole, string> = {
  PROPIETARIO: "Propietario de mascota",
  EMPRESA: "Empresa",
  VETERINARIA: "Veterinaria",
  ADMINISTRADOR: "Administrador",
};

export default function DashboardHeader({
  name,
  email,
  role,
  onLogout,
}: Props) {
  return (
    <header className="flex items-center justify-between gap-4 border-b border-slate-100 bg-white px-5 py-4 sm:px-8">
      <div className="flex items-center gap-3 lg:hidden">
        <PawPrint className="text-emerald-700" size={24} />
        <span className="text-lg font-bold">MyPetCo</span>
      </div>

      <div className="hidden sm:block">
        <p className="text-sm text-slate-500">Tu espacio de bienestar</p>
        <p className="font-semibold">Panel principal</p>
      </div>

      <div className="ml-auto flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 font-semibold text-emerald-900">
          {(name || "U").slice(0, 1).toUpperCase()}
        </div>

        <div className="hidden min-w-0 sm:block">
          <p className="max-w-48 truncate text-sm font-semibold">{name}</p>
          <p className="max-w-48 truncate text-xs text-slate-500">{email}</p>
          <p className="mt-1 text-xs font-medium text-emerald-800">
            {ROLE_LABELS[role]}
          </p>
        </div>

        <button
          type="button"
          onClick={onLogout}
          title="Cerrar sesión"
          aria-label="Cerrar sesión"
          className="rounded-xl p-2.5 text-slate-500 transition hover:bg-red-50 hover:text-red-700"
        >
          <LogOut size={19} />
        </button>
      </div>
    </header>
  );
}
