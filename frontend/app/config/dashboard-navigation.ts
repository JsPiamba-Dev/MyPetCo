
import type { UserRole } from "../../services/auth.service";
import {
    Activity,
    CalendarDays,
    Cat,
    ClipboardList,
    Heart,
    Package,
    PawPrint,
    Settings,
    ShieldCheck,
    ShoppingBag,
    Stethoscope,
    Store,
    Syringe,
    UserRound,
    Users,
} from "lucide-react";

export type DashboardSection = {
    id: string;
    label: string;
    icon: typeof PawPrint;
};

export const dashboardNavigation: Record<
    UserRole,
    DashboardSection[]
> = {
    PROPIETARIO: [
        { id: "catalogo", label: "Catálogo de proveedores", icon: ShoppingBag },
        { id: "mascotas", label: "Mis mascotas", icon: PawPrint },
        { id: "vacunacion", label: "Vacunación", icon: Syringe },
        { id: "calendario-salud", label: "Calendario de salud", icon: CalendarDays },
        { id: "solicitar-cita", label: "Solicitar cita", icon: Stethoscope },
        { id: "mis-citas", label: "Mis citas", icon: ClipboardList },
        { id: "editar-perfil", label: "Editar perfil", icon: UserRound },
        { id: "configuracion", label: "Configuración", icon: Settings },
    ],

    EMPRESA: [
        { id: "perfil-negocio", label: "Perfil de empresa", icon: Store },
        { id: "publicar-producto", label: "Publicar producto", icon: Package },
        { id: "mis-productos", label: "Mis productos", icon: ShoppingBag },
        { id: "publicar-servicio", label: "Publicar servicio", icon: Activity },
        { id: "mis-servicios", label: "Mis servicios", icon: ClipboardList },
        { id: "editar-perfil", label: "Editar perfil", icon: UserRound },
        { id: "configuracion", label: "Configuración", icon: Settings },
    ],

    VETERINARIA: [
        { id: "perfil-negocio", label: "Perfil veterinario", icon: Stethoscope },
        { id: "publicar-servicio", label: "Publicar servicio", icon: Activity },
        { id: "gestionar-citas", label: "Gestionar citas", icon: CalendarDays },
        { id: "mis-servicios", label: "Mis servicios", icon: ClipboardList },
        { id: "editar-perfil", label: "Editar perfil", icon: UserRound },
        { id: "configuracion", label: "Configuración", icon: Settings },
    ],

    ADMINISTRADOR: [
        { id: "administracion", label: "Panel de administración", icon: ShieldCheck },
        { id: "usuarios", label: "Usuarios", icon: Users },
        { id: "proveedores", label: "Proveedores", icon: Store },
        { id: "empresas", label: "Empresas", icon: Package },
        { id: "veterinarias", label: "Veterinarias", icon: Stethoscope },
        { id: "citas", label: "Citas", icon: CalendarDays },
        { id: "catalogo-admin", label: "Catálogo", icon: ShoppingBag },
        { id: "editar-perfil", label: "Editar perfil", icon: UserRound },
        { id: "configuracion", label: "Configuración", icon: Settings },
    ],
};
