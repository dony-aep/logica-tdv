# Changelog

Todos los cambios notables de este proyecto se documentan en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/),
y este proyecto sigue [Semantic Versioning](https://semver.org/lang/es/).

## [2.1.0] - 2026-08-06

### Added

- Modelos vigentes en el selector de IA: `gemini-3.6-flash`, `gemini-3.5-flash` y `gemini-3.5-flash-lite` (gratis), y `gemini-3.1-pro-preview` (pago)
- `CLAUDE.md` con la guía del proyecto para agentes (arquitectura del motor lógico, convenciones y política de dependencias)

### Changed

- Modelo por defecto de Gemini cambiado de `gemini-2.5-flash` a `gemini-3.6-flash`, alineado entre el componente y `GeminiService`
- Retiradas las entradas ya inválidas `gemini-3-pro-preview` (apagado el 09-03-2026) y `gemini-3-flash-preview` (deprecado)
- Actualización del runtime de Angular de `21.2.17` a `21.2.19` (`@angular/animations`, `@angular/common`, `@angular/compiler`, `@angular/compiler-cli`, `@angular/core`, `@angular/forms`, `@angular/platform-browser`, `@angular/platform-browser-dynamic`, `@angular/router`)
- Actualización del tooling de Angular: `@angular/build` y `@angular/cli` de `21.2.16` a `21.2.20`
- Actualización de `@google/genai` de `1.52.0` a `2.16.0` (los cambios de ruptura del major afectan solo a la API de Interactions, no a `generateContent`)
- Actualización de `@vercel/analytics` de `1.6.1` a `2.0.1`
- Actualización de `zone.js` de `0.15.1` a `0.16.2`, dentro del rango de peers declarado por `@angular/core`
- Actualización del stack de pruebas: `jasmine-core` de `5.5.0` a `6.3.0`, `@types/jasmine` de `5.1.15` a `6.0.0` y `karma-jasmine-html-reporter` de `2.1.0` a `2.2.0`
- Bloque `overrides` reducido de 21 pines a 2 (`undici` y `@hono/node-server`): el resto quedó redundante al alcanzarlos la resolución natural del árbol
- Sincronización de `version` en `package.json` con el CHANGELOG, que llevaba desde el inicio en `0.0.0`

### Security

- Resueltas 12 alertas abiertas de Dependabot en `@angular/common`, `@angular/compiler`, `@angular/core`, `brace-expansion`, `fast-uri`, `ip-address`, `socket.io-parser` y `undici`
- Suelos de override elevados a las versiones parcheadas: `undici` a `^7.29.0`
- Auditoría de npm en estado limpio: `0 vulnerabilities`

## [2.0.2] - 2026-04-12

### Changed

- Actualización de Angular runtime de `21.2.0` a `21.2.8` (`@angular/animations`, `@angular/common`, `@angular/compiler`, `@angular/core`, `@angular/forms`, `@angular/platform-browser`, `@angular/platform-browser-dynamic`, `@angular/router`)
- Actualización de tooling de Angular: `@angular/build` y `@angular/cli` de `21.2.0` a `21.2.7`
- Actualización de `@angular/compiler-cli` de `21.2.0` a `21.2.8`
- Overrides de seguridad añadidos para `tar@7.5.11` y `undici@7.24.0`

### Security

- Regeneración de dependencias y lockfile con parches transitivos de seguridad aplicados
- Auditoría de npm en estado limpio: `0 vulnerabilities`

## [2.0.1] - 2026-03-04

### Changed

- Actualización de Angular y toolchain de `21.1.3` a `21.2.0` (`@angular/core`, `@angular/cli`, `@angular/build`, `@angular/compiler-cli` y paquetes `@angular/*` relacionados)

### Fixed

- Corrección de `app.component.spec.ts` para eliminar expectativas obsoletas y validar el layout/navegación actual del componente raíz
- Corrección de `truth-table-generator.component.spec.ts` agregando un proveedor de `ActivatedRoute` para evitar el error `NG0201` en pruebas unitarias

### Security

- Regeneración completa de dependencias (`node_modules` y `package-lock.json`) con auditoría final en `0 vulnerabilities`

## [2.0.0] - 2026-02-07

### Added

- Selector de modelos de IA con soporte para Gemini 3 Flash, 2.5 Flash, 2.5 Flash-Lite, 3 Pro y 2.5 Pro
- Badges de tier (Gratis / Pago) en el selector de modelos
- Secciones colapsables con animación de chevron (rotación 180°)
- Toggle de tema como botón de icono con animación de rotación
- Paleta de colores completa: tema oscuro (ink/charcoal zinc) y tema claro (warm stone/paper)
- Fuentes tipográficas: JetBrains Mono (display/monospaced) y Poppins (body)
- Iconos Material Symbols Outlined
- Indicador deslizante en el selector de modo con glassmorphism
- Inputs con estilo underline y grid de operadores transparente
- Chips de ejemplo con borde dashed
- Scroll horizontal interno en tablas para responsive
- Footer editorial con separador centrado y link con underline animado
- Lazy loading de componentes via `loadComponent` en rutas

### Changed

- **Angular 19 → 21.1.3**: Migración completa del framework
- **TypeScript ~5.7.0 → ~5.9.3**
- Todos los componentes migrados a signals (`signal()`, `computed()`, `input()`, `output()`, `viewChild()`)
- Estrategia de detección de cambios: `OnPush` en todos los componentes
- Inyección de dependencias: `inject()` en lugar de constructor injection
- Templates: `@if` / `@for` en lugar de `*ngIf` / `*ngFor`
- Rediseño completo de todos los componentes con estética Swiss-minimal
- Header: marca con Material Icon + tipografía JetBrains Mono
- Mode-selector: navegación fija inferior con indicador deslizante
- Truth-table-generator: secciones colapsables, inputs underline, grid de operadores
- Practice-table: misma estética Swiss-minimal con celdas de práctica interactivas
- Modelo por defecto de Gemini cambiado a `gemini-2.5-flash` (free tier)

### Fixed

- Overflow horizontal en responsive al generar tablas con muchas columnas
- Contenedores con `box-sizing: border-box` para evitar márgenes fantasma en móvil

## [1.2.0] - 2025-09-19

`2f1a014` Improve logic prompt and switch to gemini-2.5-pro

### Changed

- Prompt del sistema expandido con análisis estructural detallado, reglas de formato más estrictas y ejemplos más completos
- Modelo de Gemini cambiado de `gemini-2.5-flash` a `gemini-2.5-pro` para mejorar la calidad de las respuestas

## [1.1.0] - 2025-09-04

`4e4f8fb` Add light/dark theme toggle and improve UI styles

### Added

- Botón de toggle para cambiar entre tema claro y oscuro
- Persistencia de preferencia de tema del usuario via localStorage
- Detección automática del tema del sistema operativo
- Variables CSS para ambos temas (dark y light)

### Changed

- Refactorización del CSS global y de componentes para usar variables CSS
- Mejoras en accesibilidad y responsividad
- Secciones de ayuda y guía mejoradas en el generador de tablas de verdad
- Elementos UI unificados para un look más consistente

## [1.0.1] - 2025-09-02

`4230bde` Add Gemini LLM integration for NL to logic expression

### Added

- Servicio `GeminiService` usando `@google/genai` para convertir enunciados en lenguaje natural a expresiones lógicas
- UI para gestión de API Key (guardar, eliminar, mostrar/ocultar)
- Campo de texto para ingresar enunciados en español
- Generación automática de expresiones lógicas desde enunciados via IA

## [1.0.0] - 2025-08-28

`47bf6cd` Initialize Angular project with core components

`c593d68` Add Vercel Analytics integration

### Added

- Proyecto Angular inicializado con Angular CLI
- Componentes: header, footer, mode-selector, practice-table, truth-table-generator
- Servicio `TruthTableService` para lógica de tablas de verdad
- Integración con Vercel Analytics
- Configuración de VS Code y editor

## [0.0.0] - 2025-08-27

`b489bef` Initial commit

### Added

- Commit inicial del repositorio
