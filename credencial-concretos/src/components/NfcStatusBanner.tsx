import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { openNfcSettings, type NfcStatus } from '../../modules/nfc-credencial';
import { colors } from '@/theme';

const MESSAGES: Record<Exclude<NfcStatus, 'ready'>, { title: string; body: string }> = {
  disabled: {
    title: 'NFC está apagado',
    body: 'Enciende NFC para que el lector pueda leer tu credencial.',
  },
  'no-nfc': {
    title: 'Este teléfono no tiene NFC',
    body: 'No podrás usar la credencial con el lector. Muestra tu número de usuario en el acceso.',
  },
  'no-hce': {
    title: 'Este teléfono no soporta emulación de tarjeta (HCE)',
    body: 'El lector no podrá leer la credencial desde este dispositivo.',
  },
  unsupported: {
    title: 'NFC no disponible en esta versión',
    body: 'La credencial NFC requiere el APK de Android (no funciona en Expo Go, iOS ni web).',
  },
};

export function NfcStatusBanner({ status }: { status: NfcStatus }) {
  if (status === 'ready') return null;
  const { title, body } = MESSAGES[status];
  const isFixable = status === 'disabled';

  return (
    <View style={[styles.box, isFixable ? styles.warning : styles.error]} accessibilityRole="alert">
      <Ionicons name={isFixable ? 'warning' : 'close-circle'} size={22} color={isFixable ? colors.warning : colors.danger} />
      <View style={styles.texts}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.body}>{body}</Text>
        {isFixable && (
          <Pressable onPress={openNfcSettings} style={styles.button}>
            <Text style={styles.buttonText}>Abrir ajustes de NFC</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { flexDirection: 'row', gap: 10, padding: 14, borderRadius: 12, borderWidth: 1 },
  warning: { backgroundColor: '#FFF6DB', borderColor: colors.warning },
  error: { backgroundColor: '#FBE9E9', borderColor: colors.danger },
  texts: { flex: 1 },
  title: { color: colors.text, fontWeight: '700', fontSize: 15 },
  body: { color: colors.text, fontSize: 13, marginTop: 2 },
  button: {
    alignSelf: 'flex-start',
    marginTop: 10,
    backgroundColor: colors.charcoal,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  buttonText: { color: colors.white, fontWeight: '600', fontSize: 13 },
});
