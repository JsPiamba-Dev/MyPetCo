"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import {
  adminService,
  type AdminUser,
  type AdminRole,
  type AccountState,
  type AggregateReport,
  type ExternalScope,
  type ExternalTokenRecord,
  type CreatedExternalToken,
} from "../../services/admin.service";

const field =
  "mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-600";
const button =
  "rounded-xl bg-[#173d32] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50";
const roles: AdminRole[] = [
  "PROPIETARIO",
  "VETERINARIA",
  "EMPRESA",
  "ADMINISTRADOR",
];
const states: AccountState[] = [
  "PENDIENTE_VERIFICACION",
  "ACTIVA",
  "SUSPENDIDA",
  "DESACTIVADA",
];

function ErrorMessage({ children }: { children: string }) {
  return (
    <p
      role="alert"
      className="mt-3 rounded-xl bg-red-50 p-3 text-sm text-red-700"
    >
      {children}
    </p>
  );
}

export default function PanelAdministracion() {
  const [tab, setTab] = useState<"usuarios" | "datos" | "tokens">("usuarios");
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [tokens, setTokens] = useState<ExternalTokenRecord[]>([]);
  const [report, setReport] = useState<AggregateReport | null>(null);
  const [q, setQ] = useState("");
  const [city, setCity] = useState("");
  const [species, setSpecies] = useState<"TODAS" | "PERRO" | "GATO">("TODAS");
  const [breed, setBreed] = useState("");
  const [loading, setLoading] = useState(false);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [createdToken, setCreatedToken] = useState<CreatedExternalToken | null>(
    null,
  );

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await adminService.listarUsuarios({ q });
      setUsers(Array.isArray(result) ? result : []);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "No se pudieron cargar los usuarios.",
      );
    } finally {
      setLoading(false);
    }
  }, [q]);

  const loadTokens = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await adminService.listarTokens();
      setTokens(Array.isArray(result) ? result : []);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "No se pudieron cargar las credenciales.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const loadReport = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setReport(
        await adminService.informeAgregado({
          ciudad: city,
          especie: species,
          raza: breed,
        }),
      );
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "No se pudo cargar el informe agregado.",
      );
    } finally {
      setLoading(false);
    }
  }, [city, species, breed]);

  useEffect(() => {
    if (tab === "usuarios") void loadUsers();
  }, [tab, loadUsers]);
  useEffect(() => {
    if (tab === "tokens") void loadTokens();
  }, [tab, loadTokens]);
  useEffect(() => {
    if (tab === "datos") void loadReport();
  }, [tab, loadReport]);

  async function createUser(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setWorking(true);
    setError("");
    setNotice("");
    const form = e.currentTarget;
    const data = new FormData(form);
    try {
      await adminService.crearUsuario({
        nombre: String(data.get("nombre") || "").trim(),
        correo: String(data.get("correo") || "").trim(),
        password: String(data.get("password") || ""),
        rol: String(data.get("rol") || "PROPIETARIO") as AdminRole,
        ciudad: String(data.get("ciudad") || "").trim() || undefined,
      });
      form.reset();
      setNotice("Usuario creado.");
      await loadUsers();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo crear el usuario.");
    } finally {
      setWorking(false);
    }
  }

  async function updateUser(
    id: string,
    patch: Partial<Pick<AdminUser, "rol" | "estado">>,
  ) {
    setWorking(true);
    setError("");
    setNotice("");
    try {
      await adminService.actualizarUsuario(id, patch);
      setNotice("Usuario actualizado.");
      await loadUsers();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "No se pudo actualizar el usuario.",
      );
    } finally {
      setWorking(false);
    }
  }

  async function deleteUser(user: AdminUser) {
    if (
      !window.confirm(
        `¿Eliminar la cuenta de ${user.nombre} (${user.correo})? Esta acción puede ser irreversible.`,
      )
    )
      return;
    setWorking(true);
    setError("");
    setNotice("");
    try {
      await adminService.eliminarUsuario(user.id);
      setNotice("Usuario eliminado.");
      await loadUsers();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "No se pudo eliminar el usuario.",
      );
    } finally {
      setWorking(false);
    }
  }

  async function createToken(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setWorking(true);
    setError("");
    setNotice("");
    setCreatedToken(null);
    const form = e.currentTarget;
    const data = new FormData(form);
    const scopes = data.getAll("scopes").map(String) as ExternalScope[];
    try {
      const result = await adminService.crearToken({
        client_name: String(data.get("client_name") || "").trim(),
        contract_reference: String(data.get("contract_reference") || "").trim(),
        purpose: String(data.get("purpose") || "").trim(),
        expires_in_days: Number(data.get("expires_in_days")),
        scopes,
      });
      setCreatedToken(result);
      form.reset();
      setNotice(
        "Credencial emitida. Copia el JWT ahora: no volverá a mostrarse completo.",
      );
      await loadTokens();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo emitir el token.");
    } finally {
      setWorking(false);
    }
  }

  async function revokeToken(token: ExternalTokenRecord) {
    if (!window.confirm(`¿Revocar el acceso de “${token.client_name}”?`))
      return;
    setWorking(true);
    setError("");
    setNotice("");
    try {
      await adminService.revocarToken(token.id);
      setNotice("Token revocado.");
      await loadTokens();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo revocar el token.");
    } finally {
      setWorking(false);
    }
  }

  return (
    <section id="administracion" className="space-y-6">
      <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:p-7">
        <div className="mb-5">
          <p className="text-sm font-semibold text-emerald-700">
            CONTROL ADMINISTRATIVO
          </p>
          <h2 className="mt-1 text-2xl font-semibold">
            Administración de MyPetCo
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
            Gestiona cuentas, consulta estadísticas poblacionales agregadas y
            administra credenciales externas con vencimiento y revocación.
          </p>
        </div>
        <div
          className="flex flex-wrap gap-2"
          role="tablist"
          aria-label="Módulos de administración"
        >
          {(
            [
              ["usuarios", "Usuarios"],
              ["datos", "Datos agregados"],
              ["tokens", "Acceso externo"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={tab === id}
              onClick={() => {
                setTab(id);
                setError("");
                setNotice("");
              }}
              className={`rounded-xl px-4 py-2.5 text-sm font-semibold ${tab === id ? "bg-[#173d32] text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
            >
              {label}
            </button>
          ))}
        </div>
        {error && <ErrorMessage>{error}</ErrorMessage>}
        {notice && (
          <p
            role="status"
            className="mt-3 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800"
          >
            {notice}
          </p>
        )}
      </div>

      {tab === "usuarios" && (
        <>
          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:p-7">
            <h3 className="text-lg font-semibold">Crear usuario</h3>
            <form
              onSubmit={createUser}
              className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
            >
              <label className="text-sm font-medium">
                Nombre
                <input
                  className={field}
                  name="nombre"
                  required
                  maxLength={150}
                />
              </label>
              <label className="text-sm font-medium">
                Correo
                <input
                  className={field}
                  name="correo"
                  type="email"
                  required
                  maxLength={255}
                />
              </label>
              <label className="text-sm font-medium">
                Contraseña temporal
                <input
                  className={field}
                  name="password"
                  type="password"
                  minLength={12}
                  required
                  autoComplete="new-password"
                />
              </label>
              <label className="text-sm font-medium">
                Rol
                <select className={field} name="rol" defaultValue="PROPIETARIO">
                  {roles.map((r) => (
                    <option key={r}>{r}</option>
                  ))}
                </select>
              </label>
              <label className="text-sm font-medium">
                Ciudad
                <input className={field} name="ciudad" maxLength={100} />
              </label>
              <div className="flex items-end">
                <button className={button} disabled={working}>
                  {working ? "Guardando…" : "Crear usuario"}
                </button>
              </div>
            </form>
            <p className="mt-3 text-xs leading-5 text-slate-500">
              El backend debe almacenar únicamente el hash de la contraseña,
              aplicar política de contraseñas y auditar esta operación.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:p-7">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold">Cuentas registradas</h3>
                <p className="mt-1 text-sm text-slate-500">
                  Puedes cambiar rol/estado o eliminar una cuenta.
                </p>
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void loadUsers();
                }}
                className="flex gap-2"
              >
                <input
                  aria-label="Buscar usuarios"
                  className={`${field} mt-0 min-w-0 sm:w-64`}
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Nombre, correo o ciudad"
                />
                <button className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold">
                  Buscar
                </button>
              </form>
            </div>
            {loading ? (
              <p className="py-8 text-center text-sm text-slate-500">
                Cargando usuarios…
              </p>
            ) : users.length === 0 ? (
              <p className="mt-5 rounded-xl border border-dashed p-6 text-center text-sm text-slate-500">
                No hay usuarios para mostrar.
              </p>
            ) : (
              <div className="mt-5 space-y-3">
                {users.map((u) => (
                  <article
                    key={u.id}
                    className="grid gap-3 rounded-xl border border-slate-100 p-4 lg:grid-cols-[1.4fr_1fr_1fr_auto] lg:items-center"
                  >
                    <div className="min-w-0">
                      <p className="font-semibold">{u.nombre}</p>
                      <p className="break-all text-sm text-slate-500">
                        {u.correo}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {u.ciudad || "Ciudad no registrada"} ·{" "}
                        {u.total_mascotas ?? "—"} mascotas
                      </p>
                    </div>
                    <label className="text-xs font-semibold text-slate-500">
                      Rol
                      <select
                        className={field}
                        value={u.rol}
                        disabled={working}
                        onChange={(e) =>
                          void updateUser(u.id, {
                            rol: e.target.value as AdminRole,
                          })
                        }
                      >
                        {roles.map((r) => (
                          <option key={r}>{r}</option>
                        ))}
                      </select>
                    </label>
                    <label className="text-xs font-semibold text-slate-500">
                      Estado
                      <select
                        className={field}
                        value={u.estado}
                        disabled={working}
                        onChange={(e) =>
                          void updateUser(u.id, {
                            estado: e.target.value as AccountState,
                          })
                        }
                      >
                        {states.map((s) => (
                          <option key={s}>{s}</option>
                        ))}
                      </select>
                    </label>
                    <button
                      type="button"
                      disabled={working}
                      onClick={() => void deleteUser(u)}
                      className="rounded-xl border border-red-200 px-3 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
                    >
                      Eliminar
                    </button>
                  </article>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {tab === "datos" && (
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:p-7">
          <div>
            <h3 className="text-lg font-semibold">Distribución de mascotas</h3>
            <p className="mt-1 text-sm leading-6 text-slate-500">
              Solo estadísticas agregadas. No se muestran nombres, correos ni
              direcciones particulares.
            </p>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void loadReport();
            }}
            className="mt-5 grid gap-3 sm:grid-cols-4"
          >
            <label className="text-sm font-medium">
              Ciudad
              <input
                className={field}
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Todas las ciudades"
              />
            </label>
            <label className="text-sm font-medium">
              Especie
              <select
                className={field}
                value={species}
                onChange={(e) => setSpecies(e.target.value as typeof species)}
              >
                <option value="TODAS">Todas</option>
                <option value="PERRO">Perros</option>
                <option value="GATO">Gatos</option>
              </select>
            </label>
            <label className="text-sm font-medium">
              Raza
              <input
                className={field}
                value={breed}
                onChange={(e) => setBreed(e.target.value)}
                placeholder="Todas las razas"
              />
            </label>
            <div className="flex items-end">
              <button className={button} disabled={loading}>
                Aplicar filtros
              </button>
            </div>
          </form>
          {loading ? (
            <p className="py-8 text-center text-sm text-slate-500">
              Calculando informe…
            </p>
          ) : (
            report && (
              <>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl bg-emerald-50 p-4">
                    <p className="text-sm text-emerald-800">
                      Mascotas en el resultado
                    </p>
                    <p className="mt-1 text-3xl font-semibold text-emerald-950">
                      {report.total_mascotas}
                    </p>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-4">
                    <p className="text-sm text-slate-500">
                      Propietarios representados
                    </p>
                    <p className="mt-1 text-3xl font-semibold">
                      {report.total_propietarios}
                    </p>
                  </div>
                </div>
                <div className="mt-5 grid gap-5 lg:grid-cols-3">
                  <div>
                    <h4 className="font-semibold">Por ciudad</h4>
                    <div className="mt-2 space-y-2">
                      {report.por_ciudad?.length ? (
                        report.por_ciudad.map((x) => (
                          <div
                            key={x.ciudad}
                            className="flex justify-between gap-3 rounded-lg bg-slate-50 p-3 text-sm"
                          >
                            <span>{x.ciudad || "No registrada"}</span>
                            <strong>{x.cantidad_mascotas}</strong>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-slate-500">Sin datos.</p>
                      )}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold">Por especie</h4>
                    <div className="mt-2 space-y-2">
                      {report.por_especie?.length ? (
                        report.por_especie.map((x) => (
                          <div
                            key={x.especie}
                            className="flex justify-between rounded-lg bg-slate-50 p-3 text-sm"
                          >
                            <span>
                              {x.especie === "PERRO" ? "Perros" : "Gatos"}
                            </span>
                            <strong>{x.cantidad}</strong>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-slate-500">Sin datos.</p>
                      )}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold">Por raza</h4>
                    <div className="mt-2 space-y-2">
                      {report.por_raza?.length ? (
                        report.por_raza.map((x) => (
                          <div
                            key={`${x.especie}-${x.raza}`}
                            className="flex justify-between gap-3 rounded-lg bg-slate-50 p-3 text-sm"
                          >
                            <span>
                              {x.raza || "Sin raza"}{" "}
                              <span className="text-slate-400">
                                ({x.especie})
                              </span>
                            </span>
                            <strong>{x.cantidad}</strong>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-slate-500">Sin datos.</p>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )
          )}
          <p className="mt-5 rounded-xl bg-amber-50 p-4 text-sm leading-6 text-amber-900">
            Recomendación: para evitar identificar personas en ciudades o razas
            poco frecuentes, el backend debe suprimir grupos con menos de 5
            registros y limitar la exportación de combinaciones demasiado
            específicas.
          </p>
        </div>
      )}

      {tab === "tokens" && (
        <>
          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:p-7">
            <h3 className="text-lg font-semibold">
              Emitir JWT para una entidad externa
            </h3>
            <p className="mt-1 text-sm leading-6 text-slate-500">
              La vigencia debe coincidir con el contrato. El token tendrá acceso
              solo a estadísticas agregadas; no se permite emitir credenciales
              para datos personales desde este formulario.
            </p>
            <form
              onSubmit={createToken}
              className="mt-5 grid gap-4 sm:grid-cols-2"
            >
              <label className="text-sm font-medium">
                Entidad / cliente
                <input
                  className={field}
                  name="client_name"
                  required
                  maxLength={150}
                  placeholder="Entidad de campañas regionales"
                />
              </label>
              <label className="text-sm font-medium">
                Referencia de contrato
                <input
                  className={field}
                  name="contract_reference"
                  required
                  maxLength={100}
                  placeholder="CONTRATO-2026-001"
                />
              </label>
              <label className="text-sm font-medium sm:col-span-2">
                Finalidad autorizada
                <textarea
                  className={field}
                  name="purpose"
                  required
                  maxLength={255}
                  rows={2}
                  placeholder="Planificación de campañas preventivas por ciudad y especie"
                />
              </label>
              <label className="text-sm font-medium">
                Duración
                <select
                  className={field}
                  name="expires_in_days"
                  defaultValue="30"
                >
                  <option value="1">1 día</option>
                  <option value="7">7 días</option>
                  <option value="30">30 días</option>
                  <option value="90">90 días</option>
                  <option value="180">180 días</option>
                  <option value="365">365 días</option>
                </select>
              </label>
              <fieldset className="rounded-xl border border-slate-200 p-3">
                <legend className="px-1 text-sm font-semibold">Permisos</legend>
                <label className="flex items-start gap-2 py-1 text-sm">
                  <input
                    type="checkbox"
                    name="scopes"
                    value="analytics:read"
                    defaultChecked
                    className="mt-1"
                  />
                  Consultar informes agregados
                </label>
                <label className="flex items-start gap-2 py-1 text-sm">
                  <input
                    type="checkbox"
                    name="scopes"
                    value="pets:aggregate"
                    defaultChecked
                    className="mt-1"
                  />
                  Conteos por ciudad, especie y raza
                </label>
              </fieldset>
              <div className="sm:col-span-2">
                <button className={button} disabled={working}>
                  {working ? "Emitiendo…" : "Generar JWT"}
                </button>
              </div>
            </form>
            {createdToken && (
              <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                <h4 className="font-semibold text-emerald-950">
                  JWT generado — copia ahora
                </h4>
                <p className="mt-1 text-sm text-emerald-900">
                  Expira:{" "}
                  {new Date(createdToken.expires_at).toLocaleString("es-CO")}
                </p>
                <textarea
                  readOnly
                  value={createdToken.token}
                  rows={4}
                  className="mt-3 w-full break-all rounded-lg border border-emerald-200 bg-white p-3 font-mono text-xs"
                />
                <button
                  type="button"
                  className="mt-3 rounded-xl border border-emerald-300 px-3 py-2 text-sm font-semibold text-emerald-900"
                  onClick={() =>
                    void navigator.clipboard?.writeText(createdToken.token)
                  }
                >
                  Copiar JWT
                </button>
                <p className="mt-2 text-xs text-emerald-900">
                  No lo envíes por canales inseguros. El panel no volverá a
                  mostrar este valor.
                </p>
              </div>
            )}
          </div>
          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:p-7">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold">Credenciales emitidas</h3>
                <p className="mt-1 text-sm text-slate-500">
                  Se muestra metadata, nunca el JWT completo.
                </p>
              </div>
              <button
                type="button"
                onClick={() => void loadTokens()}
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold"
              >
                Actualizar
              </button>
            </div>
            {tokens.length === 0 ? (
              <p className="mt-4 text-sm text-slate-500">
                No hay credenciales registradas o todavía no se han cargado.
              </p>
            ) : (
              <div className="mt-4 space-y-3">
                {tokens.map((t) => (
                  <article
                    key={t.id}
                    className="flex flex-col justify-between gap-3 rounded-xl border border-slate-100 p-4 sm:flex-row sm:items-center"
                  >
                    <div>
                      <p className="font-semibold">{t.client_name}</p>
                      <p className="mt-1 text-sm text-slate-500">
                        Contrato: {t.contract_reference} · Expira:{" "}
                        {new Date(t.expires_at).toLocaleDateString("es-CO")}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {t.scopes?.join(", ")} ·{" "}
                        {t.revoked_at ? "Revocado" : "Activo"}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">{t.purpose}</p>
                    </div>
                    {!t.revoked_at && (
                      <button
                        type="button"
                        disabled={working}
                        onClick={() => void revokeToken(t)}
                        className="rounded-xl border border-red-200 px-3 py-2 text-sm font-semibold text-red-700 disabled:opacity-50"
                      >
                        Revocar acceso
                      </button>
                    )}
                  </article>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </section>
  );
}
