# 📱 MedScan AI - Mobile App (Frontend)

Cliente móvil oficial de **MedScan AI** desarrollado con **React Native** y **Expo**. Esta aplicación permite a los usuarios interactuar con el sistema de gestión de medicación de forma intuitiva, utilizando la cámara del dispositivo y recibiendo alertas en tiempo real.

## 🚀 Funcionalidades Principales

* **📸 Escaneo de Medicamentos:** Interfaz para captura de imágenes y procesamiento de datos mediante la API.
* **📅 Panel de Control:** Visualización de tratamientos activos y próximos horarios.
* **⚠️ Alertas de Interacción:** Notificaciones visuales sobre compatibilidad de fármacos.
* **🍽️ Guía de Toma:** Indicadores sobre la administración en relación con las comidas.

## 🛠️ Stack Tecnológico

* **Framework:** [Expo](https://expo.dev/) 52 + React Native 0.76.
* **Lenguaje:** TypeScript (estricto).
* **Navegación:** [Expo Router](https://docs.expo.dev/router/introduction/) (file-based routing con rutas tipadas).
* **Estilos:** React Native `StyleSheet` con tema centralizado (`src/theme`).
* **Testing:** Jest + jest-expo.
* **Calidad:** ESLint 9 (flat config / eslint-config-expo) y `tsc --noEmit`.

## 📋 Requisitos Previos

1. **Node.js** v18 o superior (se recomienda v20 LTS).
2. App **Expo Go** instalada en el dispositivo móvil.
3. El backend debe estar corriendo en la misma red local.

## ⚙️ Configuración e Instalación

1. **Instalar dependencias:**
   ```bash
   npm install
   ```

2. **Configurar variables de entorno:**

   Crea un archivo `.env` en la raíz del proyecto (consulta `.env.example`):

   ```env
   # URL base de la API de MedScan AI (Backend)
   EXPO_PUBLIC_API_URL=http://localhost:3000/api
   ```

   > Las variables expuestas al cliente de Expo deben tener el prefijo `EXPO_PUBLIC_` para estar disponibles en el bundle. Variables sin este prefijo no aplican al frontend móvil.

## 📡 Contrato de API

La especificación **OpenAPI 3.0** de la REST API de MedScan AI es la **única fuente de verdad** del contrato entre este frontend y `MedScan-AI_Backend`. Contiene endpoints, DTOs de entrada/salida, códigos de error HTTP y autenticación:

* **Especificación canónica:** [`docs/openapi.yaml`](docs/openapi.yaml)
* **Swagger UI local:** [`docs/swagger.html`](docs/swagger.html)

**Vista previa en Swagger UI** (requiere servir los `docs/` vía HTTP, p. ej. `npx serve docs -l 8080` y abrir `http://localhost:8080/swagger.html`).

El backend publica la misma especificación en su documentación/Swagger UI; cualquier cambio de contrato debe hacerse primero en `docs/openapi.yaml` y reflejarse luego en ambos repositorios.

## ▶️ Ejecución

Inicia el servidor de desarrollo de Expo:

```bash
npx expo start
```

A partir de ahí podrás:

* **Android:** `npx expo start --android` (o escaneá el QR con Expo Go).
* **iOS:** `npx expo start --ios` (requiere macOS / Xcode).
* **Web:** `npx expo start --web`.

## ✅ Comandos de Calidad

| Comando              | Descripción                                   |
| -------------------- | --------------------------------------------- |
| `npm run lint`       | Ejecuta ESLint (flat config).                 |
| `npm run lint:fix`   | Ejecuta ESLint y corrige automáticamente.     |
| `npm run typecheck`  | Verifica tipos con TypeScript (`tsc --noEmit`). |
| `npm test`           | Ejecuta la suite de tests de Jest.            |
| `npm run test:watch` | Ejecuta Jest en modo watch.                   |
| `npm run test:coverage` | Ejecuta Jest generando reporte de cobertura. |

## 🔄 Integración Continua

El pipeline de CI (`.github/workflows/ci.yml`) corre sobre **push** y **pull request** hacia `main` y `develop`, y ejecuta en orden: `tsc --noEmit`, `npm run lint` y la suite de tests con cobertura.
