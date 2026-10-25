# 📱 MedScan AI - Mobile App (Frontend)

Cliente móvil oficial de **MedScan AI** desarrollado con **React Native** y **Expo**. Permite gestionar la medicación de forma intuitiva: escanear medicamentos con la cámara, seguir los tratamientos y recibir recordatorios push.

## 🚀 Funcionalidades Principales

* **🔐 Autenticación:** registro e inicio de sesión con JWT, almacenado de forma segura (`expo-secure-store`).
* **📸 Escaneo de Medicamentos:** captura con la cámara o selección desde la galería, y procesamiento mediante la API.
* **💊 Gestión de Medicamentos:** listado, detalle, alta, edición y baja.
* **📅 Panel de Control:** tratamientos activos, próximas tomas y registro de dosis tomadas.
* **🔔 Recordatorios:** notificaciones push (`expo-notifications`) con registro del token en el backend.
* **👤 Perfil:** datos del usuario autenticado.

## 🛠️ Stack Tecnológico

* **Framework:** [Expo](https://expo.dev/) SDK 58 + React Native 0.88 + React 19.
* **Lenguaje:** TypeScript (estricto).
* **Navegación:** [Expo Router](https://docs.expo.dev/router/introduction/) (file-based routing).
* **HTTP:** Axios con cliente centralizado (`src/services/apiClient.ts`).
* **Estilos:** React Native `StyleSheet` con tema centralizado (`src/theme`).
* **Testing:** Jest + jest-expo.
* **Calidad:** ESLint 9 (flat config / `eslint-config-expo`) y `tsc --noEmit`.

## 📂 Estructura del Proyecto

```text
app/            Rutas (Expo Router)
├── (auth)/     login y registro
├── (tabs)/     inicio, medicamentos, escaneo y perfil
└── medication/ detalle de medicamento ([id])
src/
├── components/ Componentes reutilizables
├── context/    Estado global (p. ej. autenticación)
├── hooks/      Hooks personalizados
├── icons/      Iconos SVG
├── screens/    Pantallas (p. ej. DashboardScreen)
├── services/   Acceso a API, tokens y notificaciones
├── theme/      Colores, tipografías y espaciados
├── types/      Tipos TypeScript
└── utils/      Utilidades (validación, frecuencia, etc.)
docs/           Contrato OpenAPI y Swagger UI
__tests__/      Suite de tests de Jest
```

## 📋 Requisitos Previos

1. **Node.js** v20 LTS (versión usada en CI; se recomienda v20 o superior).
2. App **Expo Go** instalada en el dispositivo móvil (para pruebas en físico).
3. El backend ([`Medscan-AI_Backend`](../Medscan-AI_Backend)) corriendo y accesible desde el dispositivo/emulador.

## ⚙️ Configuración e Instalación

1. **Instalar dependencias:**

   ```bash
   npm install
   ```

2. **Configurar variables de entorno:**

   Copia `.env.example` como `.env` en la raíz del proyecto y ajusta la URL de la API (el backend usa el puerto `8080` y el prefijo `/api/v1`):

   ```env
   # iOS Simulator o Navegador Web
   EXPO_PUBLIC_API_URL=http://localhost:8080/api/v1

   # Android Emulator (10.0.2.2 es el alias del host)
   # EXPO_PUBLIC_API_URL=http://10.0.2.2:8080/api/v1

   # Dispositivo físico (misma red Wi-Fi que tu máquina)
   # EXPO_PUBLIC_API_URL=http://192.168.1.X:8080/api/v1
   ```

   > Las variables expuestas al cliente de Expo deben tener el prefijo `EXPO_PUBLIC_`. Si `EXPO_PUBLIC_API_URL` no está definida, el cliente HTTP lanza un error al iniciar.

## 📡 Contrato de API

La especificación **OpenAPI 3.0** de la REST API de MedScan AI es la **única fuente de verdad** del contrato entre este frontend y `Medscan-AI_Backend`. Incluye endpoints, DTOs de entrada/salida, códigos de error HTTP y autenticación:

* **Especificación canónica:** [`docs/openapi.yaml`](docs/openapi.yaml)
* **Swagger UI local:** [`docs/swagger.html`](docs/swagger.html)

Para ver la vista previa, sirve `docs/` por HTTP, por ejemplo `npx serve docs -l 8080`, y abre `http://localhost:8080/swagger.html` (usa otro puerto si el backend ya ocupa el `8080`).

Cualquier cambio de contrato debe hacerse primero en `docs/openapi.yaml` y reflejarse luego en ambos repositorios.

## ▶️ Ejecución

Inicia el servidor de desarrollo de Expo:

```bash
npm start
```

A partir de ahí podrás:

* **Android:** `npm run android` (o escanea el QR con Expo Go).
* **iOS:** `npm run ios` (requiere macOS / Xcode).
* **Web:** `npm run web`.

## ✅ Comandos de Calidad

| Comando                 | Descripción                                     |
| ----------------------- | ----------------------------------------------- |
| `npm run lint`          | Ejecuta ESLint (flat config).                   |
| `npm run lint:fix`      | Ejecuta ESLint y corrige automáticamente.       |
| `npm run typecheck`     | Verifica tipos con TypeScript (`tsc --noEmit`). |
| `npm test`              | Ejecuta la suite de tests de Jest.              |
| `npm run test:watch`    | Ejecuta Jest en modo watch.                     |
| `npm run test:coverage` | Ejecuta Jest generando reporte de cobertura.    |

## 🔄 Integración Continua

El pipeline de CI (`.github/workflows/ci.yml`) corre en **push** y **pull request** hacia `main` y `develop` (Node 20), y ejecuta en orden: `npm ci`, `npm run typecheck`, `npm run lint` y `npm run test:coverage`. El reporte de cobertura se publica como artefacto (7 días de retención).
