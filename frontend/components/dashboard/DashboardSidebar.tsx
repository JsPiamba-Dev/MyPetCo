"use client";

import {
  Activity,
  CalendarDays,
  ClipboardList,
  Heart,
  LayoutDashboard,
  Package,
  PawPrint,
  Settings,
  ShieldCheck,
  Stethoscope,
  Store,
  Syringe,
  UserRound,
  Users,
  type LucideIcon,
} from "lucide-react";

import type { UserRole } from "../../services/auth.service";

type MenuItem = {
  id: string;
  label: string;
  icon: LucideIcon;
};

type Props = {
  role: UserRole;
  activeSection: string;
  onSectionChange: (section: string) => void;
};

const MENUS: Record<UserRole, MenuItem[]> = {
  PROPIETARIO: [
    { id: "catalogo", label: "Catálogo", icon: Store },
    { id: "mascotas", label: "Mis mascotas", icon: PawPrint },
    { id: "vacunacion", label: "Vacunación", icon: Syringe },
    {
      id: "calendario-salud",
      label: "Calendario de salud",
      icon: CalendarDays,
    },
    { id: "solicitar-cita", label: "Solicitar cita", icon: Stethoscope },
    { id: "mis-citas", label: "Mis citas", icon: ClipboardList },
    { id: "editar-perfil", label: "Mi perfil", icon: UserRound },
    { id: "configuracion", label: "Configuración", icon: Settings },
  ],
  EMPRESA: [
    { id: "perfil-negocio", label: "Mi empresa", icon: Store },
    { id: "publicar-producto", label: "Publicar producto", icon: Package },
    { id: "mis-productos", label: "Mis productos", icon: ClipboardList },
    {
      id: "publicar-servicio",
      label: "Publicar servicio",
      icon: Activity,
    },
    { id: "mis-servicios", label: "Mis servicios", icon: ClipboardList },
    { id: "editar-perfil", label: "Mi perfil", icon: UserRound },
    { id: "configuracion", label: "Configuración", icon: Settings },
  ],
  VETERINARIA: [
    { id: "perfil-negocio", label: "Mi veterinaria", icon: Stethoscope },
    {
      id: "publicar-servicio",
      label: "Publicar servicio",
      icon: Activity,
    },
    { id: "mis-servicios", label: "Mis servicios", icon: ClipboardList },
    { id: "gestionar-citas", label: "Gestionar citas", icon: CalendarDays },
    { id: "editar-perfil", label: "Mi perfil", icon: UserRound },
    { id: "configuracion", label: "Configuración", icon: Settings },
  ],
  ADMINISTRADOR: [
    {
      id: "administracion",
      label: "Panel general",
      icon: LayoutDashboard,
    },
    { id: "usuarios", label: "Usuarios", icon: Users },
    { id: "proveedores", label: "Proveedores", icon: Store },
    { id: "empresas", label: "Empresas", icon: Package },
    { id: "veterinarias", label: "Veterinarias", icon: Stethoscope },
    { id: "citas", label: "Citas", icon: CalendarDays },
    {
      id: "catalogo-admin",
      label: "Catálogo",
      icon: ClipboardList,
    },
    { id: "editar-perfil", label: "Mi perfil", icon: UserRound },
    { id: "configuracion", label: "Configuración", icon: Settings },
  ],
};

const ROLE_LABELS: Record<UserRole, string> = {
  PROPIETARIO: "Propietario",
  EMPRESA: "Empresa",
  VETERINARIA: "Veterinaria",
  ADMINISTRADOR: "Administrador",
};

export default function DashboardSidebar({
  role,
  activeSection,
  onSectionChange,
}: Props) {
  const menu = MENUS[role] ?? MENUS.PROPIETARIO;

  return (
    <aside className="flex w-full shrink-0 flex-col border-b border-slate-100 bg-white p-4 lg:min-h-screen lg:w-64 lg:border-b-0 lg:border-r lg:p-6">
      <div className="mb-6 flex items-center gap-3 lg:mb-10">
        <div className="rounded-xl bg-emerald-100 p-2.5 text-emerald-800">
          <PawPrint size={24} />
        </div>
        <div>
          <p className="text-xl font-bold">MyPetCo</p>
          <p className="text-xs text-slate-500">{ROLE_LABELS[role]}</p>
        </div>
      </div>

      <p className="mb-3 px-2 text-xs font-semibold uppercase tracking-widest text-slate-400">
        Navegación
      </p>

      <nav
        aria-label="Navegación del dashboard"
        className="flex gap-2 overflow-x-auto pb-2 lg:flex-1 lg:flex-col lg:overflow-visible"
      >
        {menu.map(({ id, label, icon: Icon }) => {
          const selected = activeSection === id;

          return (
            <button
              key={id}
              type="button"
              onClick={() => onSectionChange(id)}
              aria-current={selected ? "page" : undefined}
              className={`flex shrink-0 items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium transition lg:w-full ${
                selected
                  ? "bg-emerald-50 text-emerald-900"
                  : "text-slate-500 hover:bg-slate-50 hover:text-emerald-800"
              }`}
            >
              <Icon size={19} />
              <span>{label}</span>
            </button>
          );
        })}
      </nav>

      <div className="mt-5 hidden rounded-2xl bg-[#173d32] p-4 text-white lg:block">
        <Heart size={20} className="mb-3 text-emerald-300" />
        <p className="font-semibold">Cuidarlos es quererlos.</p>
        <p className="mt-1 text-sm text-white/70">
          Cada pequeño cuidado cuenta.
        </p>
      </div>
    </aside>
  );
}
