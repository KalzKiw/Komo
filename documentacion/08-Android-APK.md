# Empaquetado Android APK

La app se empaqueta como APK con Capacitor. No hace falta reescribir la interfaz con componentes nativos: la aplicación React/Vite actual se compila a `client-dist` y Capacitor la envuelve en un proyecto Android nativo.

## Archivos añadidos

- `capacitor.config.ts`: configuración de Capacitor.
- `android/`: proyecto nativo Android.
- `.env.android.example`: plantilla de variables para compilar el APK.
- `.env.android`: variables reales de build Android, no versionadas.
- `android/app/src/main/res/values/strings.xml`: nombre visible de la app.
- `android/app/src/main/java/com/cafeteriasolo/komo/MainActivity.java`: ajustes de pantalla completa.

## Configurar API para APK

En navegador, Vite puede usar el proxy `/api`. En un APK eso no existe: el móvil necesita llegar a una API real por URL.

Crea un archivo `.env.android` en la raíz:

```bash
VITE_API_BASE_URL=https://tu-api-publica.es
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

Para una red local del colegio también puede usarse una IP accesible desde el móvil:

```bash
VITE_API_BASE_URL=http://192.168.30.20:3001
```

Si se usa HTTP local, Capacitor está configurado con `cleartext` y `allowMixedContent` para permitir pruebas en LAN. Para producción es mejor HTTPS.

En la build de pruebas actual la API debe apuntar a Railway o a otro backend público. Si apunta a `localhost`, funcionará en el PC pero no en el móvil.

## Comandos

```bash
npm run build:android
npm run cap:sync
npm run android:apk:debug
```

El APK debug queda en:

```text
android/app/build/outputs/apk/debug/app-debug.apk
```

La APK de pruebas está configurada con:

- Nombre visible: **KOMOAPK**.
- Icono basado en el logo de la app.
- Pantalla completa para ocultar la barra superior del sistema Android.
- Navegación móvil con botón atrás controlado por historial interno.
- Gestos horizontales para cambiar de pestaña.
- Animaciones de deslizamiento entre vistas.

Para abrir el proyecto en Android Studio:

```bash
npm run android:open
```

## Java y Android SDK

Capacitor Android 8 requiere JDK 21. En esta máquina la compilación correcta fue:

```bash
ANDROID_HOME=/home/kalz/Coding/Proyectos/CafeteriaSolo/.android-sdk \
ANDROID_SDK_ROOT=/home/kalz/Coding/Proyectos/CafeteriaSolo/.android-sdk \
JAVA_HOME=/usr/lib/jvm/java-21-openjdk \
npm run android:apk:debug
```

El JDK 26 falla con Gradle por versión de bytecode demasiado nueva.

## Comprobaciones realizadas

- `npm run build:client`: build web correcta.
- `npm test`: suite Vitest correcta.
- `npm run android:apk:debug`: APK generada correctamente.
- Verificación de firma debug con `apksigner`.
- Comprobación de que el APK usa `VITE_API_BASE_URL` y no depende del PC encendido.

## Release firmado

El APK debug sirve para probar. Para distribuir fuera de desarrollo hay que crear una build release firmada desde Android Studio o configurando un keystore en Gradle.
