package expo.modules.nfccredencial

/**
 * Utilidades del protocolo APDU (ISO/IEC 7816-4) usadas por el servicio HCE.
 */
object Apdu {
  /**
   * AID de la credencial. Debe coincidir con:
   *  - el <aid-filter> que genera el config plugin (app.plugin.js), y
   *  - el comando SELECT que envía el firmware ScannerHTTP.ino:
   *    00 A4 04 00 05 F0 12 34 56 78 00
   */
  val AID = byteArrayOf(0xF0.toByte(), 0x12, 0x34, 0x56, 0x78)

  // Status words (SW1 SW2) del estándar ISO 7816-4
  val SW_OK = byteArrayOf(0x90.toByte(), 0x00)                     // 90 00: éxito
  val SW_CONDITIONS_NOT_SATISFIED = byteArrayOf(0x69, 0x85.toByte()) // 69 85: no hay sesión
  val SW_FILE_NOT_FOUND = byteArrayOf(0x6A, 0x82.toByte())         // 6A 82: AID desconocido
  val SW_INS_NOT_SUPPORTED = byteArrayOf(0x6D, 0x00)               // 6D 00: comando no soportado
  val SW_UNKNOWN = byteArrayOf(0x6F, 0x00)                         // 6F 00: error sin diagnóstico

  /** ¿Es un SELECT (CLA=00, INS=A4) por nombre (P1=04)? */
  fun isSelectByName(cmd: ByteArray): Boolean =
    cmd.size >= 5 &&
      cmd[0] == 0x00.toByte() &&
      cmd[1] == 0xA4.toByte() &&
      cmd[2] == 0x04.toByte()

  /**
   * ¿Es exactamente SELECT de nuestro AID?
   * Estructura: CLA INS P1 P2 Lc [AID de Lc bytes] [Le opcional]
   */
  fun isSelectOurAid(cmd: ByteArray): Boolean {
    if (!isSelectByName(cmd)) return false
    val lc = cmd[4].toInt() and 0xFF
    if (lc != AID.size || cmd.size < 5 + lc) return false
    return cmd.copyOfRange(5, 5 + lc).contentEquals(AID)
  }

  /**
   * Convierte el ID a 4 bytes en LITTLE-ENDIAN (byte menos significativo primero).
   *
   * ¿Por qué little-endian? El firmware (ESP32, arquitectura little-endian) hace
   *     memcpy(&id, userId, 4);
   * es decir, copia los 4 bytes recibidos tal cual sobre un uint32_t, así que el
   * primer byte recibido se vuelve el menos significativo.
   *
   * Ejemplo: id 3004 = 0x00000BBC  ->  BC 0B 00 00
   *
   * Nota: la app Kotlin de ejemplo del profesor usa big-endian (DEADCAFE), pero el
   * firmware tiene un mapeo especial para esos IDs de prueba (revisa userId[3]),
   * por eso ahí "funciona". Para IDs reales hay que usar little-endian.
   */
  fun idToLittleEndian(id: Long): ByteArray = byteArrayOf(
    (id and 0xFF).toByte(),
    ((id shr 8) and 0xFF).toByte(),
    ((id shr 16) and 0xFF).toByte(),
    ((id shr 24) and 0xFF).toByte()
  )

  fun toHex(bytes: ByteArray): String = bytes.joinToString(" ") { "%02X".format(it) }
}
