/**
 * Configuración de la API de la práctica 2 (MonsterBallGo, del profesor).
 *
 * Los valores se toman de las variables de entorno del archivo .env en la raíz
 * del proyecto (ver README > "Configurar la API"); los valores por defecto son
 * los de la práctica 2.
 *
 *   POST {API_BASE_URL}{LOGIN_PATH}
 *   Content-Type: application/x-www-form-urlencoded
 *   user=<usuario>&pass=<SHA-256 de la contraseña, hex en minúsculas>&token=<API_TOKEN>
 */
export const API_BASE_URL = (process.env.EXPO_PUBLIC_API_URL ?? 'https://monsterballgo.com/api').replace(/\/+$/, '');

export const LOGIN_PATH = process.env.EXPO_PUBLIC_LOGIN_PATH ?? '/login';

/** Token que identifica a la aplicación ante la API (no es secreto: viaja en el APK). */
export const API_TOKEN = process.env.EXPO_PUBLIC_API_TOKEN ?? 'code37';

/** Nombres de los campos del formulario de login. */
export const LOGIN_FIELDS = {
  username: 'user',
  password: 'pass',
  token: 'token',
} as const;

/** Tiempo máximo de espera de la petición de login (ms). */
export const REQUEST_TIMEOUT_MS = 10_000;

/**
 * Modo demo: permite entrar con usuario "demo" / contraseña "demo" SIN llamar a la
 * API, para probar el NFC con el lector sin conexión.
 * Apagado por defecto. Se enciende con EXPO_PUBLIC_DEMO_LOGIN=1 en .env.
 * El ID demo (3004) es el usuario de prueba que aparece en el firmware del profesor.
 */
export const DEMO_LOGIN_ENABLED = process.env.EXPO_PUBLIC_DEMO_LOGIN === '1';
export const DEMO_USER_ID = 3004;
