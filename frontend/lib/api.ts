
const API_URL = process.env.NEXT_PUBLIC_API_URL;

type ApiOptions = RequestInit & {
  params?: Record<string, string | number | boolean | undefined>;
};

export async function apiFetch<T>(
  path: string,
  options: ApiOptions = {},
): Promise<T> {
  if (!API_URL) {
    throw new Error(
      "Falta NEXT_PUBLIC_API_URL en frontend/.env.local",
    );
  }

  const { params, headers, ...requestOptions } = options;

  const baseUrl = API_URL.replace(/\/+$/, "");
  const endpoint = path.replace(/^\/+/, "");
  const url = new URL(`${baseUrl}/${endpoint}`);

  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) {
        url.searchParams.set(key, String(value));
      }
    }
  }

  const requestHeaders = new Headers(headers);

  // Agregar el token de autenticación en el navegador.
  // Se conserva un Authorization enviado explícitamente.
  if (
    typeof window !== "undefined" &&
    !requestHeaders.has("Authorization")
  ) {
    const token = localStorage.getItem("mypetco_token");

    if (token) {
      requestHeaders.set("Authorization", `Bearer ${token}`);
    }
  }

  const isFormData =
    typeof FormData !== "undefined" &&
    requestOptions.body instanceof FormData;

  if (requestOptions.body != null && !isFormData) {
    if (!requestHeaders.has("Content-Type")) {
      requestHeaders.set("Content-Type", "application/json");
    }
  }

  const response = await fetch(url.toString(), {
    ...requestOptions,
    headers: requestHeaders,
    cache: requestOptions.cache ?? "no-store",
  });

  if (!response.ok) {
    const message = await response.text();

    throw new Error(
      `Error de API (${response.status}): ${
        message || response.statusText
      }`,
    );
  }

  if (
    response.status === 204 ||
    response.headers.get("content-length") === "0"
  ) {
    return undefined as T;
  }

  const contentType = response.headers.get("content-type");

  if (!contentType?.includes("application/json")) {
    const text = await response.text();

    if (!text) {
      return undefined as T;
    }

    throw new Error(
      `La API devolvió una respuesta que no es JSON: ${text}`,
    );
  }

  return (await response.json()) as T;
}
