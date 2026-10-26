/**
 * Configuración de la API de la práctica 2.
 *
 * La URL base se toma de la variable de entorno EXPO_PUBLIC_API_URL (archivo .env
 * en la raíz del proyecto). Ver README > "Configurar la API".
 *
 * TODO(equipo): confirmar la ruta del endpoint de login y los nombres de los
 * campos del cuerpo. Si la respuesta tiene otra forma, ajustar
 * `mapLoginResponse` en src/services/api.ts.
 */
export const API_BASE_URL = (process.env.EXPO_PUBLIC_API_URL ?? '').replace(/\/+$/, '');

/** TODO(equipo): ruta real del login (ej. "/api/login"). */
export const LOGIN_PATH = process.env.EXPO_PUBLIC_LOGIN_PATH ?? '/api/login';

/** TODO(equipo): nombres de los campos que espera el endpoint de login. */
export const LOGIN_FIELDS = {
  username: 'username',
  password: 'password',
} as const;

/** Tiempo máximo de espera de la petición de login (ms). */
export const REQUEST_TIMEOUT_MS = 10_000;

/**
 * Modo demo: permite entrar con usuario "demo" / contraseña "demo" SIN llamar a la
 * API, para probar el NFC con el lector antes de tener la API configurada.
 * Apagado por defecto. Se enciende con EXPO_PUBLIC_DEMO_LOGIN=1 en .env.
 * El ID demo (3004) es el usuario de prueba que aparece en el firmware del profesor.
 */
export const DEMO_LOGIN_ENABLED = process.env.EXPO_PUBLIC_DEMO_LOGIN === '1';
export const DEMO_USER_ID = 3004;
