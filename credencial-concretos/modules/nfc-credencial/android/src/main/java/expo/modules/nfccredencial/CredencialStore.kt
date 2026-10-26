package expo.modules.nfccredencial

import android.content.Context

/**
 * Guarda el número de usuario del lado nativo (SharedPreferences) para que el
 * HostApduService pueda responder aunque la app esté en segundo plano o el
 * proceso de JS no esté corriendo. Se limpia al cerrar sesión.
 */
object CredencialStore {
  private const val PREFS = "credencial_nfc"
  private const val KEY_USER_ID = "user_id"

  /** Máximo valor que cabe en 4 bytes sin signo (uint32 del firmware). */
  const val MAX_USER_ID = 0xFFFFFFFFL

  fun setUserId(context: Context, id: Long) {
    require(id in 0..MAX_USER_ID) { "El ID debe estar entre 0 y $MAX_USER_ID" }
    context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
      .edit()
      .putLong(KEY_USER_ID, id)
      .apply()
  }

  /** Regresa null si no hay sesión (nadie ha iniciado sesión o se cerró). */
  fun getUserId(context: Context): Long? {
    val prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
    return if (prefs.contains(KEY_USER_ID)) prefs.getLong(KEY_USER_ID, 0L) else null
  }

  fun clear(context: Context) {
    context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
      .edit()
      .remove(KEY_USER_ID)
      .apply()
  }
}
