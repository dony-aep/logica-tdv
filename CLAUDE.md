# CLAUDE.md

Generador y practicador de tablas de verdad de lógica proposicional. Angular 22, SPA
100% cliente, sin backend ni variables de entorno.

El README cubre features e instalación; este archivo cubre lo que no se ve leyendo un
solo archivo.

## Comandos

```bash
npm start                                          # dev server → localhost:4200
npm run build                                      # build de producción (default)
npm test                                           # vitest en modo watch
npx ng test --watch=false                          # una pasada, para CI/agentes
npm audit                                          # debe dar 0 vulnerabilidades
```

Usa siempre `--watch=false` al verificar cambios: en una terminal interactiva `npm test`
se queda en watch y no termina.

## Arquitectura

Todo el motor lógico vive en `src/app/services/truth-table.service.ts`. Los componentes
solo pintan. El pipeline (`processExpression`) es:

```
normalize → tokenize → toRPN → buildStepsFromRPN → generateTruthAssignments → evalSteps
```

1. **`normalize`** acepta sintaxis alternativa y la unifica a símbolos: `->`/`=>` → `→`,
   `&&`/`&`/`*`/`·` → `∧`, `+`/`||` → `∨`, `!`/`~` → `¬`, `and`/`or`/`not`, y
   `[]`/`{}` → `()`. Al añadir sintaxis nueva, este es el único sitio a tocar.
2. **`toRPN`** es shunting-yard. Precedencia: `¬`(5) > `∧`(4) > `∨`(3) > `→`(2) > `↔`(1).
   **`¬` y `→` son asociativos por la derecha**; el resto por la izquierda.
3. **`buildStepsFromRPN`** memoiza subexpresiones por su string `expr`, así que una
   subexpresión repetida genera **una sola columna** compartida. Si cambias el formato de
   `expr`, cambias qué se deduplica.
4. `TableRow.stepVals` es paralelo a `steps` — mismo índice, misma columna.

Las variables se ordenan con `localeCompare(es)` y hay un límite duro de **10 variables**
(2^10 = 1024 filas).

### Los dos modos comparten el motor

- **Generar** (`generateTableFromExpression`) → `TableData`, con `stepVals` calculados.
- **Practicar** (`generatePracticeShell`) → `PracticeTableData`, filas **sin** `stepVals`;
  el usuario los rellena y `practice-table` valida llamando a `evalSteps` con el mismo
  servicio. La corrección nunca se duplica: si tocas `evalSteps`, afecta a ambos modos.

### Integración con Gemini

`gemini.service.ts` convierte enunciado en español → expresión lógica. La API key la pone
**el usuario** en la UI y se guarda en `localStorage`. No hay key en el repo ni variable
de entorno, y no debe haberla: el bundle es público. Nunca hardcodees una key ni la muevas
a `environment.ts`.

El prompt del sistema es un contrato afinado (símbolos permitidos, salida de una sola
línea, parentización completa). Si lo cambias, verifica que la salida siga entrando limpia
en `normalize`.

Claves de `localStorage` en uso: `GEMINI_API_KEY`, `LAST_STATEMENT`,
`LAST_GENERATED_EXPR`, `theme`.

## Convenciones de Angular

El proyecto ya usa el estilo moderno. Imítalo:

- **Standalone**, sin NgModules. Rutas con `loadComponent()` (lazy).
- **`OnPush` sin declararlo.** Es el default desde Angular 22, así que los componentes no
  llevan `changeDetection`. No uses `ChangeDetectionStrategy.Eager`, que devuelve el
  comportamiento anterior a la 22 y revisa el componente en cada ciclo.
- **Signals** para estado: `signal()`, `input()`, `output()`, `viewChild()`. No uses
  `@Input`/`@Output` decoradores ni `BehaviorSubject` para estado de componente.
- **`inject()`** en campos `private readonly`, no inyección por constructor.
- TypeScript en `strict` + `strictTemplates` + `noPropertyAccessFromIndexSignature`.

La app es zoneless: no carga zone.js y la detección de cambios solo corre cuando cambia
una signal leída en la plantilla o salta un listener. Un valor que no sea signal no se
pinta solo; guárdalo en una signal, no reintroduzcas `provideZoneChangeDetection`.

## Convenciones del proyecto

- **Todo en español**: comentarios, mensajes de error, textos de UI y mensajes de commit.
- Commits en Conventional Commits con scope en español: `fix(seguridad):`, `feat(ui):`.
- CSS plano por componente, sin librería de UI ni preprocesador.
- Tests con Vitest sobre jsdom, junto al archivo que prueban (`*.spec.ts`). Los globals
  (`describe`, `it`, `expect`, `vi`) vienen de `vitest/globals`, sin imports.

## Dependencias y seguridad

El bloque `overrides` de `package.json` existe **solo** para cerrar alertas de Dependabot
en dependencias transitivas del tooling; ninguna es dependencia directa.

Usa **rangos caret** (`^7.5.22`), no versiones exactas. Los pines exactos se quedan
obsoletos con cada advisory nuevo y provocaron varias rondas repetidas de arreglos; el
caret se auto-corrige dentro del mismo major y el lockfile mantiene la reproducibilidad.

Cuando un paquete convive en varios majors dentro del árbol (`body-parser`,
`brace-expansion`), usa la sintaxis por major — `"brace-expansion@2": "^2.1.2"` — en vez
de un override único que forzaría un major incompatible sobre los paquetes que dependen
del otro.

Tras tocar dependencias, verifica las tres: `npm audit`, `npm run build` y
`npx ng test --watch=false`.
