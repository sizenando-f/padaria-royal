export function getApiBaseUrl(): string {
  // 1. Variável de ambiente configurada
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, "");
  }

  // 2. Se estiver rodando no navegador em ambiente local
  if (typeof window !== "undefined") {
    const hostname = window.location.hostname;
    if (hostname === "localhost" || hostname === "127.0.0.1") {
      return "http://localhost:3000";
    }
  }

  // 3. Fallback de produção
  return "https://padaria-royal-api.onrender.com";
}

export async function fetchWithFallback<T = unknown>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("royal_token")
      : null;

  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const primaryBase = getApiBaseUrl();
  const fallbackBase = "https://padaria-royal-api.onrender.com";

  // 1. Tenta a URL principal (localhost se em dev, ou Render em prod)
  try {
    const res = await fetch(`${primaryBase}${endpoint}`, {
      ...options,
      headers,
    });
    if (res.ok) {
      return await res.json();
    }
    console.warn(
      `[API] Resposta com status ${res.status} em ${primaryBase}${endpoint}`
    );
  } catch (err) {
    console.warn(
      `[API] Falha de conexão com ${primaryBase}${endpoint}:`,
      err
    );
  }

  // 2. Se a principal falhar e for diferente do fallback, tenta o fallback
  if (primaryBase !== fallbackBase) {
    try {
      const resFallback = await fetch(`${fallbackBase}${endpoint}`, {
        ...options,
        headers,
      });
      if (resFallback.ok) {
        return await resFallback.json();
      }
      console.warn(
        `[API Fallback] Status ${resFallback.status} em ${fallbackBase}${endpoint}`
      );
    } catch (err) {
      console.warn(
        `[API Fallback] Falha de conexão com ${fallbackBase}${endpoint}:`,
        err
      );
    }
  }

  throw new Error(`Falha ao obter dados da rota ${endpoint}`);
}
