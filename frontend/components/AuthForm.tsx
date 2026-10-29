"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, PawPrint, ShieldCheck } from "lucide-react";
import {
  authService,
  type RegisterData,
  type UserRole,
} from "../services/auth.service";

type Props = {
  mode: "login" | "register";
};

type Field = {
  name: keyof RegisterData;
  label: string;
  placeholder: string;
  required?: boolean;
  type?: string;
  maxLength?: number;
};

const fieldsByRole: Record<Exclude<UserRole, "ADMINISTRADOR">, Field[]> = {
  PROPIETARIO: [
    {
      name: "nombre",
      label: "Nombre completo",
      placeholder: "Tus nombres y apellidos",
      required: true,
      maxLength: 150,
    },
    {
      name: "numero_documento",
      label: "Número de documento",
      placeholder: "Documento de identidad",
      maxLength: 30,
    },
    {
      name: "telefono",
      label: "Teléfono",
      placeholder: "Tu número de contacto",
      maxLength: 30,
    },
    {
      name: "ciudad",
      label: "Ciudad",
      placeholder: "Tu ciudad",
      maxLength: 100,
    },
    {
      name: "direccion",
      label: "Dirección",
      placeholder: "Tu dirección",
      maxLength: 255,
    },
  ],

  VETERINARIA: [
    {
      name: "nombre_comercial",
      label: "Nombre de la veterinaria",
      placeholder: "Nombre del establecimiento",
      required: true,
      maxLength: 150,
    },
    {
      name: "nombre_responsable",
      label: "Nombre del responsable",
      placeholder: "Nombre completo del veterinario",
      required: true,
      maxLength: 150,
    },
    {
      name: "registro_profesional",
      label: "Registro profesional",
      placeholder: "Número de registro profesional",
      required: true,
      maxLength: 60,
    },
    {
      name: "telefono_contacto",
      label: "Teléfono de contacto",
      placeholder: "Teléfono de la veterinaria",
      maxLength: 30,
    },
    {
      name: "ciudad",
      label: "Ciudad",
      placeholder: "Ciudad del establecimiento",
      maxLength: 100,
    },
    {
      name: "direccion",
      label: "Dirección",
      placeholder: "Dirección del establecimiento",
      maxLength: 255,
    },
    {
      name: "descripcion",
      label: "Descripción",
      placeholder: "Información de la veterinaria (opcional)",
    },
    {
      name: "horario_atencion",
      label: "Horario de atención",
      placeholder: "Ej. lunes a sábado, 8 a. m. - 6 p. m.",
      maxLength: 255,
    },
    {
      name: "servicios_clinicos",
      label: "Servicios clínicos",
      placeholder: "Consulta, vacunación, cirugía...",
    },
    {
      name: "sitio_web",
      label: "Sitio web",
      placeholder: "https://ejemplo.com",
      maxLength: 255,
    },
  ],

  EMPRESA: [
    {
      name: "nombre_comercial",
      label: "Nombre de la empresa",
      placeholder: "Nombre comercial",
      required: true,
      maxLength: 150,
    },
    {
      name: "identificacion_tributaria",
      label: "NIT / Identificación tributaria",
      placeholder: "Identificación tributaria",
      required: true,
      maxLength: 30,
    },
    {
      name: "categoria_comercial",
      label: "Categoría comercial",
      placeholder: "Ej. alimentos, accesorios, servicios",
      maxLength: 100,
    },
    {
      name: "telefono_contacto",
      label: "Teléfono de contacto",
      placeholder: "Teléfono de la empresa",
      maxLength: 30,
    },
    {
      name: "ciudad",
      label: "Ciudad",
      placeholder: "Ciudad de la empresa",
      maxLength: 100,
    },
    {
      name: "direccion",
      label: "Dirección comercial",
      placeholder: "Dirección de la empresa",
      maxLength: 255,
    },
    {
      name: "descripcion",
      label: "Descripción",
      placeholder: "Cuéntanos sobre tu empresa",
    },
    {
      name: "sitio_web",
      label: "Sitio web",
      placeholder: "https://ejemplo.com",
      maxLength: 255,
    },
  ],

  // No se utiliza para registros públicos.
  ADMINISTRADOR: [],
} as Record<UserRole, Field[]>;

export default function AuthForm({ mode }: Props) {
  const router = useRouter();
  const isRegister = mode === "register";

  const [rol, setRol] = useState<UserRole>("PROPIETARIO");
  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [confirmarContrasena, setConfirmarContrasena] = useState("");
  const [values, setValues] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [autorizacionPromociones, setAutorizacionPromociones] = useState(false);

  const fields = rol === "ADMINISTRADOR" ? [] : fieldsByRole[rol];

  function updateField(name: string, value: string) {
    setValues((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  function goBack() {
    if (authService.getToken()) {
      router.replace("/dashboard");
    } else if (window.history.length > 1) {
      router.back();
    } else {
      router.replace("/");
    }
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;

    setError("");

    if (isRegister && rol === "ADMINISTRADOR") {
      setError("El administrador debe ser creado por un proceso autorizado.");
      return;
    }

    if (isRegister && contrasena !== confirmarContrasena) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setBusy(true);

    try {
      const correoNormalizado = correo.trim().toLowerCase();

      let session;

      if (isRegister) {
        const payload = {
          ...values,
          rol,
          correo: correoNormalizado,
          contrasena,
          autorizacion_promociones: autorizacionPromociones,
        } as RegisterData;

        // No enviar campos vacíos opcionales.
        for (const key of Object.keys(payload)) {
          const value = payload[key as keyof RegisterData];

          if (
            typeof value === "string" &&
            value.trim() === "" &&
            key !== "correo" &&
            key !== "contrasena"
          ) {
            delete payload[key as keyof RegisterData];
          }
        }

        session = await authService.register(payload);
      } else {
        session = await authService.login({
          correo: correoNormalizado,
          contrasena,
        });
      }

      // Ajustaremos el destino por rol cuando definamos
      // los paneles de propietario, veterinaria y empresa.
      router.replace("/dashboard");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No fue posible conectar con el servidor.",
      );
    } finally {
      setBusy(false);
    }
  }

  const homeHref = authService.getToken() ? "/dashboard" : "/";

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7faf7] px-5 py-10">
      <section className="w-full max-w-xl rounded-3xl border border-slate-100 bg-white p-7 shadow-xl sm:p-10">
        <button
          type="button"
          onClick={goBack}
          className="mb-6 inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-emerald-50 hover:text-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-600"
        >
          <ArrowLeft size={18} />
          Volver
        </button>

        <Link href={homeHref} className="mb-8 flex w-fit items-center gap-3">
          <div className="rounded-xl bg-emerald-100 p-3 text-emerald-800">
            <PawPrint size={26} />
          </div>
          <span className="text-2xl font-bold text-slate-900">MyPetCo</span>
        </Link>

        <p className="text-sm font-semibold uppercase tracking-widest text-emerald-700">
          {isRegister ? "Únete a nuestra comunidad" : "Qué bueno verte"}
        </p>

        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
          {isRegister ? "Crea tu cuenta" : "Inicia sesión"}
        </h1>

        <p className="mt-3 text-sm leading-6 text-slate-500">
          {isRegister
            ? "Selecciona tu perfil y completa tus datos."
            : "Ingresa a tu cuenta de MyPetCo."}
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          {isRegister && (
            <>
              <div>
                <label
                  htmlFor="rol"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  ¿Qué tipo de cuenta necesitas?
                </label>

                <select
                  id="rol"
                  value={rol}
                  onChange={(e) => {
                    setRol(e.target.value as UserRole);
                    setValues({});
                    setAutorizacionPromociones(false);
                    setError("");
                  }}
                  disabled={busy}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                >
                  <option value="PROPIETARIO">Propietario de mascota</option>
                  <option value="VETERINARIA">Veterinaria</option>
                  <option value="EMPRESA">Empresa</option>
                  <option value="ADMINISTRADOR" disabled>
                    Administrador (acceso autorizado)
                  </option>
                </select>
              </div>

              {fields.map((field) => (
                <div key={field.name}>
                  <label
                    htmlFor={String(field.name)}
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    {field.label}
                  </label>

                  <input
                    id={String(field.name)}
                    name={String(field.name)}
                    type={field.type ?? "text"}
                    required={field.required ?? false}
                    maxLength={field.maxLength}
                    value={values[field.name] ?? ""}
                    onChange={(e) =>
                      updateField(String(field.name), e.target.value)
                    }
                    disabled={busy}
                    placeholder={field.placeholder}
                    autoComplete="off"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 disabled:bg-slate-50"
                  />
                </div>
              ))}

              {rol === "ADMINISTRADOR" && (
                <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                  Las cuentas de administrador deben ser autorizadas por el
                  sistema. No es posible registrarse públicamente con este rol.
                </p>
              )}
            </>
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
              className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 disabled:bg-slate-50"
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
              value={contrasena}
              onChange={(e) => setContrasena(e.target.value)}
              autoComplete={isRegister ? "new-password" : "current-password"}
              disabled={busy}
              placeholder={isRegister ? "Mínimo 8 caracteres" : "Tu contraseña"}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 disabled:bg-slate-50"
            />
          </div>

          {isRegister && (
            <div>
              <label
                htmlFor="confirmarContrasena"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Confirmar contraseña
              </label>
              <input
                id="confirmarContrasena"
                type="password"
                required
                minLength={8}
                value={confirmarContrasena}
                onChange={(e) => setConfirmarContrasena(e.target.value)}
                autoComplete="new-password"
                disabled={busy}
                placeholder="Repite tu contraseña"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 disabled:bg-slate-50"
              />
            </div>
          )}

          {isRegister && (
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4">
              <div className="flex items-start gap-3">
                <input
                  id="autorizacionPromociones"
                  name="autorizacion_promociones"
                  type="checkbox"
                  checked={autorizacionPromociones}
                  onChange={(e) => setAutorizacionPromociones(e.target.checked)}
                  disabled={busy}
                  className="mt-1 h-4 w-4 shrink-0 cursor-pointer rounded border-slate-300 text-emerald-700 focus:ring-emerald-600"
                />

                <div>
                  <label
                    htmlFor="autorizacionPromociones"
                    className="cursor-pointer text-sm font-semibold leading-5 text-slate-800"
                  >
                    Autorización para comunicaciones, promociones y campañas
                    <span className="ml-1 font-normal text-slate-500">
                      (opcional)
                    </span>
                  </label>

                  <p className="mt-2 text-xs leading-5 text-slate-600">
                    Autorizo de manera previa, expresa e informada a MyPetCo
                    para recolectar y tratar mis datos personales con la
                    finalidad de enviarme información comercial, promociones,
                    novedades, encuestas y realizar análisis estadísticos.
                    También autorizo su utilización y comunicación a aliados
                    comerciales y organizaciones colaboradoras, cuando sea
                    necesario para desarrollar campañas e iniciativas
                    relacionadas con el bienestar, cuidado y protección animal.
                  </p>

                  <p className="mt-2 text-xs leading-5 text-slate-600">
                    Entiendo que esta autorización es voluntaria y que negarme a
                    otorgarla no afecta la creación ni el uso de mi cuenta.
                    Podré solicitar la consulta, actualización o rectificación
                    de mis datos, así como revocar esta autorización o solicitar
                    su supresión en los términos de la normativa aplicable y
                    mediante los canales habilitados por MyPetCo.
                  </p>
                </div>
              </div>
            </div>
          )}

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
            disabled={busy || (isRegister && rol === "ADMINISTRADOR")}
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
          {isRegister ? "¿Ya tienes cuenta?" : "¿Aún no tienes cuenta?"}{" "}
          <Link
            href={isRegister ? "/login" : "/register"}
            className="font-semibold text-emerald-800 hover:underline"
          >
            {isRegister ? "Inicia sesión" : "Regístrate"}
          </Link>
        </p>

        <div className="mt-8 flex items-center justify-center gap-2 text-xs text-slate-400">
          <ShieldCheck size={15} />
          <span>Tu bienestar y el de tus mascotas nos importa.</span>
        </div>
      </section>
    </main>
  );
}
