"use client";

import { useEffect, useState, type FormEvent } from "react";
import { KeyRound, Mail, Save, UserRound } from "lucide-react";

type Profile = {
  id: string;
  nombre: string;
  telefono?: string | null;
  ciudad?: string | null;
  direccion?: string | null;
  correo: string;
};

type ProfileUpdate = {
  nombre: string;
  telefono: string;
  ciudad: string;
  direccion: string;
};

type Props = {
  initialProfile?: Profile;
  onSaveProfile?: (data: ProfileUpdate) => Promise<void>;
  onChangeEmail?: (email: string, contrasenaActual: string) => Promise<void>;
  onChangePassword?: (
    contrasenaActual: string,
    nuevaContrasena: string,
  ) => Promise<void>;
  onRequestPasswordReset?: () => Promise<void>;
};

export default function UserProfileSettings({
  initialProfile,
  onSaveProfile,
  onChangeEmail,
  onChangePassword,
  onRequestPasswordReset,
}: Props) {
  const [nombre, setNombre] = useState(initialProfile?.nombre ?? "");
  const [telefono, setTelefono] = useState(initialProfile?.telefono ?? "");
  const [ciudad, setCiudad] = useState(initialProfile?.ciudad ?? "");
  const [direccion, setDireccion] = useState(initialProfile?.direccion ?? "");
  const [correo, setCorreo] = useState(initialProfile?.correo ?? "");

  const [contrasenaActualCorreo, setContrasenaActualCorreo] = useState("");
  const [contrasenaActual, setContrasenaActual] = useState("");
  const [nuevaContrasena, setNuevaContrasena] = useState("");
  const [confirmarContrasena, setConfirmarContrasena] = useState("");

  const [savingProfile, setSavingProfile] = useState(false);
  const [savingEmail, setSavingEmail] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [requestingReset, setRequestingReset] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    setNombre(initialProfile?.nombre ?? "");
    setTelefono(initialProfile?.telefono ?? "");
    setCiudad(initialProfile?.ciudad ?? "");
    setDireccion(initialProfile?.direccion ?? "");
    setCorreo(initialProfile?.correo ?? "");
  }, [initialProfile]);

  function clearFeedback() {
    setMessage("");
    setError("");
  }

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    clearFeedback();

    if (!onSaveProfile) {
      setError("La actualización del perfil aún no está conectada al backend.");
      return;
    }

    if (!nombre.trim()) {
      setError("El nombre es obligatorio.");
      return;
    }

    setSavingProfile(true);

    try {
      await onSaveProfile({
        nombre: nombre.trim(),
        telefono: telefono.trim(),
        ciudad: ciudad.trim(),
        direccion: direccion.trim(),
      });

      setMessage("Los datos del perfil se actualizaron correctamente.");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No se pudo guardar el perfil.",
      );
    } finally {
      setSavingProfile(false);
    }
  }

  async function changeEmail(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    clearFeedback();

    if (!onChangeEmail) {
      setError("El cambio de correo aún no está conectado al backend.");
      return;
    }

    const emailLimpio = correo.trim().toLowerCase();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailLimpio)) {
      setError("Ingresa una dirección de correo válida.");
      return;
    }

    if (!contrasenaActualCorreo) {
      setError("Ingresa tu contraseña actual para cambiar el correo.");
      return;
    }

    if (emailLimpio === initialProfile?.correo.trim().toLowerCase()) {
      setError("El nuevo correo debe ser diferente al correo actual.");
      return;
    }

    setSavingEmail(true);

    try {
      await onChangeEmail(emailLimpio, contrasenaActualCorreo);

      setMessage("El cambio de correo se procesó correctamente.");
      setContrasenaActualCorreo("");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No se pudo cambiar el correo.",
      );
    } finally {
      setSavingEmail(false);
    }
  }

  async function changePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    clearFeedback();

    if (!onChangePassword) {
      setError("El cambio de contraseña aún no está conectado al backend.");
      return;
    }

    if (!contrasenaActual) {
      setError("Ingresa tu contraseña actual.");
      return;
    }

    if (nuevaContrasena.length < 8) {
      setError("La nueva contraseña debe tener al menos 8 caracteres.");
      return;
    }

    if (nuevaContrasena !== confirmarContrasena) {
      setError("La nueva contraseña y su confirmación no coinciden.");
      return;
    }

    if (contrasenaActual === nuevaContrasena) {
      setError("La nueva contraseña debe ser diferente a la actual.");
      return;
    }

    setSavingPassword(true);

    try {
      await onChangePassword(contrasenaActual, nuevaContrasena);

      setMessage("La contraseña se cambió correctamente.");
      setContrasenaActual("");
      setNuevaContrasena("");
      setConfirmarContrasena("");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo cambiar la contraseña.",
      );
    } finally {
      setSavingPassword(false);
    }
  }

  async function requestPasswordReset() {
    clearFeedback();

    if (!onRequestPasswordReset) {
      setError(
        "El restablecimiento de contraseña aún no está conectado al backend.",
      );
      return;
    }

    setRequestingReset(true);

    try {
      await onRequestPasswordReset();
      setMessage(
        "Si la cuenta puede restablecer su contraseña, recibirás las instrucciones correspondientes por correo.",
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo solicitar el restablecimiento.",
      );
    } finally {
      setRequestingReset(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:p-7">
        <div className="mb-6 flex items-center gap-3">
          <div className="rounded-xl bg-emerald-50 p-3 text-emerald-800">
            <UserRound size={22} />
          </div>

          <div>
            <h2 className="text-xl font-semibold">Datos personales</h2>
            <p className="mt-1 text-sm text-slate-500">
              Actualiza la información asociada a tu cuenta.
            </p>
          </div>
        </div>

        <form onSubmit={saveProfile} className="grid gap-4 sm:grid-cols-2">
          <Field
            id="profile-name"
            label="Nombre completo"
            value={nombre}
            onChange={setNombre}
            required
          />

          <Field
            id="profile-phone"
            label="Teléfono"
            value={telefono}
            onChange={setTelefono}
          />

          <Field
            id="profile-city"
            label="Ciudad"
            value={ciudad}
            onChange={setCiudad}
          />

          <Field
            id="profile-address"
            label="Dirección"
            value={direccion}
            onChange={setDireccion}
          />

          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={savingProfile}
              className="inline-flex items-center gap-2 rounded-xl bg-[#173d32] px-5 py-3 font-semibold text-white transition hover:bg-[#245545] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Save size={17} />
              {savingProfile ? "Guardando..." : "Guardar perfil"}
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:p-7">
        <div className="mb-5 flex items-center gap-3">
          <div className="rounded-xl bg-blue-50 p-3 text-blue-800">
            <Mail size={22} />
          </div>

          <div>
            <h2 className="text-xl font-semibold">Correo electrónico</h2>
            <p className="mt-1 text-sm text-slate-500">
              Confirma tu contraseña actual para solicitar el cambio.
            </p>
          </div>
        </div>

        <form onSubmit={changeEmail} className="space-y-4">
          <Field
            id="profile-email"
            label="Nuevo correo electrónico"
            type="email"
            value={correo}
            onChange={setCorreo}
            required
          />

          <Field
            id="email-current-password"
            label="Contraseña actual"
            type="password"
            value={contrasenaActualCorreo}
            onChange={setContrasenaActualCorreo}
            required
            autoComplete="current-password"
          />

          <button
            type="submit"
            disabled={savingEmail}
            className="rounded-xl border border-slate-200 px-5 py-3 font-semibold transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {savingEmail ? "Procesando..." : "Solicitar cambio de correo"}
          </button>
        </form>
      </section>

      <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:p-7">
        <div className="mb-5 flex items-center gap-3">
          <div className="rounded-xl bg-amber-50 p-3 text-amber-800">
            <KeyRound size={22} />
          </div>

          <div>
            <h2 className="text-xl font-semibold">Cambiar contraseña</h2>
            <p className="mt-1 text-sm text-slate-500">
              Actualiza la contraseña de tu cuenta.
            </p>
          </div>
        </div>

        <form onSubmit={changePassword} className="space-y-4">
          <Field
            id="current-password"
            label="Contraseña actual"
            type="password"
            value={contrasenaActual}
            onChange={setContrasenaActual}
            required
            autoComplete="current-password"
          />

          <Field
            id="new-password"
            label="Nueva contraseña"
            type="password"
            value={nuevaContrasena}
            onChange={setNuevaContrasena}
            required
            minLength={8}
            autoComplete="new-password"
          />

          <Field
            id="confirm-password"
            label="Confirmar nueva contraseña"
            type="password"
            value={confirmarContrasena}
            onChange={setConfirmarContrasena}
            required
            minLength={8}
            autoComplete="new-password"
          />

          <p className="text-sm text-slate-500">
            La contraseña debe tener al menos 8 caracteres.
          </p>

          <button
            type="submit"
            disabled={savingPassword}
            className="rounded-xl bg-[#173d32] px-5 py-3 font-semibold text-white transition hover:bg-[#245545] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {savingPassword ? "Actualizando..." : "Cambiar contraseña"}
          </button>
        </form>

        <div className="mt-6 border-t border-slate-100 pt-5">
          <h3 className="font-semibold">¿Olvidaste tu contraseña?</h3>
          <p className="mt-1 mb-4 text-sm leading-6 text-slate-500">
            Solicita instrucciones para restablecerla mediante el mecanismo
            configurado en el servidor.
          </p>

          <button
            type="button"
            disabled={requestingReset}
            onClick={requestPasswordReset}
            className="rounded-xl border border-slate-200 px-5 py-3 font-semibold transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {requestingReset
              ? "Procesando..."
              : "Enviar instrucciones de restablecimiento"}
          </button>
        </div>
      </section>

      {(message || error) && (
        <p
          role={error ? "alert" : "status"}
          className={`rounded-xl p-4 text-sm ${
            error
              ? "border border-red-200 bg-red-50 text-red-700"
              : "border border-emerald-200 bg-emerald-50 text-emerald-800"
          }`}
        >
          {error || message}
        </p>
      )}
    </div>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  type = "text",
  required = false,
  minLength,
  autoComplete,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
  minLength?: number;
  autoComplete?: string;
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-2 block text-sm font-medium text-slate-700"
      >
        {label}
      </label>

      <input
        id={id}
        name={id}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required={required}
        minLength={minLength}
        maxLength={200}
        autoComplete={autoComplete}
        className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
      />
    </div>
  );
}
