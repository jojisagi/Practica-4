import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/context/AuthContext';
import { ApiError } from '@/services/api';
import { APP_NAME, CONGRESS_NAME, colors } from '@/theme';

export default function LoginScreen() {
  const { signIn } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = username.trim() !== '' && password !== '' && !loading;

  async function handleSubmit() {
    if (!canSubmit) return;
    setLoading(true);
    setError(null);
    try {
      await signIn(username.trim(), password);
      // Al haber sesión, el Stack.Protected del layout manda a la credencial.
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Ocurrió un error inesperado. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      {/* Con edge-to-edge (Android 15+) la ventana ya no se redimensiona con el teclado,
          así que también en Android se agrega padding para que el formulario quede visible. */}
      <KeyboardAvoidingView style={styles.flex} behavior="padding">
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <View style={styles.brand}>
            <Image source={require('../../assets/logo.png')} style={styles.logo} contentFit="contain" />
            <Text style={styles.appName}>{APP_NAME}</Text>
            <Text style={styles.congress}>{CONGRESS_NAME.toUpperCase()}</Text>
            <View style={styles.stripe} />
          </View>

          <View style={styles.form}>
            <Text style={styles.label}>Usuario</Text>
            <TextInput
              style={styles.input}
              value={username}
              onChangeText={setUsername}
              placeholder="Tu usuario"
              placeholderTextColor={colors.aggregate}
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="username"
              textContentType="username"
              returnKeyType="next"
              editable={!loading}
            />

            <Text style={styles.label}>Contraseña</Text>
            <View style={styles.passwordRow}>
              <TextInput
                style={[styles.input, styles.passwordInput]}
                value={password}
                onChangeText={setPassword}
                placeholder="Tu contraseña"
                placeholderTextColor={colors.aggregate}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoComplete="password"
                textContentType="password"
                returnKeyType="go"
                onSubmitEditing={handleSubmit}
                editable={!loading}
              />
              <Pressable
                style={styles.eye}
                onPress={() => setShowPassword((v) => !v)}
                accessibilityLabel={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}>
                <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={22} color={colors.textMuted} />
              </Pressable>
            </View>

            {error && (
              <View style={styles.errorBox} accessibilityLiveRegion="polite">
                <Ionicons name="alert-circle" size={18} color={colors.danger} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <Pressable
              style={({ pressed }) => [styles.button, !canSubmit && styles.buttonDisabled, pressed && styles.buttonPressed]}
              onPress={handleSubmit}
              disabled={!canSubmit}>
              {loading ? <ActivityIndicator color={colors.white} /> : <Text style={styles.buttonText}>Iniciar sesión</Text>}
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.charcoal },
  flex: { flex: 1 },
  container: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  brand: { alignItems: 'center', marginBottom: 32 },
  logo: { width: 140, height: 140 },
  appName: { color: colors.textOnDark, fontSize: 30, fontWeight: '800', marginTop: 8, letterSpacing: 0.5 },
  congress: {
    color: colors.textOnDarkMuted,
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 2,
    textAlign: 'center',
    marginTop: 6,
  },
  stripe: { width: 64, height: 5, borderRadius: 3, backgroundColor: colors.orange, marginTop: 14 },
  form: { backgroundColor: colors.concrete, borderRadius: 16, padding: 20 },
  label: { color: colors.text, fontSize: 14, fontWeight: '600', marginBottom: 6, marginTop: 10 },
  input: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.concreteDark,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text,
  },
  passwordRow: { justifyContent: 'center' },
  passwordInput: { paddingRight: 48 },
  eye: { position: 'absolute', right: 12, padding: 4 },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 14,
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#FBE9E9',
  },
  errorText: { color: colors.danger, flex: 1, fontSize: 14 },
  button: {
    backgroundColor: colors.orange,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonDisabled: { opacity: 0.5 },
  buttonPressed: { backgroundColor: colors.orangeDark },
  buttonText: { color: colors.white, fontSize: 16, fontWeight: '700' },
});
