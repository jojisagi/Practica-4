package expo.modules.nfccredencial

import android.content.Context
import android.nfc.cardemulation.HostApduService
import android.os.Build
import android.os.Bundle
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
import android.util.Log

private const val TAG = "CredencialAPDU"

/**
 * Servicio de Host Card Emulation (HCE).
 *
 * Android lo ejecuta en segundo plano cuando un lector NFC envía un SELECT con
 * nuestro AID (F012345678), aunque la app no esté abierta. Lo registra en el
 * AndroidManifest el config plugin (app.plugin.js).
 *
 * Flujo con el lector (firmware ScannerHTTP.ino):
 *   Lector  -> 00 A4 04 00 05 F0 12 34 56 78 00   (SELECT AID)
 *   Teléfono-> [ID en 4 bytes little-endian] 90 00
 */
class CredencialApduService : HostApduService() {

  override fun processCommandApdu(commandApdu: ByteArray?, extras: Bundle?): ByteArray {
    if (commandApdu == null) {
      // El estándar pide anunciar error "sin diagnóstico preciso"
      return Apdu.SW_UNKNOWN
    }
    Log.d(TAG, "APDU IN: ${Apdu.toHex(commandApdu)}")

    val response: ByteArray
    val userId: Long?

    if (Apdu.isSelectOurAid(commandApdu)) {
      userId = CredencialStore.getUserId(this)
      response = if (userId != null) {
        // Respuesta: 4 bytes del ID + status word 90 00 (éxito)
        Apdu.idToLittleEndian(userId) + Apdu.SW_OK
      } else {
        // Sin sesión iniciada no entregamos ningún ID
        Apdu.SW_CONDITIONS_NOT_SATISFIED
      }
      vibrate()
      NfcCredencialModule.emitReaderDetected(
        mapOf(
          "userId" to userId?.toDouble(),
          "respondedWithId" to (userId != null),
          "command" to Apdu.toHex(commandApdu),
          "response" to Apdu.toHex(response),
          "timestamp" to System.currentTimeMillis().toDouble()
        )
      )
    } else if (Apdu.isSelectByName(commandApdu)) {
      userId = null
      response = Apdu.SW_FILE_NOT_FOUND
    } else {
      userId = null
      response = Apdu.SW_INS_NOT_SUPPORTED
    }

    Log.d(TAG, "APDU OUT: ${Apdu.toHex(response)} (id=$userId)")
    return response
  }

  override fun onDeactivated(reason: Int) {
    // DEACTIVATION_LINK_LOSS (0) = se alejó el teléfono
    // DEACTIVATION_DESELECTED (1) = el lector seleccionó otro AID
    Log.d(TAG, "onDeactivated reason=$reason")
  }

  /** Retroalimentación háptica al detectar el lector (requiere permiso VIBRATE). */
  private fun vibrate() {
    try {
      val vibrator: Vibrator? = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
        (getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as? VibratorManager)?.defaultVibrator
      } else {
        @Suppress("DEPRECATION")
        getSystemService(Context.VIBRATOR_SERVICE) as? Vibrator
      }
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        vibrator?.vibrate(VibrationEffect.createOneShot(150, VibrationEffect.DEFAULT_AMPLITUDE))
      } else {
        @Suppress("DEPRECATION")
        vibrator?.vibrate(150)
      }
    } catch (e: Exception) {
      Log.w(TAG, "No se pudo vibrar", e)
    }
  }
}
