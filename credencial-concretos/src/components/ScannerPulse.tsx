import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';

import { colors } from '@/theme';

/**
 * Ícono NFC con ondas. Cuando `active` cambia de valor (nueva lectura) las ondas
 * se expanden durante ~2 s como indicador visual de "Escáner detectado".
 */
export function ScannerPulse({ trigger, active }: { trigger: number; active: boolean }) {
  const [waves] = useState(() => [new Animated.Value(0), new Animated.Value(0), new Animated.Value(0)]);

  useEffect(() => {
    if (!active) return;
    waves.forEach((w) => w.setValue(0));
    const animation = Animated.stagger(
      250,
      waves.map((w) =>
        Animated.loop(
          Animated.timing(w, { toValue: 1, duration: 900, easing: Easing.out(Easing.quad), useNativeDriver: true }),
          { iterations: 2 }
        )
      )
    );
    animation.start();
    return () => animation.stop();
  }, [trigger, active, waves]);

  return (
    <View style={styles.wrap}>
      {active &&
        waves.map((w, i) => (
          <Animated.View
            key={i}
            style={[
              styles.wave,
              {
                opacity: w.interpolate({ inputRange: [0, 1], outputRange: [0.7, 0] }),
                transform: [{ scale: w.interpolate({ inputRange: [0, 1], outputRange: [1, 2.4] }) }],
              },
            ]}
          />
        ))}
      <View style={[styles.icon, active && styles.iconActive]}>
        <MaterialCommunityIcons name="nfc-variant" size={28} color={colors.white} />
      </View>
    </View>
  );
}

const SIZE = 52;

const styles = StyleSheet.create({
  wrap: { width: SIZE, height: SIZE, alignItems: 'center', justifyContent: 'center' },
  wave: {
    position: 'absolute',
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    borderWidth: 3,
    borderColor: colors.success,
  },
  icon: {
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    backgroundColor: colors.charcoal,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconActive: { backgroundColor: colors.success },
});
