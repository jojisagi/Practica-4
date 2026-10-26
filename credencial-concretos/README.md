# CNC Credencial: Congreso Nacional sobre Concretos

Credencial digital para los asistentes del congreso. El teléfono **emula una tarjeta NFC**
(Host Card Emulation, HCE) y le entrega al lector del acceso el número de usuario mediante
el protocolo **APDU** (ISO/IEC 7816-4).

Funciona con el sistema de referencia [fmg2099/NFCAccesoFisico](https://github.com/fmg2099/NFCAccesoFisico)
**sin modificar** el servidor ni el firmware (Arduino Nano ESP32 + PN532).

> **Solo Android.** iOS no permite que una app de terceros emule una tarjeta con un AID
> propio para este caso de uso, así que la app no se compila para iOS. Tampoco funciona en
> **Expo Go** ni en web, porque usa un módulo nativo propio. Hay que instalar un
> *development build* o un APK.

## Requisitos

| Herramienta | Versión usada |
| --- | --- |
| Node.js | 24 LTS |
| Expo SDK | 58 (React Native 0.88) |
| JDK | 17 o más reciente (se probó con el JBR de Android Studio) |
| Android SDK | Platform 36+ (Android Studio) |
| Teléfono | Android 7.0+ con NFC y soporte HCE |

## Estructura

```
credencial-concretos/
├── app.json                     # Configuración de Expo + config plugins
├── eas.json                     # Perfiles de EAS Build (APK)
├── .env.example                 # Variables de entorno (URL de la API)
├── src/
│   ├── app/                     # Pantallas (Expo Router)
│   │   ├── _layout.tsx          # Stack + rutas protegidas por sesión
│   │   ├── login.tsx            # Inicio de sesión
│   │   ├── index.tsx            # Credencial (gafete)
│   │   └── creditos.tsx         # Integrantes + tech stack
│   ├── config.ts                # URL / ruta del login (placeholders)
│   ├── services/api.ts          # Login y mapeo de la respuesta de la API
│   ├── services/session.ts      # Sesión en expo-secure-store
│   ├── context/AuthContext.tsx  # Estado de sesión y sincronización del ID con NFC
│   ├── hooks/useNfc.ts          # Estado NFC/HCE y evento del lector
│   └── constants/creditos.ts    # Integrantes, grupo y fecha (placeholders)
└── modules/nfc-credencial/      # Módulo nativo local (Expo Modules API)
    ├── index.ts                 # API para JS
    ├── app.plugin.js            # Config plugin (AndroidManifest + XML del AID)
    └── android/src/main/java/expo/modules/nfccredencial/
        ├── NfcCredencialModule.kt   # Puente JS <-> nativo
        ├── CredencialApduService.kt # HostApduService (responde al lector)
        ├── Apdu.kt                  # AID, status words, conversión little-endian
        └── CredencialStore.kt       # ID en SharedPreferences
```

## 1. Instalar

```bash
npm install
```

## 2. Configurar la API

1. Copia `.env.example` como `.env`.
2. Llena `EXPO_PUBLIC_API_URL` (URL base, sin `/` al final) y `EXPO_PUBLIC_LOGIN_PATH`.
3. Si la API recibe otros nombres de campo, cámbialos en `LOGIN_FIELDS` de `src/config.ts`.
4. Si la respuesta tiene otra forma, ajusta `mapLoginResponse()` en `src/services/api.ts`.
   La app necesita estos datos de la respuesta: `id`, nombre completo (o `first_name` y
   `last_name`), `pfp_url` y el token si la API lo envía.

Para **EAS Build** el archivo `.env` no se sube porque está en `.gitignore`. Pon los mismos
valores en la sección `env` del perfil correspondiente en `eas.json`.

> Si la API usa `http://` en lugar de `https://`, Android bloquea el tráfico sin cifrar en
> los APK de *release*. Usa HTTPS o habilita `usesCleartextTraffic` con `expo-build-properties`.

**Modo demo (opcional):** con `EXPO_PUBLIC_DEMO_LOGIN=1` se puede entrar con `demo` / `demo`
sin llamar a la API. La sesión demo usa el ID 3004, que es el usuario de prueba del firmware
del profesor. Sirve para probar el lector mientras no esté lista la API. Apágalo antes de
entregar.

## 3. Compilar e instalar

### Opción A: local con `prebuild` + `run:android`

Conecta el teléfono por USB con la depuración USB activada.

```bash
npx expo prebuild --platform android --clean
```

```bash
npx expo run:android --device
```

Esto genera la carpeta `android/` (no se edita a mano, se regenera con el config plugin),
compila un *development build*, lo instala y abre Metro. En las siguientes sesiones basta con
`npm start`.

Para un APK independiente, que no necesita Metro:

```bash
npx expo run:android --variant release --device
```

El APK queda en `android/app/build/outputs/apk/release/app-release.apk`. Se firma con la
llave de debug, lo cual sirve para la práctica pero no para Play Store.

> **Ruta con acentos:** si el proyecto está en una carpeta con acentos (por ejemplo,
> "Apps móviles"), Metro puede no detectar los cambios. Reinicia con `npx expo start --clear`
> o mueve el proyecto a una ruta sin acentos ni espacios.

> Si Gradle no encuentra Java o el SDK, exporta antes:
> `export JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home"` y
> `export ANDROID_HOME="$HOME/Library/Android/sdk"`.

### Opción B: EAS Build (en la nube)

```bash
npx eas-cli@latest login
```

```bash
npx eas-cli@latest build -p android --profile preview
```

- `preview`: APK independiente (`buildType: apk`), listo para instalar.
- `development`: APK de *development build* (`developmentClient: true`), que se usa con `npm start`.

Al terminar, EAS da un enlace o QR para descargar el `.apk`.

### Instalar el APK

Con el teléfono conectado:

```bash
adb install -r app-release.apk
```

También puedes copiar el `.apk` al teléfono y abrirlo, permitiendo "instalar apps de origen
desconocido".

## 4. Probar con el lector

1. **Desinstala la app de ejemplo del profesor** si la tienes. Registra el mismo AID
   (`F012345678`) y Android no sabría a qué app mandar el comando.
2. Activa NFC en el teléfono. La app avisa si está apagado y abre los ajustes.
3. Inicia sesión. La credencial muestra tu foto, tu nombre y tu número de usuario.
4. Con la **pantalla encendida y el teléfono desbloqueado**, acerca la parte trasera al PN532.
5. El teléfono vibra y aparece **"Escáner detectado"** con la respuesta APDU enviada.
   El LED del lector se pone verde o rojo según lo que responda el servidor. La app no sabe
   el resultado, eso solo lo indica el lector.

Para ver el tráfico APDU en la computadora:

```bash
adb logcat -s CredencialAPDU
```

## Protocolo APDU implementado

| Dirección | Bytes | Significado |
| --- | --- | --- |
| Lector → teléfono | `00 A4 04 00 05 F0 12 34 56 78 00` | SELECT por nombre del AID `F012345678` |
| Teléfono → lector | `[ID0 ID1 ID2 ID3] 90 00` | ID en 4 bytes **little-endian** + éxito |
| Teléfono → lector | `69 85` | No hay sesión iniciada (no se envía ningún ID) |
| Teléfono → lector | `6A 82` | SELECT de otro AID |
| Teléfono → lector | `6D 00` | Comando no soportado |

**¿Por qué little-endian?** El firmware copia los 4 bytes con `memcpy(&id, userId, 4)` sobre
un `uint32_t` en un ESP32, que es little-endian. Por ejemplo, el ID 3004 (`0x00000BBC`) se
envía como `BC 0B 00 00 90 00`.

Hay una excepción en el firmware: antes de ese `memcpy` revisa `userId[3]` (`0xFE` lo
convierte en 3004 y `0xDE` en 111) para los IDs de prueba de la app del profesor. En
little-endian `userId[3]` es el byte más significativo, así que esto solo afectaría a IDs
≥ `0xDE000000` (unos 3,700 millones).

## Tarjetas NFC físicas

El lector identifica las tarjetas físicas por su **UID** (big-endian), no por su contenido.
Para asignar un número de usuario a una tarjeta MIFARE Classic "mágica" (Gen2/CUID), usa el
sketch [`herramientas/arduino/CambiarUID`](herramientas/arduino/README.md).

## Créditos y placeholders

Antes de entregar, llena los valores en:

- `src/constants/creditos.ts`: integrantes, grupo y fecha.
- `.env` y `eas.json`: URL y ruta de la API.

Busca `TODO(equipo)` en el proyecto para encontrar todo lo pendiente.
