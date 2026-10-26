# Guía para redactar las conclusiones

Solo preguntas para pensar. Las respuestas y la redacción son del equipo.

## 6.1 Propuesta de valor para el Congreso Nacional sobre Concretos

- ¿Qué problemas concretos tiene hoy un congreso con gafetes impresos (impresión, entrega en registro, pérdida, préstamo entre asistentes)? ¿Cuáles resuelve la credencial en el celular y cuáles no?
- Si el organizador puede bloquear a un usuario desde la base de datos (como hizo el profesor), ¿qué situaciones reales del congreso se resuelven con eso (cancelaciones, pagos pendientes, acceso a talleres con cupo)?
- El panel web muestra cada acceso en tiempo real. ¿Qué información le serviría al comité organizador (asistencia por conferencia, horas pico, aforo)? ¿Qué decisiones podría tomar con ella?
- ¿Cuánto cuesta el sistema por puerta (Arduino Nano ESP32 + PN532) comparado con torniquetes o lectores comerciales? ¿Qué implica eso para un evento de pocos días?
- ¿Qué pasa con los asistentes cuyo teléfono no tiene NFC (como el Redmi Note 12 que probamos) o que usan iPhone? ¿El congreso tendría que mantener un plan B? ¿Eso reduce la propuesta de valor?
- En nuestras pruebas, ¿cuánto tardó una lectura completa, de acercar el teléfono a que se encienda el LED? ¿Sería suficiente en la entrada principal a la hora de mayor afluencia?
- ¿El lector depende de Wi-Fi para decidir? ¿Qué le pasaría al congreso si se cae la red del recinto?
- ¿Qué argumentos le darían a una empresa del ramo del concreto (patrocinadora u organizadora) para invertir en esto en lugar de un QR impreso?

## 6.2 Desventajas y riesgos para el usuario

- Para que el lector reciba la credencial, el teléfono debe estar desbloqueado y con la pantalla encendida (`requireDeviceUnlock`). ¿Qué tan práctico es eso en una fila? ¿Qué pasa si el usuario lo olvida?
- ¿Qué ocurre si el teléfono se queda sin batería, se pierde o lo roban durante el congreso? ¿El usuario puede entrar? ¿Alguien más podría usar su credencial?
- El teléfono envía siempre el mismo número de usuario y el lector lo reenvía por HTTP con un token fijo (`code37`). ¿Qué podría hacer alguien que capture esa información? ¿Quién asumiría el riesgo, el usuario o el organizador?
- Al programar tarjetas con `CambiarUID` vimos que un UID se puede clonar con una tarjeta barata. ¿La credencial en el celular es más o menos segura que una tarjeta física? ¿Por qué?
- El panel web muestra nombre, correo y foto de quien pasa por el lector y no pide autenticación. ¿Qué implica eso para la privacidad del asistente?
- ¿El usuario sabe en algún momento si se le concedió el acceso? La app solo muestra "Escáner detectado". ¿Es suficiente?
- Si otra app del teléfono registra el mismo AID (como la app de ejemplo del profesor), ¿qué experiencia tendría el usuario? ¿Cómo se daría cuenta de que el problema no es su credencial?
- ¿Qué tan cómodo es instalar un APK fuera de la tienda (permisos de "orígenes desconocidos", advertencias de Play Protect o de HyperOS)? ¿Cuántos asistentes lo harían sin ayuda?
- ¿Qué datos personales guarda la app en el teléfono (sesión cifrada, ID en SharedPreferences) y qué pasa con ellos al cerrar sesión o desinstalar?
- ¿Qué les sorprendió durante el proyecto (dispositivos sin NFC, diferencias de orden de bytes, problemas de compilación)? ¿Qué dice eso sobre lo difícil que es desplegar esta solución a cientos de asistentes con teléfonos distintos?
