import { NativeModule, Platform, requireOptionalNativeModule } from 'expo';

/** Payload que manda el HostApduService cuando el lector hace el SELECT AID. */
export type ReaderDetectedEvent = {
  /** ID que se envió al lector, o null si no había sesión. */
  userId: number | null;
  /** true si se respondió `[ID] 90 00`; false si se respondió `69 85` (sin sesión). */
  respondedWithId: boolean;
  /** APDU recibido, en hex (ej. "00 A4 04 00 05 F0 12 34 56 78 00"). */
  command: string;
  /** APDU respondido, en hex (ej. "BC 0B 00 00 90 00"). */
  response: string;
  /** Epoch en milisegundos. */
  timestamp: number;
};

type NfcCredencialEvents = {
  onReaderDetected(event: ReaderDetectedEvent): void;
};

declare class NfcCredencialNativeModule extends NativeModule<NfcCredencialEvents> {
  setUserId(id: number): void;
  clearUserId(): void;
  getUserId(): number | null;
  isNfcAvailable(): boolean;
  isNfcEnabled(): boolean;
  isHceSupported(): boolean;
  openNfcSettings(): void;
}

/**
 * null cuando el módulo nativo no existe: iOS, web o Expo Go.
 * La app necesita un development build / APK para usar NFC.
 */
export const NfcCredencial =
  Platform.OS === 'android'
    ? requireOptionalNativeModule<NfcCredencialNativeModule>('NfcCredencial')
    : null;

export type NfcStatus =
  | 'ready' // NFC + HCE disponibles y NFC encendido
  | 'disabled' // tiene NFC pero está apagado
  | 'no-nfc' // el teléfono no tiene NFC
  | 'no-hce' // tiene NFC pero no soporta Host Card Emulation
  | 'unsupported'; // sin módulo nativo (iOS / web / Expo Go)

export function getNfcStatus(): NfcStatus {
  if (!NfcCredencial) return 'unsupported';
  if (!NfcCredencial.isNfcAvailable()) return 'no-nfc';
  if (!NfcCredencial.isHceSupported()) return 'no-hce';
  if (!NfcCredencial.isNfcEnabled()) return 'disabled';
  return 'ready';
}

export function setUserId(id: number) {
  NfcCredencial?.setUserId(id);
}

export function clearUserId() {
  NfcCredencial?.clearUserId();
}

export function isNfcAvailable() {
  return NfcCredencial?.isNfcAvailable() ?? false;
}

export function isHceSupported() {
  return NfcCredencial?.isHceSupported() ?? false;
}

export function openNfcSettings() {
  NfcCredencial?.openNfcSettings();
}

/** Suscribe al evento del lector. Regresa una función para desuscribirse. */
export function addReaderDetectedListener(listener: (event: ReaderDetectedEvent) => void) {
  const subscription = NfcCredencial?.addListener('onReaderDetected', listener);
  return () => subscription?.remove();
}
