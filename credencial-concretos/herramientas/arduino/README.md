# Herramientas Arduino

## `CambiarUID/`: asignar un número de usuario a una tarjeta física

El firmware del lector (`ScannerHTTP.ino`) **no lee el contenido** de las tarjetas físicas.
Usa los últimos 4 bytes del **UID** en **big-endian** como número de usuario. Para que una
tarjeta sea el usuario 3004 (`0x00000BBC`), su UID debe ser `00 00 0B BC`.

El UID de fábrica no se puede cambiar, así que se necesitan tarjetas **MIFARE Classic 1K
"mágicas" Gen2 / CUID**, que tienen el bloque 0 escribible.

### Compilar y subir (Arduino IDE)

1. Copia `PN532` y `PN532_HSU` de `firmware/libraries` del repo del profesor a tu carpeta de
   bibliotecas de Arduino (`~/Documents/Arduino/libraries`). Son las versiones modificadas para
   el Nano ESP32.
2. Placa: **Arduino Nano ESP32** (core `esp32` de Espressif).
3. Si al compilar aparece `'pinMode' was not declared` o `pinMatrixOutAttach declared void`,
   ve a **Herramientas → Pin Numbering → By GPIO number (legacy)**. Con el core 3.2.0 también
   pasa con `ScannerHTTP.ino`. Los LEDs RGB funcionan igual en ese modo.
4. Conecta la PN532 igual que en el lector (HSU en RX/TX) y sube el sketch.

Con `arduino-cli` (el que trae Arduino IDE 2), se compiló así:

```bash
arduino-cli compile --fqbn esp32:esp32:nano_nora:PinNumbers=byGPIONumber --libraries <repo>/firmware/libraries herramientas/arduino/CambiarUID
```

### Uso

1. Abre el **Monitor Serie a 115200**. El sketch espera a que lo abras.
2. Escribe el número de usuario y presiona Enter. Muestra el UID que se va a escribir.
3. Acerca la tarjeta (LED azul = esperando). Se muestran el UID actual, el bloque 0 actual y
   el bloque 0 nuevo.
4. Deja la tarjeta y escribe `S` + Enter para confirmar.
5. Retira la tarjeta y vuelve a acercarla. El sketch muestra el UID nuevo y el id que verá el
   lector.
6. Después **vuelve a subir `ScannerHTTP.ino`** al lector para probar la tarjeta.

### Seguridad del bloque 0

- Solo se cambian los bytes 0–4 (UID + **BCC** = XOR de los 4 bytes). SAK, ATQA y los datos
  del fabricante se conservan tal como venían.
- La biblioteca no confirma la escritura, por eso el sketch vuelve a leer el bloque para
  comprobarla.
- Rechaza IDs cuyo primer byte sea `0x46` o `0xF9`, porque el firmware los remapea a los
  usuarios de prueba 3004 y 111.
- **Gen1a** no se puede escribir con este sketch, porque necesita comandos "backdoor". Usa
  `nfc-mfsetuid` (libnfc) o un Proxmark3.
- Las tarjetas con UID de 7 bytes (NTAG, Ultralight) no están soportadas.
