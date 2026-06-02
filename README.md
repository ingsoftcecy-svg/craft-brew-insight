# Craft Brew Insight 🍺

Craft Brew Insight es una aplicación web diseñada para el monitoreo, control y gestión operativa en el proceso de elaboración de cerveza. Permite a los cerveceros y operadores llevar un registro digitalizado y eficiente de diversas etapas clave en el bloque frío y la agenda de producción.

## Características Principales

*   📅 **Agenda General**: Planificación visual y control de turnos, mantenimientos de equipos y limpiezas CIP (Clean-In-Place) mediante un calendario interactivo.
*   📉 **Monitoreo de Extractos (72 Hrs)**: Seguimiento detallado de la atenuación del mosto durante los primeros 3 días de fermentación (24, 48 y 72 horas).
*   🧹 **Control de Purgas de Trub en Frío**: Registro y evaluación visual de las descargas de sedimentos por tanque, garantizando la calidad y limpieza del producto en maduración.
*   📊 **Dashboard de KPIs**: Tarjetas de indicadores y visualización del estado general de la planta productiva.

## Stack Tecnológico

Este proyecto está construido con herramientas web modernas enfocadas en el rendimiento, la escalabilidad y una gran experiencia de desarrollo:

*   [React 19](https://react.dev/) - Biblioteca principal para la interfaz de usuario.
*   [Vite](https://vitejs.dev/) - Entorno de desarrollo ultrarrápido y empaquetador.
*   [TanStack Router](https://tanstack.com/router) - Enrutamiento robusto y type-safe (file-based routing).
*   [Tailwind CSS v4](https://tailwindcss.com/) - Framework de utilidades CSS para diseño responsivo.
*   [Shadcn UI](https://ui.shadcn.com/) - Colección de componentes de interfaz accesibles y personalizables construidos con Radix UI.
*   [TypeScript](https://www.typescriptlang.org/) - Tipado estático para JavaScript.

## Estructura del Proyecto

El código fuente sigue convenciones modernas (utilizando `snake_case` para el sistema de archivos):

```text
├── src/
│   ├── components/      # Componentes de UI reutilizables (shadcn, tablas, modales)
│   ├── data/            # Datos estáticos y simulación de base de datos
│   ├── lib/             # Utilidades, configuración del servidor y manejo de errores
│   ├── routes/          # Rutas de la aplicación (file-based routing)
│   ├── server.ts        # Punto de entrada para el servidor (SSR/API)
│   ├── start.ts         # Middleware y configuración de arranque
│   └── styles.css       # Estilos globales y variables de Tailwind
├── vite.config.ts       # Configuración de Vite y plugins de TanStack
└── package.json         # Dependencias y scripts
```

## Instalación y Uso

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
    La aplicación estará disponible localmente en `http://localhost:8080`.

4.  **Compilar para producción**:
    ```bash
    npm run build
    ```
    Genera los artefactos de cliente y servidor en el directorio `dist/`.

## Scripts Disponibles

*   `npm run dev`: Inicia el servidor de desarrollo de Vite.
*   `npm run build`: Compila la aplicación para entorno de producción.
*   `npm run build:dev`: Compila la aplicación en modo desarrollo.
*   `npm run lint`: Ejecuta ESLint para analizar el código en busca de problemas.
*   `npm run format`: Formatea el código fuente utilizando Prettier.
