# Notas para el reporte (apoyo, no es el reporte)

> Este archivo es material de trabajo para el equipo: capturas pendientes, bitácora de
> problemas, ideas de mejoras y fuentes. Las conclusiones las redacta el equipo.

## 1. Capturas / fotos por tomar

- [ ] **Login**: pantalla vacía con logotipo y nombre de la app.
- [ ] **Login con error**: credenciales inválidas.
- [ ] **Login con error de red**: modo avión activado ("Sin conexión…").
- [ ] **Credencial**: foto, nombre completo y número de usuario.
- [ ] **Credencial sin foto**: muestra las iniciales cuando `pfp_url` está vacío o falla.
- [ ] **Credencial al leer**: aviso "Escáner detectado" con la respuesta APDU (ej. `BC 0B 00 00 90 00`).
- [ ] **Aviso NFC apagado**: banner amarillo con el botón "Abrir ajustes de NFC".
- [ ] **Confirmación de cerrar sesión**.
- [ ] **Créditos**: integrantes, grupo, fecha y tech stack.
- [ ] **Panel web** (`/panel` del servidor) mostrando el intento de acceso del usuario.
- [ ] **Foto del lector con LED verde** (usuario `active`).
- [ ] **Foto del lector con LED rojo** (usuario inexistente o no `active`).
- [ ] (Opcional) `adb logcat -s CredencialAPDU` con el APDU de entrada y salida.
- [ ] (Opcional) Monitor serial del Arduino con `Respuesta del Android: …` e `id:::…`.
- [ ] (Opcional) Ajustes > NFC > Pago sin contacto / Otras, donde aparece el servicio.
- [ ] Monitor Serie de `CambiarUID` con el UID antes y después de escribirlo.
- [ ] Tarjeta física con UID programado: LED verde en el lector y entrada en el panel web.

## 2. Bitácora de problemas y soluciones

| # | Problema | Causa | Solución |
| --- | --- | --- | --- |
| 1 | Orden de bytes del ID. La app Kotlin de ejemplo envía big-endian (`DE AD CA FE`). | El firmware hace `memcpy(&id, userId, 4)` en un ESP32 (little-endian). El ejemplo "funciona" porque el firmware tiene un mapeo especial: si `userId[3]` es `0xFE` lo trata como 3004 y si es `0xDE` como 111. | Se envía el ID en **little-endian** (`Apdu.idToLittleEndian`). Ej.: 3004 → `BC 0B 00 00`. Ese mapeo especial solo afectaría a IDs ≥ `0xDE000000`. |
| 2 | HCE no existe en JavaScript ni en Expo Go. | `HostApduService` es un servicio nativo de Android. | Se creó un módulo local con Expo Modules API (Kotlin) y un config plugin que registra el servicio en el `AndroidManifest`. Requiere un *development build* o un APK. |
| 3 | La carpeta `android/` se regenera con `prebuild` y se perderían los cambios hechos a mano. | Continuous Native Generation de Expo. | El config plugin (`app.plugin.js`) agrega en cada prebuild el servicio, los permisos, el `intent-filter` con `category DEFAULT` y el XML del AID. |
| 4 | `npm` fallaba con `ERESOLVE` al instalar o desinstalar paquetes. | `expo-router` trae `react-dom` como dependencia opcional; npm instaló `react-dom@19.3.1`, que exige `react@^19.3.1`, pero Expo SDK 58 fija `react@19.3.0`. | `npx expo install react-dom` fija `react-dom@19.3.0`, compatible con el SDK. |
| 5 | ESLint (`react-hooks/refs`) marcaba error al usar `useRef(new Animated.Value(0)).current`. | Las reglas nuevas de React prohíben leer refs durante el render. | Se creó el valor animado con `useState(() => new Animated.Value(0))`. |
| 6 | Aviso de `prebuild`: `userInterfaceStyle` necesita `expo-system-ui`. | Paquete faltante. | `npx expo install expo-system-ui`. |
| 7 | La plantilla agregaba permisos de almacenamiento que no se usan. | Permisos por defecto de la plantilla de Expo. | Se bloquearon con `android.blockedPermissions` en `app.json`. |
| 8 | Si la app no está abierta, JS no puede responder al lector. | El proceso de JS puede no existir cuando llega el APDU. | El ID se guarda en SharedPreferences y el servicio nativo responde y vibra por su cuenta. El evento a JS es solo para la animación. |
| 10 | `expo-doctor` reportó que faltaba `expo-font`, que es peer de `@expo/vector-icons`. | Las dependencias nativas de los peers deben instalarse directamente en el proyecto. | `npx expo install expo-font` y recompilar. La primera compilación local de Gradle tardó unos 12 min y las siguientes son incrementales. |
| 11 | En el emulador (Android 16), el teclado tapaba la contraseña y el botón de iniciar sesión. | Con *edge-to-edge* (obligatorio desde Android 15) la ventana ya no se redimensiona con el teclado (`adjustResize` deja de funcionar), y `KeyboardAvoidingView` solo estaba activo en iOS. | `KeyboardAvoidingView` con `behavior="padding"` también en Android. Verificado en el emulador. |
| 12 | Metro no recargaba los cambios (ni Fast Refresh ni Reload). | La carpeta del proyecto tiene acentos ("Apps móviles"). macOS entrega la ruta en forma Unicode descompuesta (NFD) y el observador de archivos de Metro no relaciona los eventos con los archivos. No está instalado `watchman`. | Reiniciar Metro con `npx expo start --clear` después de cada cambio, o mover el proyecto a una ruta sin acentos ni espacios (o instalar `watchman`). |
| 13 | Al probar en el emulador, la app mostraba "Este teléfono no tiene NFC". | El emulador de Android no tiene NFC ni HCE. | Es el comportamiento esperado. Sirve como evidencia del aviso. La prueba del APDU solo se puede hacer en un teléfono físico con el lector. |
| 14 | Las tarjetas NFC no "se programan" como esperábamos: escribir datos (NDEF) no tiene efecto en el lector. | Para tarjetas físicas, `ScannerHTTP.ino` solo usa el **UID** (últimos 4 bytes, big-endian). Nunca lee el contenido. El UID de fábrica no se puede cambiar. | Usar tarjetas MIFARE Classic "mágicas" Gen2/CUID y escribirles en el bloque 0 un UID igual al número de usuario, con el sketch `herramientas/arduino/CambiarUID` (ver sección 2.1). |
| 15 | `ScannerHTTP.ino` y `CambiarUID.ino` no compilaban (`'pinMode' was not declared`, `pinMatrixOutAttach declared void`). | Problema del core `esp32` 3.2.0 con la reasignación de pines del Nano ESP32 (modo "By Arduino pin"). | Herramientas → Pin Numbering → **By GPIO number (legacy)** (`PinNumbers=byGPIONumber`). Así compilan los dos sketches. Los LEDs RGB tienen la misma definición en ese modo. |
| 16 | El primer teléfono de pruebas (Redmi Note 12, modelo 23028RA60L) no sirve para la credencial. | Esa variante del Redmi Note 12 no tiene chip NFC (`pm list features` no reporta `android.hardware.nfc` ni `nfc.hce`). Otras variantes del mismo modelo sí lo traen. | La app se instala y corre, pero muestra el aviso "Este teléfono no tiene NFC". Hay que probar con un teléfono que tenga NFC y HCE. Se puede revisar con NFC Tools o en Ajustes → Conexión y compartir. |
| 17 | Después de cambiar los nombres en Créditos, el APK de release recompilado (`assembleRelease`, BUILD SUCCESSFUL) seguía mostrando los placeholders. | Gradle reutilizó el bundle de JavaScript ya generado (`app/build/generated/assets/react/release`) sin detectar el cambio en `src/`. | Se borró el bundle generado para forzar `createBundleReleaseJsAndAssets` y se verificó en el emulador que aparecieran los nombres. Lección: comprobar el APK resultante, no solo el mensaje de éxito. |
| 18 | Al regenerar el bundle, `packageReleaseResources` falló con "' ' is not a valid file-based resource name character" en archivos como `ic_launcher_background 2.xml`. | La carpeta Escritorio se sincroniza con iCloud, que creó copias en conflicto con el sufijo " 2" dentro de `android/`. Android no acepta espacios en nombres de recursos. | Se borraron las copias " 2" de las carpetas generadas (`android/` y `build/` del módulo). A futuro conviene tener el proyecto fuera de carpetas sincronizadas. |
| 9 | (Por verificar en el teléfono) Conflicto de AID con la app de ejemplo del profesor. | Dos apps registran `F012345678` en la categoría `other`. | Desinstalar la app de ejemplo antes de probar. |

_Agregar aquí lo que pase al probar con el lector real: distancia de lectura, pantalla bloqueada, tiempos, etc._

## 2.1 Tarjetas físicas: cómo las identifica el lector

Comparación de los dos caminos del firmware (útil para el Análisis de Resultados):

| | Teléfono (HCE) | Tarjeta física |
| --- | --- | --- |
| Cómo se detecta | `inDataExchange` con el `SELECT AID` tiene éxito | El `SELECT AID` falla, así que el firmware asume que es una tarjeta |
| De dónde sale el ID | Primeros 4 bytes de la respuesta APDU | Últimos 4 bytes del **UID** |
| Orden de bytes | **Little-endian** (`memcpy` en el ESP32) | **Big-endian** (desplazamientos `<<24 … <<0`) |
| Usuario 3004 | El teléfono responde `BC 0B 00 00 90 00` | La tarjeta debe tener UID `00 00 0B BC` (BCC `B7`) |
| ¿Se puede cambiar? | Sí, la app lo cambia al iniciar sesión | Solo con tarjetas "mágicas" (bloque 0 escribible) |
| Seguridad | El ID viaja en claro | El UID viaja en claro y se puede clonar con una tarjeta mágica |

Esa última fila sirve como argumento: **cualquiera con una tarjeta mágica de pocos pesos puede
clonar el UID de una credencial física**. Es justo lo que hace el sketch `CambiarUID`.

## 3. Ideas para "mejoras a futuro"

**Protocolo / NFC**
- No enviar un ID fijo. Usar un **reto-respuesta**: el lector envía un nonce en un segundo APDU y el teléfono responde con HMAC(nonce, llave del usuario). Así una captura no se puede repetir (ataque de *replay*).
- Usar **tokens de un solo uso o rotativos** (TOTP) emitidos por el servidor en lugar del ID.
- Pedir el AID propietario completo (prefijo `F0` + RID registrado) para evitar choques con otras apps.
- Que el firmware valide los dos bytes del status word (`90 00`) y la longitud de la respuesta, no solo `0x90`.
- Mandar al lector una versión del protocolo en la respuesta para poder cambiar el formato después.

**Seguridad**
- El ID viaja en claro por NFC. Se puede leer con otro teléfono a unos centímetros (*skimming*).
- El endpoint del escáner usa **HTTP** y un token fijo (`code37`) en la URL. Usar HTTPS (mbedTLS en el ESP32) y una llave por dispositivo.
- Usar la llave del Android Keystore para firmar las respuestas.
- Revocar la sesión o el token desde el servidor cuando se pierda el teléfono.
- Las tarjetas físicas se identifican solo por UID, que se puede clonar con una tarjeta mágica. Conviene usar tarjetas con criptografía (p. ej. MIFARE DESFire EV2/EV3 con autenticación AES) o leer un dato firmado guardado en la tarjeta.
- Mantener `requireDeviceUnlock="true"`. Opcionalmente pedir biometría antes de mostrar la credencial.

**Panel web / servidor**
- Historial de accesos con filtros (fecha, usuario, resultado) y exportación.
- Autenticación del panel (hoy cualquiera con la URL ve los accesos).
- Varios lectores (puertas o salas del congreso) identificados por ID de dispositivo.
- Control de aforo por sala y estadísticas de asistencia a conferencias.
- Avisar a la app (push) cuando se concede o niega el acceso.

**App**
- Modo sin conexión: la credencial ya funciona sin red, pero se podría cachear la foto.
- Mostrar un QR de respaldo para teléfonos sin NFC.
- Agenda del congreso y constancias de asistencia.

## 4. Fuentes oficiales consultadas

- Android Developers, *Host-based card emulation overview*: https://developer.android.com/develop/connectivity/nfc/hce
- Android Developers, referencia de `HostApduService`: https://developer.android.com/reference/android/nfc/cardemulation/HostApduService
- Expo, *Expo Modules API: Get started*: https://docs.expo.dev/modules/get-started/
- Expo, *Module API reference*: https://docs.expo.dev/modules/module-api/
- Expo, *Config plugins* y *Mods*: https://docs.expo.dev/config-plugins/plugins/ · https://docs.expo.dev/config-plugins/mods/
- Expo, *Build APKs for Android*: https://docs.expo.dev/build-reference/apk/
- Expo, *SecureStore* (SDK 58): https://docs.expo.dev/versions/v58.0.0/sdk/securestore/
- Expo Router, instalación: https://docs.expo.dev/router/installation/
- ISO/IEC 7816-4, *Identification cards — Integrated circuit cards — Part 4: Organization, security and commands for interchange*: https://www.iso.org/standard/77180.html
- Elechouse, *PN532 NFC Module User Manual V3* (enlace en el README del repo del profesor).
- NXP, hoja de datos *MF1S50YYX — MIFARE Classic EV1 1K* (estructura del bloque 0, UID, BCC, llaves): https://www.nxp.com/docs/en/data-sheet/MF1S50YYX_V1.pdf (abre en navegador; NXP rechaza descargas desde terminal)
- NXP, hoja de datos *PN532/C1 — Near Field Communication (NFC) controller*, Rev. 3.6: https://www.nxp.com/docs/en/nxp/data-sheets/PN532_C1.pdf
- Ediciones verificadas en iso.org: ISO/IEC 7816-4:2020, ISO/IEC 14443-3:2018, ISO/IEC 14443-4:2018. El reporte final está en `../reporte/`.
- Repositorio de referencia del profesor: https://github.com/fmg2099/NFCAccesoFisico
- Devicon (logos del tech stack, MIT): https://devicon.dev

_Revisar que cada enlace siga abierto y anotar la fecha de consulta antes de citar._
