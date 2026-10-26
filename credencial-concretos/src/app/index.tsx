import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Link } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Animated, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { ReaderDetectedEvent } from '../../modules/nfc-credencial';
import { NfcStatusBanner } from '@/components/NfcStatusBanner';
import { ScannerPulse } from '@/components/ScannerPulse';
import { useAuth } from '@/context/AuthContext';
import { useNfcStatus, useReaderDetected } from '@/hooks/useNfc';
import { CONGRESS_NAME, colors } from '@/theme';

/** Cuánto tiempo se muestra el aviso "Escáner detectado". */
const DETECTED_VISIBLE_MS = 3000;

/** Iniciales del primer y último nombre ("Ana María López" -> "AL"). */
function initials(name: string) {
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  const first = parts[0]![0]!;
  const last = parts.length > 1 ? parts[parts.length - 1]![0]! : '';
  return (first + last).toUpperCase();
}

function formatTime(ms: number) {
  return new Date(ms).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

export default function CredencialScreen() {
  const { session, signOut } = useAuth();
  const nfcStatus = useNfcStatus();
  const [photoFailed, setPhotoFailed] = useState(false);
  const [detection, setDetection] = useState<ReaderDetectedEvent | null>(null);
  const [banner] = useState(() => new Animated.Value(0));

  // La vibración la hace el servicio nativo; aquí solo el aviso visual.
  const onDetected = useCallback((event: ReaderDetectedEvent) => setDetection(event), []);
  const lastEvent = useReaderDetected(onDetected);

  useEffect(() => {
    if (!detection) return;
    Animated.spring(banner, { toValue: 1, useNativeDriver: true }).start();
    const t = setTimeout(() => {
      Animated.timing(banner, { toValue: 0, duration: 250, useNativeDriver: true }).start(() => setDetection(null));
    }, DETECTED_VISIBLE_MS);
    return () => clearTimeout(t);
  }, [detection, banner]);

  if (!session) return null;
  const { user } = session;

  function confirmSignOut() {
    Alert.alert('Cerrar sesión', 'El teléfono dejará de funcionar como credencial hasta que vuelvas a entrar.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Cerrar sesión', style: 'destructive', onPress: () => void signOut() },
    ]);
  }

  return (
    <SafeAreaView style={styles.safe}>
      {/* Barra superior */}
      <View style={styles.topBar}>
        <View style={styles.topBrand}>
          <Image source={require('../../assets/logo.png')} style={styles.topLogo} contentFit="contain" />
          <Text style={styles.topTitle}>CNC Credencial</Text>
        </View>
        <View style={styles.topActions}>
          <Link href="/creditos" asChild>
            <Pressable style={styles.iconButton} accessibilityLabel="Créditos">
              <Ionicons name="information-circle-outline" size={26} color={colors.textOnDark} />
            </Pressable>
          </Link>
          <Pressable style={styles.iconButton} onPress={confirmSignOut} accessibilityLabel="Cerrar sesión">
            <Ionicons name="log-out-outline" size={26} color={colors.textOnDark} />
          </Pressable>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Gafete */}
        <View style={styles.badge}>
          <View style={styles.lanyardHole} />
          <View style={styles.badgeHeader}>
            <Text style={styles.badgeCongress}>{CONGRESS_NAME.toUpperCase()}</Text>
            <View style={styles.rolePill}>
              <Text style={styles.roleText}>ASISTENTE</Text>
            </View>
          </View>

          <View style={styles.photoFrame}>
            {user.pfpUrl && !photoFailed ? (
              <Image
                source={{ uri: user.pfpUrl }}
                style={styles.photo}
                contentFit="cover"
                transition={200}
                onError={() => setPhotoFailed(true)}
                accessibilityLabel={`Foto de ${user.fullName}`}
              />
            ) : (
              <View style={[styles.photo, styles.photoFallback]}>
                <Text style={styles.initials}>{initials(user.fullName)}</Text>
              </View>
            )}
          </View>

          <Text style={styles.name} adjustsFontSizeToFit numberOfLines={2}>
            {user.fullName}
          </Text>

          <View style={styles.divider} />

          <Text style={styles.idLabel}>NÚMERO DE USUARIO</Text>
          <Text style={styles.idValue} selectable>
            {user.id}
          </Text>

          <View style={styles.nfcStrip}>
            <ScannerPulse trigger={detection?.timestamp ?? 0} active={!!detection} />
            <View style={styles.nfcTexts}>
              <Text style={styles.nfcTitle}>{detection ? 'Escáner detectado' : 'Acerca tu teléfono al lector'}</Text>
              <Text style={styles.nfcBody}>
                {lastEvent
                  ? `Última lectura: ${formatTime(lastEvent.timestamp)}`
                  : 'Pantalla encendida y teléfono desbloqueado.'}
              </Text>
            </View>
          </View>
        </View>

        <NfcStatusBanner status={nfcStatus} />
      </ScrollView>

      {/* Aviso flotante al detectar el lector */}
      {detection && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.detectedBanner,
            {
              opacity: banner,
              transform: [{ translateY: banner.interpolate({ inputRange: [0, 1], outputRange: [-80, 0] }) }],
            },
          ]}>
          <Ionicons name="checkmark-circle" size={28} color={colors.white} />
          <View style={styles.flex}>
            <Text style={styles.detectedTitle}>Escáner detectado</Text>
            <Text style={styles.detectedBody}>
              {detection.respondedWithId ? `Se envió tu número ${detection.userId}` : 'No había sesión activa'}
            </Text>
            <Text style={styles.detectedHex}>{detection.response}</Text>
          </View>
        </Animated.View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.charcoal },
  flex: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  topBrand: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  topLogo: { width: 32, height: 32 },
  topTitle: { color: colors.textOnDark, fontSize: 18, fontWeight: '700' },
  topActions: { flexDirection: 'row', gap: 4 },
  iconButton: { padding: 8 },
  content: { padding: 20, gap: 16 },
  badge: {
    backgroundColor: colors.concrete,
    borderRadius: 20,
    overflow: 'hidden',
    alignItems: 'center',
    paddingBottom: 20,
    elevation: 6,
  },
  lanyardHole: {
    position: 'absolute',
    top: 10,
    width: 56,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.charcoal,
    zIndex: 1,
  },
  badgeHeader: {
    alignSelf: 'stretch',
    backgroundColor: colors.orange,
    paddingTop: 30,
    paddingBottom: 56,
    paddingHorizontal: 16,
    alignItems: 'center',
    gap: 8,
  },
  badgeCongress: { color: colors.white, fontWeight: '800', fontSize: 14, letterSpacing: 1.5, textAlign: 'center' },
  rolePill: { backgroundColor: colors.charcoal, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 999 },
  roleText: { color: colors.white, fontSize: 11, fontWeight: '700', letterSpacing: 2 },
  photoFrame: {
    marginTop: -48,
    padding: 4,
    borderRadius: 24,
    backgroundColor: colors.concrete,
  },
  photo: { width: 168, height: 168, borderRadius: 20, backgroundColor: colors.concreteDark },
  photoFallback: { alignItems: 'center', justifyContent: 'center' },
  initials: { fontSize: 56, fontWeight: '800', color: colors.charcoal },
  name: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
    marginTop: 14,
    paddingHorizontal: 20,
  },
  divider: { width: 60, height: 4, borderRadius: 2, backgroundColor: colors.orange, marginVertical: 14 },
  idLabel: { color: colors.textMuted, fontSize: 12, fontWeight: '700', letterSpacing: 2 },
  idValue: {
    color: colors.charcoal,
    fontSize: 44,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
    letterSpacing: 2,
    marginTop: 2,
  },
  nfcStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    alignSelf: 'stretch',
    marginTop: 18,
    marginHorizontal: 16,
    padding: 12,
    borderRadius: 14,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.concreteDark,
  },
  nfcTexts: { flex: 1 },
  nfcTitle: { color: colors.text, fontWeight: '700', fontSize: 15 },
  nfcBody: { color: colors.textMuted, fontSize: 13, marginTop: 2 },
  detectedBanner: {
    position: 'absolute',
    top: 56,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 14,
    backgroundColor: colors.success,
    elevation: 10,
  },
  detectedTitle: { color: colors.white, fontWeight: '800', fontSize: 17 },
  detectedBody: { color: colors.white, fontSize: 13, marginTop: 2 },
  detectedHex: { color: colors.white, fontSize: 12, marginTop: 2, fontFamily: 'monospace', opacity: 0.9 },
});
