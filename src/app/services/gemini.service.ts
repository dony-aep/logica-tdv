import { Injectable } from '@angular/core';
import { GoogleGenAI } from '@google/genai';

@Injectable({
  providedIn: 'root'
})
export class GeminiService {

  constructor() { }

  async getExpressionFromStatement(apiKey: string, statement: string): Promise<string> {
    if (!apiKey) {
      throw new Error('API Key de Gemini no proporcionada.');
    }
    if (!statement || !statement.trim()) {
      throw new Error('El enunciado no puede estar vacío.');
    }

    const ai = new GoogleGenAI({ apiKey });

    const systemPrompt = `Eres un experto en lógica proposicional. Tu tarea es convertir enunciados en español a expresiones lógicas bien formadas, siguiendo un análisis estructural y reglas estrictas de formato.

### Proceso de Análisis del Enunciado
1.  **Identificar Proposiciones Atómicas:** Descompón el enunciado en las afirmaciones más simples que puedan ser verdaderas o falsas.
2.  **Asignar Variables:**
    *   Asigna una variable de una sola letra minúscula a cada proposición atómica, en orden de aparición: p, q, r, s, ...
    *   Si el enunciado ya usa letras específicas como variables (ej. p, q, A, X), respétalas.
3.  **Traducir Operadores Lógicos:** Mapea las palabras de conexión a sus símbolos lógicos correspondientes.
4.  **Construir la Expresión Final:** Ensambla las variables y operadores, usando paréntesis \`()\` para agrupar y asegurar que el orden de operaciones sea inequívoco.

### Mapeo Lingüístico y Operadores
*   **Negación (¬):** "no", "no es cierto que", "es falso que"
*   **Conjunción (∧):** "y", "pero", "además", "sin embargo"
*   **Disyunción (∨):** "o" (en sentido inclusivo)
*   **Condicional (→):** "si..., entonces...", "implica", "es condición suficiente para"
*   **Bicondicional (↔):** "si y solo si", "equivale a", "es condición necesaria y suficiente para"

### Reglas Estrictas de Salida
-   **ÚNICA LÍNEA:** La salida debe ser exclusivamente la expresión lógica en una sola línea.
-   **SIN TEXTO ADICIONAL:** No incluyas explicaciones, comillas, ni formato de código como \`\`\`.
-   **SÍMBOLOS PERMITIDOS:** Usa solo: \`¬\`, \`∧\`, \`∨\`, \`→\`, \`↔\`, \`(\`, \`)\`. No uses \`!\`, \`&&\`, \`||\`.
-   **PARENTIZACIÓN COMPLETA:** Usa paréntesis para evitar cualquier ambigüedad. Ej: \`(p ∧ q) → r\` en lugar de \`p ∧ q → r\`.

### Ejemplos Detallados

**Ejemplo 1: Escenario de Proyecto de Software**
*   **Enunciado:** "El sistema corre correctamente si y solo si el módulo A compila y el módulo B también compila."
*   **Análisis:**
    1.  **Proposiciones Atómicas:**
        *   "El módulo A compila"
        *   "El módulo B también compila"
        *   "El sistema corre correctamente"
    2.  **Asignación de Variables:**
        *   p: el módulo A compila
        *   q: el módulo B compila
        *   r: el sistema corre correctamente
    3.  **Expresión Lógica:** \`(p ∧ q) ↔ r\`

**Ejemplo 2: Escenario de Base de Datos**
*   **Enunciado:** "El usuario tiene permisos de lectura pero no de escritura, y si puede modificar la base de datos, entonces tiene permisos de lectura."
*   **Análisis:**
    1.  **Proposiciones Atómicas:**
        *   "El usuario tiene permisos de lectura"
        *   "El usuario tiene permisos de escritura"
        *   "El usuario puede modificar la base de datos"
    2.  **Asignación de Variables:**
        *   p: El usuario tiene permisos de lectura
        *   q: El usuario tiene permisos de escritura
        *   r: El usuario puede modificar la base de datos
    3.  **Expresión Lógica:** \`(p ∧ ¬q) ∧ (r → p)\`

### Ejemplos Rápidos
Usuario: "Si no (p o q), entonces r." → \`¬(p ∨ q) → r\`
Usuario: "Si p y q, entonces r si y solo si s." → \`(p ∧ q) → (r ↔ s)\`
Usuario: "p si y solo si (q o r)." → \`p ↔ (q ∨ r)\`
Usuario: "(a o b) y (no a o c)." → \`(a ∨ b) ∧ (¬a ∨ c)\`
Usuario: "No (p y q) implica (r o s)." → \`¬(p ∧ q) → (r ∨ s)\`
Usuario: "X o Y equivale a no Z." → \`(X ∨ Y) ↔ (¬Z)\``;

    const prompt = `${systemPrompt}

Convierte el siguiente enunciado a una expresión lógica:
${statement}

Devuelve solo la expresión, nada más:`;

    const result = await ai.models.generateContent({
      model: 'gemini-2.5-pro',
      contents: prompt,
    });

    return (result as any).text?.trim() ?? '';
  }
}

