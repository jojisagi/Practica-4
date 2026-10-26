import { CryptoDigestAlgorithm, digestStringAsync } from 'expo-crypto';

import {
  API_BASE_URL,
  API_TOKEN,
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
 * Respuesta real de MonsterBallGo (práctica 2); el id llega como cadena:
 *   { "username": "pocoyo", "id": "999989", "firstname": "Paco", "lastname": "Yopo",
 *     "email": "...", "xp": "0", "credits": "0", "pfp_url": "https://..." }
 * También acepta first_name / last_name (columnas de la tabla `user` del servidor).
 */
export function mapLoginResponse(json: any): Session {
  const u = json?.user ?? json?.data?.user ?? json?.data ?? json;
  const id = Number(u?.id);
  if (!Number.isInteger(id) || id < 0 || id > MAX_USER_ID) {
    throw new ApiError('response', 'La respuesta del servidor no trae un número de usuario válido.');
  }

  const joined = [u?.firstname ?? u?.first_name, u?.lastname ?? u?.last_name].filter((p) => typeof p === 'string' && p.trim()).join(' ');
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

  // La API espera el SHA-256 de la contraseña en hexadecimal y minúsculas.
  const passHash = (await digestStringAsync(CryptoDigestAlgorithm.SHA256, password)).toLowerCase();
  const body = [
    [LOGIN_FIELDS.username, username],
    [LOGIN_FIELDS.password, passHash],
    [LOGIN_FIELDS.token, API_TOKEN],
  ]
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}${LOGIN_PATH}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
      body,
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
    throw new ApiError('credentials', 'Usuario o contraseña incorrectos.');
  }
  if (res.status === 404) {
    throw new ApiError('config', `No existe la ruta ${LOGIN_PATH} en el servidor (revisa EXPO_PUBLIC_LOGIN_PATH).`);
  }
  if (!res.ok) {
    throw new ApiError('server', `El servidor respondió con error ${res.status}.`);
  }

  let json: any;
  try {
    json = await res.json();
  } catch {
    throw new ApiError('response', 'La respuesta del servidor no es JSON válido.');
  }

  // MonsterBallGo responde los errores con HTTP 200 y un campo "error".
  if (typeof json?.error === 'string') {
    if (json.error === 'Failed to login') {
      throw new ApiError('credentials', 'Usuario o contraseña incorrectos.');
    }
    throw new ApiError('server', `El servidor rechazó la petición: ${json.error}`);
  }
  if (json?.id == null || json.id === '') {
    throw new ApiError('credentials', 'Usuario o contraseña incorrectos.');
  }
  return mapLoginResponse(json);
}
