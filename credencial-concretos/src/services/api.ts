import {
  API_BASE_URL,
  DEMO_LOGIN_ENABLED,
  DEMO_USER_ID,
  LOGIN_FIELDS,
  LOGIN_PATH,
  REQUEST_TIMEOUT_MS,
} from '@/config';

export type User = {
  /** Número de usuario; es lo que se envía al lector por NFC (4 bytes). */
  id: number;
  fullName: string;
  pfpUrl: string | null;
};

export type Session = {
  user: User;
  token: string | null;
};

export type ApiErrorKind = 'credentials' | 'network' | 'timeout' | 'server' | 'response' | 'config';

export class ApiError extends Error {
  constructor(
    public kind: ApiErrorKind,
    message: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/** Máximo que cabe en los 4 bytes que lee el firmware (uint32). */
const MAX_USER_ID = 0xffffffff;

function pickString(...values: unknown[]): string | null {
  for (const v of values) {
    if (typeof v === 'string' && v.trim() !== '') return v.trim();
  }
  return null;
}

/**
 * Convierte la respuesta del login al formato que usa la app.
 *
 * TODO(equipo): ajustar a la respuesta real de la API de la práctica 2.
 * Por ahora acepta varias formas comunes:
 *   { id, first_name, last_name, pfp_url, token }
 *   { user: { id, first_name, last_name, pfp_url }, token }
 *   { data: { ... }, access_token }
 * Los campos first_name / last_name / pfp_url coinciden con la tabla `user` que
 * consulta el servidor del profesor (server/scanner.js).
 */
export function mapLoginResponse(json: any): Session {
  const u = json?.user ?? json?.data?.user ?? json?.data ?? json;
  const id = Number(u?.id);
  if (!Number.isInteger(id) || id < 0 || id > MAX_USER_ID) {
    throw new ApiError('response', 'La respuesta del servidor no trae un número de usuario válido.');
  }

  const joined = [u?.first_name, u?.last_name].filter((p) => typeof p === 'string' && p.trim()).join(' ');
  const fullName = pickString(u?.full_name, u?.fullName, u?.nombre_completo, joined, u?.name, u?.nombre, u?.username);

  return {
    user: {
      id,
      fullName: fullName ?? `Usuario ${id}`,
      pfpUrl: pickString(u?.pfp_url, u?.pfpUrl, u?.photo_url, u?.avatar),
    },
    token: pickString(json?.token, json?.access_token, json?.accessToken, json?.data?.token),
  };
}

export async function login(username: string, password: string): Promise<Session> {
  if (DEMO_LOGIN_ENABLED && username === 'demo' && password === 'demo') {
    return { user: { id: DEMO_USER_ID, fullName: 'Usuario de prueba', pfpUrl: null }, token: null };
  }

  if (!API_BASE_URL || API_BASE_URL.includes('TODO')) {
    throw new ApiError('config', 'Falta configurar EXPO_PUBLIC_API_URL (ver README).');
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}${LOGIN_PATH}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ [LOGIN_FIELDS.username]: username, [LOGIN_FIELDS.password]: password }),
      signal: controller.signal,
    });
  } catch {
    if (controller.signal.aborted) {
      throw new ApiError('timeout', 'El servidor tardó demasiado en responder.');
    }
    throw new ApiError('network', 'Sin conexión. Revisa tu internet e inténtalo de nuevo.');
  } finally {
    clearTimeout(timer);
  }

  if (res.status === 400 || res.status === 401 || res.status === 403) {
    // TODO(equipo): confirmar qué código regresa la API con credenciales inválidas.
    throw new ApiError('credentials', 'Usuario o contraseña incorrectos.');
  }
  if (res.status === 404) {
    throw new ApiError('config', `No existe la ruta ${LOGIN_PATH} en el servidor (revisa EXPO_PUBLIC_LOGIN_PATH).`);
  }
  if (!res.ok) {
    throw new ApiError('server', `El servidor respondió con error ${res.status}.`);
  }

  let json: unknown;
  try {
    json = await res.json();
  } catch {
    throw new ApiError('response', 'La respuesta del servidor no es JSON válido.');
  }
  return mapLoginResponse(json);
}
