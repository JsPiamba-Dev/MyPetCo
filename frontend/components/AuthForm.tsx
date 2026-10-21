
"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  PawPrint,
  ShieldCheck,
} from "lucide-react";
import { authService } from "../services/auth.service";

type Props = {
  mode: "login" | "register";
};

export default function AuthForm({ mode }: Props) {
  const router = useRouter();
  const isRegister = mode === "register";

  const [nombre, setNombre] = useState("");
  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  function goBack() {
    // Si hay un token guardado, el usuario tiene una sesión
    // que debe llevarlo de vuelta al dashboard.
    const token = authService.getToken();

    if (token) {
      router.replace("/dashboard");
      return;
    }

    // Si no hay sesión, vuelve a la página anterior.
    // Si llegó directamente al formulario, va al inicio.
    if (window.history.length > 1) {
      router.back();
    } else {
      router.replace("/");
    }
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (busy) return;

    setBusy(true);
    setError("");

    try {
      const correoNormalizado = correo.trim().toLowerCase();

      if (isRegister) {
        const nombreNormalizado = nombre.trim();

        if (!nombreNormalizado) {
          setError("Por favor, introduce tu nombre.");
          return;
        }

        await authService.register({
          nombre: nombreNormalizado,
          correo: correoNormalizado,
          contrasena,
        });
      } else {
        await authService.login({
          correo: correoNormalizado,
          contrasena,
        });
      }

      router.replace("/dashboard");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No fue posible conectar con el servidor."
      );
    } finally {
      setBusy(false);
    }
  }

  // El destino del logo depende de si existe una sesión.
  const homeHref = authService.getToken() ? "/dashboard" : "/";

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7faf7] px-5 py-10">
      <section className="w-full max-w-md rounded-3xl border border-slate-100 bg-white p-7 shadow-xl sm:p-10">
        {/* Botón volver */}
        <button
          type="button"
          onClick={goBack}
          className="mb-6 inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-emerald-50 hover:text-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-600"
        >
          <ArrowLeft size={18} />
          Volver
        </button>

        {/* Marca */}
        <Link
          href={homeHref}
          className="mb-8 flex w-fit items-center gap-3"
          aria-label={
            homeHref === "/dashboard"
              ? "Ir al dashboard de MyPetCo"
              : "Volver al inicio de MyPetCo"
          }
        >
          <div className="rounded-xl bg-emerald-100 p-3 text-emerald-800">
            <PawPrint size={26} />
          </div>

          <span className="text-2xl font-bold text-slate-900">
            MyPetCo
          </span>
        </Link>

        <p className="text-sm font-semibold uppercase tracking-widest text-emerald-700">
          {isRegister ? "Comencemos juntos" : "Qué bueno verte"}
        </p>

        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
          {isRegister ? "Crea tu cuenta" : "Inicia sesión"}
        </h1>

        <p className="mt-3 text-sm leading-6 text-slate-500">
          {isRegister
            ? "Regístrate para organizar el cuidado de tus mascotas."
            : "Entra a tu espacio de bienestar para tus mascotas."}
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          {isRegister && (
            <div>
              <label
                htmlFor="nombre"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Tu nombre
              </label>

              <input
                id="nombre"
                name="nombre"
                type="text"
                required
                maxLength={100}
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                autoComplete="name"
                disabled={busy}
                placeholder="¿Cómo te llamas?"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 disabled:bg-slate-50"
              />
            </div>
          )}

          <div>
            <label
              htmlFor="correo"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Correo electrónico
            </label>

            <input
              id="correo"
              name="correo"
              type="email"
              required
              maxLength={254}
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              autoComplete="email"
              disabled={busy}
              placeholder="tu@correo.com"
              className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 disabled:bg-slate-50"
            />
          </div>

          <div>
            <label
              htmlFor="contrasena"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Contraseña
            </label>

            <input
              id="contrasena"
              name="contrasena"
              type="password"
              required
              minLength={8}
              autoComplete={
                isRegister ? "new-password" : "current-password"
              }
              value={contrasena}
              onChange={(e) => setContrasena(e.target.value)}
              disabled={busy}
              placeholder={
                isRegister
                  ? "Mínimo 8 caracteres"
                  : "Introduce tu contraseña"
              }
              className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 disabled:bg-slate-50"
            />
          </div>

          {!isRegister && (
            <div className="flex justify-end">
              <Link
                href="/forgot-password"
                className="text-sm font-semibold text-emerald-800 hover:underline"
              >
                ¿Olvidaste tu contraseña?
              </Link>
            </div>
          )}

          {error && (
            <div
              role="alert"
              aria-live="polite"
              className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={busy}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#173d32] px-5 py-4 font-semibold text-white transition hover:bg-emerald-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy
              ? "Un momento..."
              : isRegister
                ? "Crear mi cuenta"
                : "Entrar a mi cuenta"}

            <ArrowRight size={18} />
          </button>
        </form>

        <p className="mt-7 text-center text-sm text-slate-500">
          {isRegister
            ? "¿Ya tienes cuenta?"
            : "¿Aún no tienes cuenta?"}{" "}
          <Link
            href={isRegister ? "/login" : "/register"}
            className="font-semibold text-emerald-800 hover:underline"
          >
            {isRegister ? "Inicia sesión" : "Regístrate"}
          </Link>
        </p>

        <div className="mt-8 flex items-center justify-center gap-2 text-xs text-slate-400">
          <ShieldCheck size={15} />
          <span>
            Tu bienestar y el de tus mascotas nos importa.
          </span>
        </div>
      </section>
    </main>
  );
}
