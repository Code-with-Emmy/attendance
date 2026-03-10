import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type FetchOptions = Omit<RequestInit, "body"> & {
  body?:
    | BodyInit
    | Record<string, unknown>
    | unknown[]
    | null;
  accessToken?: string;
  kioskToken?: string;
  requireAuth?: boolean;
};

export async function apiFetch<T>(path: string, options: FetchOptions = {}): Promise<T> {
  const requireAuth = options.requireAuth !== false;
  let token = options.accessToken;

  if (!token && requireAuth) {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
    }
    const { data } = await supabase.auth.getSession();
    token = data.session?.access_token;
  }

  if (requireAuth && !token) {
    throw new Error("Not authenticated.");
  }

  const headers = new Headers(options.headers);
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  let body = options.body;
  if (body && typeof body === "object" && !(body instanceof Blob) && !(body instanceof ArrayBuffer) && !(body instanceof FormData) && !(body instanceof URLSearchParams)) {
    body = JSON.stringify(body);
    if (!headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }
  }

  const response = await fetch(path, {
    ...options,
    body,
    headers,
    cache: "no-store",
  });

  let data: unknown = null;
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    data = await response.json();
  }

  if (!response.ok) {
    const message =
      (typeof data === "object" && data && "error" in data && typeof data.error === "string"
        ? data.error
        : null) || `Request failed with status ${response.status}`;
    const error = new Error(message);
    (error as { status?: number }).status = response.status;
    throw error;
  }

  return data as T;
}
