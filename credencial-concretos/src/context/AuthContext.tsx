import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { clearUserId, setUserId } from '../../modules/nfc-credencial';
import { login, type Session } from '@/services/api';
import { deleteSession, loadSession, saveSession } from '@/services/session';

type AuthContextValue = {
  session: Session | null;
  isLoading: boolean;
  signIn: (username: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Al abrir la app se restaura la sesión y se vuelve a sincronizar el ID con
  // la parte nativa (por si se borraron los datos de SharedPreferences).
  useEffect(() => {
    loadSession()
      .then((stored) => {
        if (stored) {
          setUserId(stored.user.id);
        } else {
          clearUserId();
        }
        setSession(stored);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const signIn = useCallback(async (username: string, password: string) => {
    const newSession = await login(username, password);
    await saveSession(newSession);
    // Desde aquí el HostApduService ya puede responder con este ID
    setUserId(newSession.user.id);
    setSession(newSession);
  }, []);

  const signOut = useCallback(async () => {
    // Primero se borra el ID nativo para que el teléfono deje de responder al lector
    clearUserId();
    await deleteSession();
    setSession(null);
  }, []);

  const value = useMemo(() => ({ session, isLoading, signIn, signOut }), [session, isLoading, signIn, signOut]);

  return <AuthContext value={value}>{children}</AuthContext>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
}
