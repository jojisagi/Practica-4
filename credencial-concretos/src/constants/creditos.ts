export const INTEGRANTES: string[] = [
  'Héctor Armando González Espinosa',
  'Juan Manuel Palafox Valdés',
  'Jorge Sánchez Girón',
];
// TODO(equipo): llenar grupo y fecha antes de entregar.
export const GRUPO = '[GRUPO]';
export const FECHA = '[FECHA]';

// require() de una imagen local regresa un número (id del asset)
export type TechItem = { name: string; role: string; logo: number };

/** Logos oficiales (fuente: Devicon, licencia MIT). Ver assets/logos/README.md */
export const TECH_STACK: TechItem[] = [
  { name: 'React Native', role: 'Interfaz de la app', logo: require('../../assets/logos/react.png') },
  { name: 'Expo', role: 'SDK, Router y Modules API', logo: require('../../assets/logos/expo.png') },
  { name: 'TypeScript', role: 'Lógica de la app', logo: require('../../assets/logos/typescript.png') },
  { name: 'Kotlin', role: 'HostApduService (HCE)', logo: require('../../assets/logos/kotlin.png') },
  { name: 'Android', role: 'NFC Host Card Emulation', logo: require('../../assets/logos/android.png') },
  { name: 'Node.js', role: 'Servidor de acceso', logo: require('../../assets/logos/nodejs.png') },
  { name: 'Express', role: 'Endpoint del escáner', logo: require('../../assets/logos/express.png') },
  { name: 'MySQL', role: 'Base de datos de usuarios', logo: require('../../assets/logos/mysql.png') },
  { name: 'Arduino', role: 'Nano ESP32 + PN532', logo: require('../../assets/logos/arduino.png') },
];
