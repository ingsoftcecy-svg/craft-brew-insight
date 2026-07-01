# Craft Brew Insight 🍺

Craft Brew Insight es una aplicación web diseñada para el monitoreo, control y gestión operativa en el proceso de elaboración de cerveza. Permite a los cerveceros y operadores llevar un registro digitalizado y eficiente de diversas etapas clave en el bloque frío y la agenda de producción.

## Características Principales

- 📅 **Agenda General**: Planificación visual sobre control de purgas y chequeo de platos en ciertas horas de la fermentación mediante un calendario interactivo.
- 📉 **Purgas a las (72 Hrs)**: Seguimiento detallado durante los primeros 3 días de fermentación (24, 48 y 72 horas).
- 📉 **Purgas hasta las (144 Hrs)**: Seguimiento detallado durante 6 días de fermentación (24, 48, 72, 96, 120 y 144 horas).
- 🧹 **Control de Purgas de Trub en Frío**: Se encarga de realizar las 8 purgas hasta las 60 o 64 hrs.
- 📊 **Dashboard**: Tarjetas de indicadores y visualización del estado general de las purgas.
- 🖨️ **Etiquetas QR**: Generación e impresión de códigos QR para el acceso rápido y escaneo en cada Unitanque.

## Stack Tecnológico

Este proyecto está construido con herramientas web modernas enfocadas en el rendimiento, la escalabilidad y una gran experiencia de desarrollo:

- [React 19](https://react.dev/) - Biblioteca principal para la interfaz de usuario.
- [TanStack Start](https://tanstack.com/start) - Framework Full-Stack para React con SSR y enrutamiento type-safe basado en archivos.
- [Vite](https://vitejs.dev/) - Entorno de desarrollo ultrarrápido y empaquetador.
- [Tailwind CSS v4](https://tailwindcss.com/) - Framework de utilidades CSS para diseño responsivo.
- [Shadcn UI](https://ui.shadcn.com/) - Colección de componentes de interfaz accesibles y personalizables construidos con Radix UI.
- [Firebase](https://firebase.google.com/) - Base de datos en tiempo real (Firestore) y plataforma de despliegue (Hosting y Cloud Functions).
- [Zustand](https://zustand-demo.pmnd.rs/) - Manejador de estado global ágil y minimalista.
- [TypeScript](https://www.typescriptlang.org/) - Tipado estático para JavaScript.

## Estructura del Proyecto (Archivos Principales)

El código fuente sigue convenciones modernas y está organizado funcionalmente. Aquí tienes el detalle de qué hace cada archivo importante:

### 📁 `src/routes/` (Páginas y Rutas)

- `__root.tsx`: Punto de entrada de la interfaz. Configura metadatos, fuentes, y establece el sistema de prevención de fuga de datos (DLP).
- `_app.tsx`: Layout principal envolvente. Renderiza la barra lateral (`AppSidebar`) y contiene el contenedor principal.
- `_app.index.tsx`: Pantalla de inicio (Dashboard). Muestra las tarjetas de resumen (KPIs) y el panel de tareas pendientes del turno actual.
- `_app.agenda.tsx`: Pantalla que muestra el calendario interactivo con los eventos, purgas y chequeos de extracto programados.
- `_app.extracto.tsx`: Pantalla que carga la tabla de datos completa de monitoreo de fermentación hasta las 144 horas.
- `_app.purgas.tsx`: Pantalla que carga la tabla de seguimiento detallado de las purgas de levadura y trub en frío.
- `_app.chequeos.tsx`: Vista dinámica enfocada exclusivamente en revisar el avance y estado de los Platos en fermentación.
- `_app.graficos.tsx`: Pantalla con gráficas estadísticas de distribución (por marca y por mes) interactivos.
- `_app.admin.qr-print.tsx`: Herramienta administrativa para imprimir los códigos QR de todos los Unitanques.
- `scan.$tanqueId.tsx`: Página móvil que se abre al escanear un código QR. Muestra rápidamente el estado y permite registrar tareas in situ.
- `login.tsx`: Pantalla de inicio de sesión con autenticación de Google y correo/contraseña.
- `api.ingesta.ts`: API Backend que recibe la carga de archivos Excel, limpia los datos rotos o erróneos, unifica periodos y los sube a la base de datos de manera masiva.

### 📁 `src/store/` (Manejo de Estado Global)

- `useOperacionesStore.ts`: Es el "cerebro" de datos de la app. Descarga los datos de Firebase, normaliza los errores (ej. unifica variaciones de "Pacifico") y distribuye los datos a todas las tablas y gráficas.
- `useAuthStore.ts`: Gestiona de forma reactiva si el usuario inició sesión, qué permisos tiene y sus datos de perfil.

### 📁 `src/lib/api/` (Servicios de Base de Datos)

- `agendaFirebaseService.ts`: Lógica para guardar, editar y borrar eventos en el calendario.
- `extractosFirebaseService.ts`: Lógica de sincronización y subida de registros del extracto (monitoreo a 144 hrs).
- `purgasFirebaseService.ts`: Lógica de sincronización de la tabla de Purgas.
- `../firebase.ts`: Inicializa la conexión con los servicios de Google Cloud / Firebase.

### 📁 Otros Archivos de Configuración

- `src/router.tsx`: Construye y empaqueta el árbol de rutas utilizando TanStack Router.
- `src/server.ts` y `src/start.ts`: Configuran el Server-Side Rendering (SSR) de la aplicación para mayor velocidad.
- `vite.config.ts`: Define cómo se compila y optimiza la aplicación mediante Vite y TailwindCSS.
- `functions/`: Directorio que contiene el backend empaquetado para correr en Firebase Cloud Functions.

## Instalación y Uso Local

Asegúrate de tener [Node.js](https://nodejs.org/) instalado (se recomienda v20 o superior).

1.  **Clonar el repositorio y acceder a la carpeta**:

    ```bash
    cd craft-brew-insight
    ```

2.  **Instalar dependencias**:

    ```bash
    npm install
    ```

3.  **Iniciar el servidor de desarrollo**:

    ```bash
    npm run dev
    ```

    La aplicación estará disponible localmente en `http://localhost:8081` (o el puerto configurado).

4.  **Compilar para producción**:
    ```bash
    npm run build
    ```
    Genera los artefactos de cliente y servidor en el directorio `dist/`.

## Despliegue en Firebase

La aplicación utiliza Firebase Hosting y Cloud Functions (para el Server-Side Rendering).

1. **Autenticación en Firebase**:

   ```bash
   firebase login
   ```

2. **Sincronización y Despliegue Completo**:
   Después de ejecutar `npm run build`, se requiere actualizar las dependencias de `functions/package.json` y desplegar. Puedes ejecutar la siguiente secuencia de comandos para hacer el despliegue de manera correcta:
   ```bash
   npm run build
   # Copiar la compilación a functions
   Remove-Item -Recurse -Force functions\dist -ErrorAction SilentlyContinue
   Copy-Item -Recurse -Force dist functions\dist
   # Desplegar
   firebase deploy
   ```
   _(Nota: Asegúrate siempre de que las dependencias instaladas en la carpeta raíz también estén presentes en el `package.json` y `package-lock.json` de la carpeta `functions` para que el servidor SSR en la nube pueda levantarse sin problemas)._

## Scripts Disponibles

- `npm run dev`: Inicia el servidor de desarrollo de Vite.
- `npm run build`: Compila la aplicación para entorno de producción (cliente y servidor).
- `npm run build:dev`: Compila la aplicación en modo desarrollo.
- `npm run lint`: Ejecuta ESLint para analizar el código en busca de problemas.
- `npm run format`: Formatea el código fuente utilizando Prettier.
