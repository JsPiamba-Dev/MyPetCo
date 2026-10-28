
import { apiFetch } from "../lib/api";

export type UserRole =
  | "PROPIETARIO"
  | "VETERINARIA"
  | "EMPRESA"
  | "ADMINISTRADOR";

export interface User {
  id: string;
  nombre?: string;
  correo: string;
  rol: UserRole;
}

export interface AuthResponse {
  access_token: string;
  user: User;
}

export interface AuthCredentials {
  correo: string;
  contrasena: string;
}

export interface RegisterData extends AuthCredentials {
  rol: UserRole;

  // Perfil propietario
  nombre?: string;
  numero_documento?: string;
  telefono?: string;
  ciudad?: string;
  direccion?: string;

  // Perfil veterinaria / empresa
  nombre_comercial?: string;
  descripcion?: string;
  telefono_contacto?: string;
  sitio_web?: string;

  // Perfil veterinaria
  nombre_responsable?: string;
  registro_profesional?: string;
  horario_atencion?: string;
  servicios_clinicos?: string;

  // Perfil empresa
  identificacion_tributaria?: string;
  categoria_comercial?: string;
}

const TOKEN_KEY = "mypetco_token";

export const authService = {
  async login(data: AuthCredentials): Promise<AuthResponse> {
    const session = await apiFetch<AuthResponse>(
      "/auth/login",
      {
        method: "POST",
        body: JSON.stringify({
          correo: data.correo.trim().toLowerCase(),
          contrasena: data.contrasena,
        }),
      },
    );

    if (typeof window !== "undefined") {
      localStorage.setItem(TOKEN_KEY, session.access_token);
    }

    return session;
  },

  async register(data: RegisterData): Promise<AuthResponse> {
    if (data.rol === "ADMINISTRADOR") {
      throw new Error(
        "El registro de administradores requiere autorización."
      );
    }

    const session = await apiFetch<AuthResponse>(
      "/auth/register",
      {
        method: "POST",
        body: JSON.stringify({
          ...data,
          correo: data.correo.trim().toLowerCase(),
        }),
      },
    );

    if (typeof window !== "undefined") {
      localStorage.setItem(TOKEN_KEY, session.access_token);
    }

    return session;
  },

  logout(): void {
    if (typeof window !== "undefined") {
      localStorage.removeItem(TOKEN_KEY);
    }
  },

  getToken(): string | null {
    if (typeof window === "undefined") {
      return null;
    }

    return localStorage.getItem(TOKEN_KEY);
  },
};
