# Craft Brew Insight 🍺

Craft Brew Insight es una aplicación web diseñada para el monitoreo, control y gestión operativa en el proceso de elaboración de cerveza. Permite a los cerveceros y operadores llevar un registro digitalizado y eficiente de diversas etapas clave en el bloque frío y la agenda de producción.

## Características Principales

*   📅 **Agenda General**: Planificación visual sobre control de purgas y chequeo de platos en ciertas horas de la fermentación mediante un calendario interactivo.
*   📉 **Purgas a las  (72 Hrs)**: Seguimiento detallado durante los primeros 3 días de fermentación (24, 48 y 72 horas).
*   📉 **Purgas hasta las (144 Hrs)**: Seguimiento detallado durante 6 días de fermentación (24,48,72,96,120 y 144 horas).
*   🧹 **Control de Purgas de Trub en Frío**: Se encarga de relizarse las 8 purgas hasta las 60 o 64 hrs.
*   📊 **Dashboard**: Tarjetas de indicadores y visualización del estado general de las purgas.

## Stack Tecnológico

Este proyecto está construido con herramientas web modernas enfocadas en el rendimiento, la escalabilidad y una gran experiencia de desarrollo:

*   [React 19](https://react.dev/) - Biblioteca principal para la interfaz de usuario.
*   [Vite](https://vitejs.dev/) - Entorno de desarrollo ultrarrápido y empaquetador.
*   [TanStack Router](https://tanstack.com/router) - Enrutamiento robusto y type-safe (file-based routing).
*   [Tailwind CSS v4](https://tailwindcss.com/) - Framework de utilidades CSS para diseño responsivo.
*   [Shadcn UI](https://ui.shadcn.com/) - Colección de componentes de interfaz accesibles y personalizables construidos con Radix UI.
*   [TypeScript](https://www.typescriptlang.org/) - Tipado estático para JavaScript.

## Estructura del Proyecto

El código fuente sigue convenciones modernas (utilizando `snake_case` para el sistema de archivos) y está organizado funcionalmente:

```text
├── src/
│   ├── components/      # Componentes de React para la interfaz de usuario
│   │   ├── calendar/    # Lógica y visualización del calendario (agenda)
│   │   ├── core/        # Componentes base (páginas de error 404, error boundaries)
│   │   ├── dashboard/   # Gráficas, KPIs y paneles de la página de inicio
│   │   ├── forms/       # Componentes para carga de archivos y manipulación de datos
│   │   ├── layout/      # Estructura maestra de la app (barra lateral, cabecera)
│   │   ├── tables/      # Tablas de datos interactivos (extractos, purgas) y filtros
│   │   └── ui/          # Componentes visuales genéricos y reutilizables (Shadcn UI)
│   ├── data/            # Configuración estática (catálogos de marcas, turnos, mantenimientos)
│   ├── lib/             # Funciones utilitarias, conexión a Firebase (servicios API)
│   ├── routes/          # Páginas y URLs de la aplicación (TanStack Router)
│   ├── store/           # Manejador de estado global de la app (Zustand)
│   ├── types/           # Definiciones estrictas de datos para TypeScript
│   ├── router.tsx       # Configuración principal del enrutador web
│   ├── routeTree.gen.ts # Árbol de rutas generado automáticamente
│   └── styles.css       # Estilos globales y variables de diseño (Tailwind CSS)
├── vite.config.ts       # Configuración del empaquetador Vite
└── package.json         # Dependencias y scripts del proyecto
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
