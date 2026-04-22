# Guía: Convertir NOC Visor a App Nativa (Android + iOS)

## Archivos a colocar
- `capacitor.config.ts` → en la raíz de `noc-visor/`
- `App.jsx` (noc_visor_web.jsx) → en `noc-visor/src/`

---

## PASO 1 — Instalar dependencias de Capacitor

Abre cmd en la carpeta `noc-visor/` y ejecuta:

```bash
npm install @capacitor/core @capacitor/cli
npm install @capacitor/android
npm install @capacitor/push-notifications
npm install @capacitor/local-notifications
```

Para iOS (solo en Mac):
```bash
npm install @capacitor/ios
```

---

## PASO 2 — Inicializar Capacitor

```bash
npx cap init "NOC Visor" "com.multicable.nocvisor" --web-dir dist
```

> Si ya tienes el capacitor.config.ts en la carpeta, salta este paso.

---

## PASO 3 — Compilar la web app

```bash
npm run build
```

---

## PASO 4 — Agregar plataforma Android

```bash
npx cap add android
npx cap sync
```

---

## PASO 5 — Abrir en Android Studio

```bash
npx cap open android
```

En Android Studio:
1. Espera que gradle termine de sincronizar
2. Conecta tu celular Android con cable USB
3. Activa "Modo desarrollador" en tu celular:
   - Configuración → Acerca del teléfono → toca "Número de compilación" 7 veces
   - Configuración → Opciones de desarrollador → Depuración USB → Activar
4. Presiona el botón ▶ (Run) en Android Studio
5. La app se instala directamente en tu celular

---

## PASO 6 — Para generar APK (compartir sin Play Store)

En Android Studio:
1. Build → Generate Signed Bundle/APK
2. Selecciona APK
3. Crea un keystore nuevo (guárdalo bien, lo necesitas para actualizaciones)
4. Build → Release
5. El APK queda en: `android/app/release/app-release.apk`

Comparte ese APK por WhatsApp o correo y los técnicos lo instalan.

---

## PASO 7 — Actualizar la app en el futuro

Cada vez que cambies el código:
```bash
npm run build
npx cap sync
```
Luego genera el APK de nuevo desde Android Studio.

---

## Para iOS (requiere Mac + Xcode)

```bash
npx cap add ios
npx cap sync
npx cap open ios
```

En Xcode conecta tu iPhone y presiona Run.
Para publicar en App Store necesitas cuenta de Apple Developer ($99/año).

---

## Notas importantes

- Las notificaciones push nativas funcionan en BACKGROUND (app cerrada) en Android
- En iOS funcionan igual pero requieren cuenta de Apple Developer
- El ícono de la app se configura en `android/app/src/main/res/`
- El nombre que aparece en el celular es "NOC Visor DWDM"
