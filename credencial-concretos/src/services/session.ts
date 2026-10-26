import * as SecureStore from 'expo-secure-store';

import type { Session } from './api';

// En Android, SecureStore cifra los datos con una llave del Android Keystore.
const SESSION_KEY = 'cnc.session';

export async function loadSession(): Promise<Session | null> {
  try {
    const raw = await SecureStore.getItemAsync(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Session;
    return Number.isInteger(parsed?.user?.id) ? parsed : null;
  } catch {
    return null;
  }
}

export async function saveSession(session: Session) {
  await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(session));
}

export async function deleteSession() {
  await SecureStore.deleteItemAsync(SESSION_KEY);
}
