/**************************************************************************/
/*
	CambiarUID: escribe un número de usuario como UID de una tarjeta
	MIFARE Classic 1K "mágica" (Gen2 / CUID, con bloque 0 escribible).

	¿Por qué el UID? El firmware ScannerHTTP.ino del profesor, para tarjetas
	físicas, NO lee el contenido de la tarjeta: toma los últimos 4 bytes del
	UID y los convierte a número en BIG-ENDIAN:
	    id = (uid[0] << 24) | (uid[1] << 16) | (uid[2] << 8) | uid[3]
	Así que para que la tarjeta sea el usuario 3004 (0x00000BBC) su UID debe
	ser 00 00 0B BC. (Ojo: el teléfono envía el ID en little-endian, por APDU;
	son caminos distintos en el firmware.)

	Estructura del bloque 0 de una MIFARE Classic 1K con UID de 4 bytes:
	    [UID0 UID1 UID2 UID3] [BCC] [SAK] [ATQA x2] [datos del fabricante x8]
	    BCC = UID0 ^ UID1 ^ UID2 ^ UID3   (si está mal, la tarjeta deja de leerse)
	Este sketch lee el bloque 0 actual y SOLO reemplaza los bytes 0..4
	(UID + BCC); conserva SAK, ATQA y datos del fabricante.

	Hardware: el mismo del lector (Arduino Nano ESP32 + PN532 en modo HSU),
	con las bibliotecas modificadas de firmware/libraries del repo del profesor.

	Uso:
	  1. Sube el sketch y abre el Monitor Serie a 115200 baudios.
	  2. Escribe el número de usuario y presiona Enter.
	  3. Acerca la tarjeta, revisa el UID nuevo y confirma con "S".
	  4. Retira la tarjeta y vuelve a acercarla para verificar.

	Limitaciones:
	  - Solo tarjetas Gen2/CUID (se escriben con el comando normal de escritura
	    tras autenticarse con la llave por defecto FF FF FF FF FF FF).
	  - Las Gen1a usan comandos "backdoor" que esta biblioteca no soporta; para
	    ellas usa `nfc-mfsetuid` (libnfc) o un Proxmark3.
	  - Una tarjeta normal (no mágica) rechaza la escritura del bloque 0.
*/
/**************************************************************************/
#include <PN532_HSU.h>
#include <PN532.h>

// En el Arduino Nano ESP32 los pines Rx y Tx corresponden al serial 0
PN532_HSU pn532hsu(Serial0);
PN532 nfc(pn532hsu);

// Llave A de fábrica de las tarjetas MIFARE Classic
uint8_t KEY_DEFAULT[6] = { 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF };

uint32_t nuevoId = 0;

//funcion de ayuda para encender las luces RGB (invertidas en el Nano)
void rgb(bool R, bool G, bool B)
{
	digitalWrite(LED_RED, !R);
	digitalWrite(LED_GREEN, !G);
	digitalWrite(LED_BLUE, !B);
}

void printHex(const uint8_t* data, size_t len)
{
	for (size_t i = 0; i < len; i++) {
		if (data[i] < 0x10) Serial.print('0');
		Serial.print(data[i], HEX);
		Serial.print(i + 1 < len ? " " : "");
	}
	Serial.println();
}

// Misma conversión que hace ScannerHTTP.ino con las tarjetas físicas
uint32_t uidToId(const uint8_t* uid, uint8_t len)
{
	const uint8_t* p = &uid[len - 4];
	return ((uint32_t)p[0] << 24) | ((uint32_t)p[1] << 16) | ((uint32_t)p[2] << 8) | (uint32_t)p[3];
}

// Lee una línea completa del Monitor Serie (bloquea hasta recibir Enter)
String leerLinea()
{
	while (true) {
		if (Serial.available()) {
			String s = Serial.readStringUntil('\n');
			s.trim();
			if (s.length() > 0) return s;
		}
		delay(10);
	}
}

// Espera hasta que haya una tarjeta enfrente del lector
void esperarTarjeta(uint8_t* uid, uint8_t* uidLen)
{
	while (!nfc.readPassiveTargetID(PN532_MIFARE_ISO14443A, uid, uidLen)) {
		delay(100);
	}
}

void pedirId()
{
	while (true) {
		Serial.println();
		Serial.println("Escribe el numero de usuario (1 a 4294967295) y presiona Enter:");
		String s = leerLinea();
		char* fin;
		unsigned long long valor = strtoull(s.c_str(), &fin, 10);
		if (*fin != '\0' || valor == 0 || valor > 0xFFFFFFFFULL) {
			Serial.println("Numero invalido.");
			continue;
		}
		uint8_t msb = (uint8_t)(valor >> 24);
		// El firmware trata el byte uid[len-4] == 0x46 como 3004 y == 0xF9 como 111
		// (mapeo de pruebas), asi que esos IDs nunca llegarian al servidor tal cual.
		if (msb == 0x46 || msb == 0xF9) {
			Serial.println("Ese ID empieza con 0x46 o 0xF9: el firmware lo remapea. Usa otro.");
			continue;
		}
		nuevoId = (uint32_t)valor;
		Serial.print("ID a escribir: ");
		Serial.print(nuevoId);
		Serial.print("  -> UID ");
		uint8_t uid[4] = { (uint8_t)(nuevoId >> 24), (uint8_t)(nuevoId >> 16), (uint8_t)(nuevoId >> 8), (uint8_t)nuevoId };
		printHex(uid, 4);
		return;
	}
}

void setup(void)
{
	pinMode(LED_RED, OUTPUT);
	pinMode(LED_GREEN, OUTPUT);
	pinMode(LED_BLUE, OUTPUT);
	rgb(0, 0, 0);

	Serial.begin(115200);
	// Este sketch es interactivo: esperar a que se abra el Monitor Serie
	while (!Serial) { delay(10); }
	Serial.println("\n=== CambiarUID (MIFARE Classic Gen2/CUID) ===");

	// Inicializar la PN532 igual que ScannerHTTP.ino
	Serial0.begin(115200);
	Serial0.write(0x55);
	Serial0.write(0x55);
	Serial0.write(0);
	Serial0.write(0);
	Serial0.write(0);
	delay(50);
	while (Serial0.available()) Serial0.read();

	uint32_t versiondata = nfc.getFirmwareVersion();
	if (!versiondata) {
		Serial.println("PN532 no encontrada. Revisa conexiones y modo HSU.");
		rgb(1, 0, 0);
		while (1) { delay(1000); }
	}
	Serial.print("PN532 encontrada, firmware ");
	Serial.print((versiondata >> 16) & 0xFF, DEC);
	Serial.print('.');
	Serial.println((versiondata >> 8) & 0xFF, DEC);
	nfc.SAMConfig();

	pedirId();
}

void loop(void)
{
	uint8_t uid[10];
	uint8_t uidLen = 0;

	Serial.println();
	Serial.println("Acerca la tarjeta al lector...");
	rgb(0, 0, 1);
	esperarTarjeta(uid, &uidLen);
	rgb(0, 0, 0);

	Serial.print("UID actual: ");
	printHex(uid, uidLen);
	if (uidLen != 4) {
		Serial.println("Esta tarjeta tiene UID de 7 bytes (p. ej. NTAG). Este sketch solo maneja MIFARE Classic de 4 bytes.");
		delay(2000);
		return;
	}
	Serial.print("El lector hoy la ve como id ");
	Serial.println(uidToId(uid, uidLen));

	// Autenticar el sector 0 con la llave A por defecto y leer el bloque 0
	if (!nfc.mifareclassic_AuthenticateBlock(uid, uidLen, 0, 0, KEY_DEFAULT)) {
		Serial.println("No se pudo autenticar el bloque 0 con la llave FFFFFFFFFFFF.");
		Serial.println("Puede ser una tarjeta Gen1a (usa nfc-mfsetuid) o con otra llave.");
		rgb(1, 0, 0); delay(1500); rgb(0, 0, 0);
		return;
	}
	uint8_t bloque[16];
	if (!nfc.mifareclassic_ReadDataBlock(0, bloque)) {
		Serial.println("No se pudo leer el bloque 0.");
		return;
	}
	Serial.print("Bloque 0 actual: ");
	printHex(bloque, 16);

	// Construir el bloque nuevo: UID en big-endian + BCC; el resto se conserva
	uint8_t nuevo[16];
	memcpy(nuevo, bloque, 16);
	nuevo[0] = (uint8_t)(nuevoId >> 24);
	nuevo[1] = (uint8_t)(nuevoId >> 16);
	nuevo[2] = (uint8_t)(nuevoId >> 8);
	nuevo[3] = (uint8_t)(nuevoId);
	nuevo[4] = nuevo[0] ^ nuevo[1] ^ nuevo[2] ^ nuevo[3]; // BCC
	Serial.print("Bloque 0 nuevo:  ");
	printHex(nuevo, 16);

	Serial.println("Deja la tarjeta en el lector. Escribe S y Enter para escribir (otra cosa cancela):");
	String r = leerLinea();
	if (!(r == "S" || r == "s")) {
		Serial.println("Cancelado. Retira la tarjeta.");
		delay(2000);
		return;
	}

	// Volver a seleccionar y autenticar: la tarjeta pudo salir del campo mientras se confirmaba
	uint8_t uid2[10];
	uint8_t uid2Len = 0;
	if (!nfc.readPassiveTargetID(PN532_MIFARE_ISO14443A, uid2, &uid2Len) ||
	    uid2Len != uidLen || memcmp(uid, uid2, uidLen) != 0 ||
	    !nfc.mifareclassic_AuthenticateBlock(uid2, uid2Len, 0, 0, KEY_DEFAULT)) {
		Serial.println("La tarjeta ya no esta o cambio. Intenta de nuevo.");
		return;
	}

	// La biblioteca no revisa el ACK de la escritura, por eso se verifica leyendo
	nfc.mifareclassic_WriteDataBlock(0, nuevo);
	uint8_t verif[16];
	bool ok = nfc.mifareclassic_ReadDataBlock(0, verif) && memcmp(verif, nuevo, 16) == 0;
	if (ok) {
		Serial.println("Escrito. Retira la tarjeta y vuelve a acercarla para verificar el UID.");
		rgb(0, 1, 0); delay(800); rgb(0, 0, 0);
	} else {
		Serial.println("La escritura NO se aplico (tarjeta no magica o Gen1a).");
		rgb(1, 0, 0); delay(1500); rgb(0, 0, 0);
		return;
	}

	// Esperar a que se retire la tarjeta y se vuelva a acercar
	delay(1500);
	while (nfc.readPassiveTargetID(PN532_MIFARE_ISO14443A, uid2, &uid2Len, 200)) { delay(200); }
	Serial.println("Acerca otra vez la tarjeta para verificar...");
	esperarTarjeta(uid2, &uid2Len);
	Serial.print("UID ahora: ");
	printHex(uid2, uid2Len);
	Serial.print("El lector la vera como id ");
	Serial.println(uidToId(uid2, uid2Len));

	Serial.println("\nListo. Escribe otro numero de usuario para la siguiente tarjeta.");
	pedirId();
}
