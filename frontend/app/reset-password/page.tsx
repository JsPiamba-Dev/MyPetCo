"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, PawPrint, ShieldCheck } from "lucide-react";
import { apiFetch } from "../../lib/api";

export default function ResetPasswordPage() {
  const router = useRouter();

  const [token, setToken] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [confirmacion, setConfirmacion] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setToken(params.get("token")?.trim() ?? "");
  }, []);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    if (!token) {
      setError(
        "El enlace de recuperación no es válido o no contiene un token.",
      );
      return;
    }

    if (contrasena.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }

    if (contrasena !== confirmacion) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setBusy(true);

    try {
      await apiFetch("/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({
          token,
          contrasena,
        }),
      });

      setSuccess(true);
    } catch {
      setError(
        "No fue posible restablecer la contraseña. El enlace podría haber caducado o no ser válido.",
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

        <div className="mb-8 flex items-center gap-3">
          <div className="rounded-xl bg-emerald-100 p-3 text-emerald-800">
            <PawPrint size={26} />
          </div>
          <span className="text-2xl font-bold text-slate-900">
            MyPetCo
          </span>
        </div>

        {success ? (
          <div>
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800">
              <ShieldCheck size={25} />
            </div>

            <h1 className="text-3xl font-semibold tracking-tight">
              ¡Contraseña actualizada!
            </h1>

            <p className="mt-3 text-sm leading-6 text-slate-500">
              Ya puedes iniciar sesión con tu nueva contraseña.
            </p>

            <button
              type="button"
              onClick={() => router.replace("/login")}
              className="mt-7 w-full rounded-xl bg-[#173d32] px-5 py-4 font-semibold text-white transition hover:bg-emerald-900"
            >
              Ir a iniciar sesión
            </button>
          </div>
        ) : (
          <>
            <h1 className="text-3xl font-semibold tracking-tight">
              Crea una contraseña nueva
            </h1>

            <p className="mt-3 text-sm leading-6 text-slate-500">
              Elige una contraseña segura para volver a acceder a tu
              cuenta MyPetCo.
            </p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              <div>
                <label
                  htmlFor="nueva-contrasena"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Nueva contraseña
                </label>

                <input
                  id="nueva-contrasena"
                  name="contrasena"
                  type="password"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  value={contrasena}
                  onChange={(e) => setContrasena(e.target.value)}
                  disabled={busy}
                  placeholder="Mínimo 8 caracteres"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 disabled:bg-slate-50"
                />
              </div>

              <div>
                <label
                  htmlFor="confirmacion"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Confirmar contraseña
                </label>

                <input
                  id="confirmacion"
                  name="confirmacion"
                  type="password"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  value={confirmacion}
                  onChange={(e) => setConfirmacion(e.target.value)}
                  disabled={busy}
                  placeholder="Repite tu contraseña"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 disabled:bg-slate-50"
                />
              </div>

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
                disabled={busy || !token}
                className="w-full rounded-xl bg-[#173d32] px-5 py-4 font-semibold text-white transition hover:bg-emerald-900 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {busy ? "Actualizando..." : "Guardar contraseña nueva"}
              </button>

              {!token && (
                <p className="text-xs leading-5 text-slate-500">
                  Accede desde el enlace de recuperación que recibas
                  por correo electrónico.
                </p>
              )}
            </form>
          </>
        )}
      </section>
    </main>
  );
}
