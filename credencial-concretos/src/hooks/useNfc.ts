import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

import {
  addReaderDetectedListener,
  getNfcStatus,
  type NfcStatus,
  type ReaderDetectedEvent,
} from '../../modules/nfc-credencial';

/**
 * Estado de NFC/HCE del teléfono. Se vuelve a revisar cada vez que la app
 * regresa al primer plano (por ejemplo, después de encender NFC en ajustes).
 */
export function useNfcStatus(): NfcStatus {
  const [status, setStatus] = useState<NfcStatus>(() => getNfcStatus());

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') setStatus(getNfcStatus());
    });
    return () => sub.remove();
  }, []);

  return status;
}

/** Última petición del lector recibida por el HostApduService. */
export function useReaderDetected(onDetected?: (event: ReaderDetectedEvent) => void) {
  const [lastEvent, setLastEvent] = useState<ReaderDetectedEvent | null>(null);

  useEffect(() => {
    return addReaderDetectedListener((event) => {
      setLastEvent(event);
      onDetected?.(event);
    });
  }, [onDetected]);

  return lastEvent;
}
