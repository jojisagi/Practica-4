import { Image } from 'expo-image';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { FECHA, GRUPO, INTEGRANTES, TECH_STACK } from '@/constants/creditos';
import { APP_NAME, CONGRESS_NAME, colors } from '@/theme';

export default function CreditosScreen() {
  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Image source={require('../../assets/logo.png')} style={styles.logo} contentFit="contain" />
        <Text style={styles.appName}>{APP_NAME}</Text>
        <Text style={styles.subtitle}>{CONGRESS_NAME}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Integrantes</Text>
        {INTEGRANTES.map((nombre) => (
          <Text key={nombre} style={styles.member}>
            {nombre}
          </Text>
        ))}
        <View style={styles.metaRow}>
          <View style={styles.meta}>
            <Text style={styles.metaLabel}>GRUPO</Text>
            <Text style={styles.metaValue}>{GRUPO}</Text>
          </View>
          <View style={styles.meta}>
            <Text style={styles.metaLabel}>FECHA</Text>
            <Text style={styles.metaValue}>{FECHA}</Text>
          </View>
        </View>
      </View>

      <Text style={styles.stackTitle}>Tech stack</Text>
      <View style={styles.grid}>
        {TECH_STACK.map((tech) => (
          <View key={tech.name} style={styles.tech}>
            <Image source={tech.logo} style={styles.techLogo} contentFit="contain" accessibilityLabel={`Logo de ${tech.name}`} />
            <Text style={styles.techName}>{tech.name}</Text>
            <Text style={styles.techRole}>{tech.role}</Text>
          </View>
        ))}
      </View>
      <Text style={styles.footnote}>Los logotipos son marcas de sus respectivos dueños.</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, gap: 16 },
  header: { alignItems: 'center' },
  logo: { width: 88, height: 88 },
  appName: { color: colors.textOnDark, fontSize: 24, fontWeight: '800', marginTop: 4 },
  subtitle: { color: colors.textOnDarkMuted, fontSize: 14, marginTop: 2 },
  card: { backgroundColor: colors.concrete, borderRadius: 16, padding: 18 },
  sectionTitle: { color: colors.orangeDark, fontSize: 13, fontWeight: '800', letterSpacing: 1.5, marginBottom: 8 },
  member: { color: colors.text, fontSize: 17, fontWeight: '600', paddingVertical: 4 },
  metaRow: { flexDirection: 'row', gap: 12, marginTop: 14 },
  meta: { flex: 1, backgroundColor: colors.white, borderRadius: 10, padding: 10 },
  metaLabel: { color: colors.textMuted, fontSize: 11, fontWeight: '700', letterSpacing: 1.5 },
  metaValue: { color: colors.text, fontSize: 16, fontWeight: '700', marginTop: 2 },
  stackTitle: { color: colors.textOnDark, fontSize: 18, fontWeight: '800', marginTop: 4 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  tech: {
    width: '31%',
    flexGrow: 1,
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
  },
  techLogo: { width: 48, height: 48 },
  techName: { color: colors.text, fontSize: 13, fontWeight: '700', marginTop: 6, textAlign: 'center' },
  techRole: { color: colors.textMuted, fontSize: 11, textAlign: 'center', marginTop: 2 },
  footnote: { color: colors.textOnDarkMuted, fontSize: 11, textAlign: 'center' },
});
