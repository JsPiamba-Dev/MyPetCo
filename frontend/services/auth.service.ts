
import { apiFetch } from "../lib/api";

export interface User {
  id: string;
  nombre: string;
  correo: string;
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
  nombre: string;
}

export const authService = {
  async login(data: AuthCredentials) {
    const session = await apiFetch<AuthResponse>(
      "/auth/login",
      {
        method: "POST",
        body: JSON.stringify(data),
      },
    );

    localStorage.setItem(
      "mypetco_token",
      session.access_token,
    );

    return session;
  },

  async register(data: RegisterData) {
    const session = await apiFetch<AuthResponse>(
      "/auth/register",
      {
        method: "POST",
        body: JSON.stringify(data),
      },
    );

    localStorage.setItem(
      "mypetco_token",
      session.access_token,
    );

    return session;
  },

  logout() {
    localStorage.removeItem("mypetco_token");
  },

  getToken() {
    return localStorage.getItem("mypetco_token");
  },
};
