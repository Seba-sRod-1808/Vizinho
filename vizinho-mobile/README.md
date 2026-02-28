# Vizinho Mobile - React Native (Expo)

App movil nativa para iOS y Android de la plataforma Vizinho de gestion de comunidades residenciales.

## Requisitos Previos

- **Node.js** 18+ 
- **Expo CLI**: `npm install -g expo-cli`
- **Expo Go app** en tu dispositivo movil (iOS App Store / Google Play)
- O bien: **Xcode** (para iOS simulator) / **Android Studio** (para Android emulator)

## Instalacion

```bash
cd vizinho-mobile
npm install
```

## Configuracion

### 1. URL del Backend
Edita `src/utils/config.js` y cambia `API_BASE_URL` a la URL de tu backend:

```javascript
export const API_BASE_URL = 'https://tu-backend-url.com';
```

### 2. Cloudinary (opcional)
Si deseas subir imagenes, actualiza el `CLOUDINARY_CLOUD_NAME` en el mismo archivo.

## Ejecutar

```bash
# Iniciar servidor de desarrollo
npx expo start

# Opciones:
# - Escanear QR code con Expo Go (dispositivo fisico)
# - Presionar 'i' para iOS simulator
# - Presionar 'a' para Android emulator
```

## Build de Produccion

### iOS
```bash
# Build para iOS (requiere cuenta de Apple Developer)
eas build --platform ios

# O build local con Xcode
npx expo run:ios --configuration Release
```

### Android
```bash
# Build APK
eas build --platform android --profile preview

# Build AAB para Play Store
eas build --platform android --profile production
```

## Estructura del Proyecto

```
vizinho-mobile/
├── App.js                          # Entry point
├── app.json                        # Expo configuracion
├── package.json                    # Dependencias
└── src/
    ├── contexts/
    │   └── AuthContext.js           # Autenticacion y estado global
    ├── navigation/
    │   └── AppNavigator.js          # React Navigation (tabs + stacks)
    ├── screens/
    │   ├── LoginScreen.js           # Login / Registro
    │   ├── FeedScreen.js            # Mural de publicaciones
    │   ├── ReportesScreen.js        # Reportes de incidentes
    │   ├── EncuestasScreen.js       # Encuestas / Votaciones
    │   ├── AreasScreen.js           # Areas comunes y reservas
    │   ├── PerfilScreen.js          # Perfil + Panico + Navegacion
    │   ├── MultasScreen.js          # Multas
    │   ├── ObjetosPerdidosScreen.js # Objetos perdidos
    │   ├── NotificacionesScreen.js  # Centro de notificaciones
    │   └── AdminScreen.js           # Dashboard admin
    ├── utils/
    │   ├── api.js                   # Cliente HTTP con auth
    │   ├── config.js                # Configuracion
    │   └── theme.js                 # Tokens de diseno
    └── assets/                      # Iconos e imagenes
```

## Funcionalidades

| Funcionalidad | Estado |
|---|---|
| Login / Registro JWT | Completo |
| Mural de publicaciones | Completo |
| Reportes con estados | Completo |
| Encuestas / Votaciones | Completo |
| Areas comunes y reservas | Completo |
| Multas (ver/pagar) | Completo |
| Objetos perdidos | Completo |
| Boton de panico | Completo |
| Notificaciones | Completo |
| Dashboard admin | Completo |
| Perfil de usuario | Completo |
| Pull-to-refresh | Completo |

## Cuentas Demo

| Rol | Usuario | Contrasena |
|---|---|---|
| Admin | admin | admin123 |
| Vecino | vecino1 | vecino123 |

## Tecnologias

- **React Native** via Expo SDK 52
- **React Navigation** 7 (Bottom Tabs + Native Stack)
- **Expo SecureStore** para tokens JWT
- **Expo Image Picker** para subida de fotos
- **Expo Notifications** para push notifications
- **Expo Haptics** para feedback tactil
- **Lucide Icons** para iconografia

## Notas

- El backend comparte la misma API que la version PWA web
- Los tokens se almacenan de forma segura con SecureStore (KeyChain iOS / Keystore Android)
- La app soporta ambos roles: Vecino y Administrador
- Todo el texto esta en espanol
