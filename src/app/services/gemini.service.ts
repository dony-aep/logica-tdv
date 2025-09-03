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

    const systemPrompt = `Eres un experto en lógica proposicional. Convierte enunciados en español a expresiones lógicas bien formadas.
Reglas de salida estrictas:
- Usa exclusivamente estos símbolos: ¬ (negación), ∧ (conjunción), ∨ (disyunción), → (condicional), ↔ (bicondicional), y paréntesis ().
- Devuelve solo UNA línea con la expresión final, sin texto adicional, sin comillas ni formato de código.
- Parentiza todo lo necesario para evitar ambigüedad.
- Por defecto, usa variables de UNA sola letra minúscula en orden de aparición: p, q, r, s, t, ...
  - Si el enunciado ya incluye letras concretas (p, q, X, Y, Z), respétalas.
  - Si el enunciado requiere más proposiciones, continúa con las siguientes letras.
- No uses and/or/not, ni !, &&, || en la salida; usa siempre ¬, ∧, ∨, →, ↔.

Mapeo lingüístico básico:
- "no" → ¬, "y" → ∧, "o" → ∨ (disyunción inclusiva), "si ... entonces ..." → →, "si y solo si"/"equivale a" → ↔.

Ejemplos (usa variables de una sola letra):
Usuario: "Si no (p o q), entonces r." → ¬(p ∨ q) → r
Usuario: "Si p y q, entonces r si y solo si s." → (p ∧ q) → (r ↔ s)
Usuario: "p si y solo si (q o r)." → p ↔ (q ∨ r)
Usuario: "(a o b) y (no a o c)." → (a ∨ b) ∧ (¬a ∨ c)
Usuario: "No (p y q) implica (r o s)." → ¬(p ∧ q) → (r ∨ s)
Usuario: "X o Y equivale a no Z." → (X ∨ Y) ↔ (¬Z)`;

    const prompt = `${systemPrompt}

Convierte el siguiente enunciado a una expresión lógica:
${statement}

Devuelve solo la expresión, nada más:`;

    const result = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return (result as any).text?.trim() ?? '';
  }
}
