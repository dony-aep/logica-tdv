# CLAUDE.md

Generador y practicador de tablas de verdad de lógica proposicional. Angular 21, SPA
100% cliente, sin backend ni variables de entorno.

El README cubre features e instalación; este archivo cubre lo que no se ve leyendo un
solo archivo.

## Comandos

```bash
npm start                                          # dev server → localhost:4200
npm run build                                      # build de producción (default)
npm test                                           # karma en modo watch (abre Chrome)
npx ng test --watch=false --browsers=ChromeHeadless # una pasada, para CI/agentes
npm audit                                          # debe dar 0 vulnerabilidades
```

Usa siempre la variante headless al verificar cambios: `npm test` se queda en watch y
no termina.

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
- **`ChangeDetectionStrategy.OnPush` en todos los componentes.** Si añades uno, ponlo.
- **Signals** para estado: `signal()`, `input()`, `output()`, `viewChild()`. No uses
  `@Input`/`@Output` decoradores ni `BehaviorSubject` para estado de componente.
- **`inject()`** en campos `private readonly`, no inyección por constructor.
- TypeScript en `strict` + `strictTemplates` + `noPropertyAccessFromIndexSignature`.

La app sigue en `provideZoneChangeDetection` (zone.js), no zoneless.

## Convenciones del proyecto

- **Todo en español**: comentarios, mensajes de error, textos de UI y mensajes de commit.
- Commits en Conventional Commits con scope en español: `fix(seguridad):`, `feat(ui):`.
- CSS plano por componente, sin librería de UI ni preprocesador.
- Tests con Jasmine + Karma, junto al archivo que prueban (`*.spec.ts`).

## Dependencias y seguridad

El bloque `overrides` de `package.json` existe **solo** para cerrar alertas de Dependabot
en dependencias transitivas del tooling; ninguna es dependencia directa.

Usa **rangos caret** (`^7.5.22`), no versiones exactas. Los pines exactos se quedan
obsoletos con cada advisory nuevo y provocaron varias rondas repetidas de arreglos; el
caret se auto-corrige dentro del mismo major y el lockfile mantiene la reproducibilidad.

Cuando un paquete convive en varios majors dentro del árbol (`body-parser`,
`brace-expansion`), usa la sintaxis por major — `"brace-expansion@2": "^2.1.2"` — en vez
de un override único que forzaría un major incompatible sobre `karma` o `rimraf`.

Tras tocar dependencias, verifica las tres: `npm audit`, `npm run build` y los tests
headless.
