package expo.modules.nfccredencial

import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.nfc.NfcAdapter
import android.provider.Settings
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.lang.ref.WeakReference

const val READER_DETECTED_EVENT = "onReaderDetected"

/**
 * Puente entre JS y la parte nativa de la credencial NFC.
 * El nombre "NfcCredencial" es el que se usa en requireNativeModule().
 */
class NfcCredencialModule : Module() {

  private val context: Context
    get() = appContext.reactContext ?: throw Exceptions.ReactContextLost()

  override fun definition() = ModuleDefinition {
    Name("NfcCredencial")

    Events(READER_DETECTED_EVENT)

    OnCreate { instance = WeakReference(this@NfcCredencialModule) }
    OnDestroy { instance = null }

    // JS manda number (double); se valida que quepa en 4 bytes sin signo.
    Function("setUserId") { id: Double ->
      if (id.isNaN() || id % 1.0 != 0.0 || id < 0 || id > CredencialStore.MAX_USER_ID) {
        throw IllegalArgumentException("ID inválido: $id (debe ser entero entre 0 y ${CredencialStore.MAX_USER_ID})")
      }
      CredencialStore.setUserId(context, id.toLong())
    }

    Function("clearUserId") {
      CredencialStore.clear(context)
    }

    Function("getUserId") {
      CredencialStore.getUserId(context)?.toDouble()
    }

    // ¿El teléfono tiene chip NFC?
    Function("isNfcAvailable") {
      NfcAdapter.getDefaultAdapter(context) != null
    }

    // ¿NFC está encendido en ajustes?
    Function("isNfcEnabled") {
      NfcAdapter.getDefaultAdapter(context)?.isEnabled == true
    }

    // ¿El teléfono soporta Host Card Emulation?
    Function("isHceSupported") {
      context.packageManager.hasSystemFeature(PackageManager.FEATURE_NFC_HOST_CARD_EMULATION)
    }

    // Abre los ajustes de NFC para que el usuario lo encienda.
    Function("openNfcSettings") {
      val intent = Intent(Settings.ACTION_NFC_SETTINGS).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      context.startActivity(intent)
    }
  }

  companion object {
    @Volatile
    private var instance: WeakReference<NfcCredencialModule>? = null

    /**
     * Lo llama el HostApduService. Si la parte de JS está viva, le avisa que el
     * lector hizo la petición; si no, no pasa nada (el servicio responde igual).
     */
    fun emitReaderDetected(payload: Map<String, Any?>) {
      instance?.get()?.sendEvent(READER_DETECTED_EVENT, payload)
    }
  }
}
