"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { ArrowLeft, Mail, PawPrint } from "lucide-react";
import { apiFetch } from "../../lib/api";

export default function ForgotPasswordPage() {
  const [correo, setCorreo] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setMensaje("");
    setError("");

    try {
      await apiFetch("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({
          correo: correo.trim().toLowerCase(),
        }),
      });

      setMensaje(
        "Si existe una cuenta con ese correo, recibirás instrucciones para restablecer tu contraseña.",
      );
    } catch {
      setError(
        "No fue posible procesar la solicitud. Inténtalo de nuevo más tarde.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7faf7] px-5 py-10">
      <section className="w-full max-w-md rounded-3xl border border-slate-100 bg-white p-7 shadow-xl sm:p-10">
        <Link
          href="/login"
          className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-emerald-800"
        >
          <ArrowLeft size={17} />
          Volver a iniciar sesión
        </Link>

        <div className="mb-7 flex items-center gap-3">
          <div className="rounded-xl bg-emerald-100 p-3 text-emerald-800">
            <PawPrint size={26} />
          </div>
          <span className="text-2xl font-bold text-slate-900">
            MyPetCo
          </span>
        </div>

        <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800">
          <Mail size={24} />
        </div>

        <h1 className="text-3xl font-semibold tracking-tight">
          ¿Olvidaste tu contraseña?
        </h1>

        <p className="mt-3 text-sm leading-6 text-slate-500">
          No te preocupes. Introduce el correo asociado a tu cuenta
          y te indicaremos cómo crear una contraseña nueva.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div>
            <label
              htmlFor="correo-recuperacion"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Correo electrónico
            </label>

            <input
              id="correo-recuperacion"
              name="correo"
              type="email"
              required
              maxLength={254}
              autoComplete="email"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              disabled={busy}
              placeholder="tu@correo.com"
              className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 disabled:bg-slate-50"
            />
          </div>

          {mensaje && (
            <p
              role="status"
              className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm leading-6 text-emerald-800"
            >
              {mensaje}
            </p>
          )}

          {error && (
            <p
              role="alert"
              className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-xl bg-[#173d32] px-5 py-4 font-semibold text-white transition hover:bg-emerald-900 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy ? "Procesando..." : "Enviar instrucciones"}
          </button>
        </form>

        <p className="mt-7 text-center text-xs leading-5 text-slate-400">
          Si tienes una cuenta con ese correo, podrás recibir las
          instrucciones de recuperación.
        </p>
      </section>
    </main>
  );
}
