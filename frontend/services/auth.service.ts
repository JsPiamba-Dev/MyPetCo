
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

  // Autorización opcional para comunicaciones comerciales
  autorizacion_promociones?: boolean;

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

export type UpdateProfileInput = {
  nombre?: string;
  telefono?: string;
  ciudad?: string;
  direccion?: string;

  nombre_comercial?: string;
  descripcion?: string;
  telefono_contacto?: string;
  sitio_web?: string;

  nombre_responsable?: string;
  registro_profesional?: string;
  horario_atencion?: string;
  servicios_clinicos?: string;

  identificacion_tributaria?: string;
  categoria_comercial?: string;
};

export type ChangeEmailInput = {
  correo: string;
  contrasenaActual: string;
};

export type ChangePasswordInput = {
  contrasenaActual: string;
  nuevaContrasena: string;
};

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

  async updateProfile(data: UpdateProfileInput) {
    const token = this.getToken();

    if (!token) {
      throw new Error("Debes iniciar sesión para editar tu perfil.");
    }

    return apiFetch("/auth/profile", {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
  },

  async changeEmail(data: ChangeEmailInput) {
    const token = this.getToken();

    if (!token) {
      throw new Error("Debes iniciar sesión para cambiar tu correo.");
    }

    return apiFetch<{ message: string; correo: string }>("/auth/email", {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        correo: data.correo.trim().toLowerCase(),
        contrasenaActual: data.contrasenaActual,
      }),
    });
  },

  async changePassword(data: ChangePasswordInput) {
    const token = this.getToken();

    if (!token) {
      throw new Error("Debes iniciar sesión para cambiar tu contraseña.");
    }

    return apiFetch<{ message: string }>("/auth/password", {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
  },

  async forgotPassword(correo: string) {
    return apiFetch<{ message: string }>("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({
        correo: correo.trim().toLowerCase(),
      }),
    });
  }
};
