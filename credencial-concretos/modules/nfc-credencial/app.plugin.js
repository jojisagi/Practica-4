/**
 * Config plugin de la credencial NFC.
 *
 * Como la carpeta android/ se genera con `npx expo prebuild` (no se edita a mano),
 * este plugin agrega en cada prebuild lo que en la app Kotlin del profesor está
 * escrito directamente en AndroidManifest.xml y res/xml/apduservice.xml:
 *
 *  1. Permisos NFC y VIBRATE, y <uses-feature> de NFC/HCE (required=false para
 *     que la app se instale y muestre un aviso si el teléfono no tiene HCE).
 *  2. El <service> HostApduService con permiso BIND_NFC_SERVICE, el intent-filter
 *     HOST_APDU_SERVICE + category DEFAULT (el repo indica que es necesaria
 *     aunque la documentación oficial no la menciona) y el meta-data al XML.
 *  3. El XML res/xml/nfc_credencial_apdu_service.xml con el AID F012345678
 *     en la categoría "other".
 *  4. Los textos que Android muestra en Ajustes > NFC > Pago sin contacto.
 */
const fs = require('fs');
const path = require('path');
const {
  AndroidConfig,
  createRunOncePlugin,
  withAndroidManifest,
  withDangerousMod,
  withStringsXml,
} = require('expo/config-plugins');

const SERVICE_CLASS = 'expo.modules.nfccredencial.CredencialApduService';
const XML_NAME = 'nfc_credencial_apdu_service';
// Debe coincidir con Apdu.AID en Kotlin y con el SELECT del firmware.
const AID = 'F012345678';

/** 1 y 2: permisos, features y servicio en el AndroidManifest. */
function withHceManifest(config) {
  config = AndroidConfig.Permissions.withPermissions(config, [
    'android.permission.NFC',
    'android.permission.VIBRATE',
  ]);

  return withAndroidManifest(config, (config) => {
    const manifest = config.modResults.manifest;

    // <uses-feature> (solo afecta a Play Store; no bloquea instalar el APK)
    manifest['uses-feature'] = (manifest['uses-feature'] ?? []).filter(
      (f) => !['android.hardware.nfc', 'android.hardware.nfc.hce'].includes(f.$['android:name'])
    );
    manifest['uses-feature'].push(
      { $: { 'android:name': 'android.hardware.nfc', 'android:required': 'false' } },
      { $: { 'android:name': 'android.hardware.nfc.hce', 'android:required': 'false' } }
    );

    const app = AndroidConfig.Manifest.getMainApplicationOrThrow(config.modResults);
    // Se quita una versión previa del servicio para que el plugin sea idempotente
    app.service = (app.service ?? []).filter((s) => s.$['android:name'] !== SERVICE_CLASS);
    app.service.push({
      $: {
        'android:name': SERVICE_CLASS,
        'android:exported': 'true',
        // Solo el sistema (el stack NFC) puede enlazarse al servicio
        'android:permission': 'android.permission.BIND_NFC_SERVICE',
      },
      'intent-filter': [
        {
          action: [{ $: { 'android:name': 'android.nfc.cardemulation.action.HOST_APDU_SERVICE' } }],
          // ¡Requerida! (ver comentario en el AndroidManifest del repo del profesor)
          category: [{ $: { 'android:name': 'android.intent.category.DEFAULT' } }],
        },
      ],
      'meta-data': [
        {
          $: {
            'android:name': 'android.nfc.cardemulation.host_apdu_service',
            'android:resource': `@xml/${XML_NAME}`,
          },
        },
      ],
    });

    return config;
  });
}

/** 3: genera res/xml/nfc_credencial_apdu_service.xml con el AID. */
function withHceAidXml(config) {
  return withDangerousMod(config, [
    'android',
    async (config) => {
      const xmlDir = path.join(config.modRequest.platformProjectRoot, 'app/src/main/res/xml');
      await fs.promises.mkdir(xmlDir, { recursive: true });
      const xml = `<?xml version="1.0" encoding="utf-8"?>
<!-- Generado por modules/nfc-credencial/app.plugin.js. No editar a mano. -->
<!-- requireDeviceUnlock: el teléfono debe estar desbloqueado para responder al lector -->
<host-apdu-service xmlns:android="http://schemas.android.com/apk/res/android"
    android:description="@string/nfc_credencial_service_description"
    android:requireDeviceUnlock="true">
    <aid-group android:description="@string/nfc_credencial_aid_description"
        android:category="other">
        <aid-filter android:name="${AID}"/>
    </aid-group>
</host-apdu-service>
`;
      await fs.promises.writeFile(path.join(xmlDir, `${XML_NAME}.xml`), xml);
      return config;
    },
  ]);
}

/** 4: strings referenciados por el XML del servicio. */
function withHceStrings(config, { serviceDescription, aidDescription }) {
  return withStringsXml(config, (config) => {
    config.modResults = AndroidConfig.Strings.setStringItem(
      [
        { $: { name: 'nfc_credencial_service_description', translatable: 'false' }, _: serviceDescription },
        { $: { name: 'nfc_credencial_aid_description', translatable: 'false' }, _: aidDescription },
      ],
      config.modResults
    );
    return config;
  });
}

function withNfcCredencial(config, props = {}) {
  const options = {
    serviceDescription: props.serviceDescription ?? 'Credencial de acceso NFC',
    aidDescription: props.aidDescription ?? 'Credencial de acceso',
  };
  config = withHceManifest(config);
  config = withHceAidXml(config);
  config = withHceStrings(config, options);
  return config;
}

module.exports = createRunOncePlugin(withNfcCredencial, 'nfc-credencial', '1.0.0');
