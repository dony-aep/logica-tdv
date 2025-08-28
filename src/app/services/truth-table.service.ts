import { Injectable } from '@angular/core';

// --- Interfaces ---
export interface StepArg {
  kind: 'var' | 'step';
  name?: string;
  idx?: number;
  expr: string;
}
export interface Step {
  op: string;
  expr: string;
  args: StepArg[];
}
export interface TableRow {
  env: { [key: string]: boolean };
  stepVals: boolean[];
}
export interface TableData {
  vars: string[];
  steps: Step[];
  rows: TableRow[];
  finalExpr: string;
}
// Tipo específico para la estructura de la tabla en el modo práctica
export interface PracticeTableData {
    vars: string[];
    steps: Step[];
    rows: { env: { [key: string]: boolean } }[]; // Las filas solo tienen el entorno, sin los valores de los pasos
    finalExpr: string;
}


@Injectable({
  providedIn: 'root'
})
export class TruthTableService {

  constructor() { }

  // --- API Pública ---

  public generateTableFromExpression(expression: string): TableData {
    const { vars, steps, finalExpr, assigns } = this.processExpression(expression);

    const rows = assigns.map(env => ({
      env,
      stepVals: this.evalSteps(steps, env)
    }));

    return { vars, steps, rows, finalExpr };
  }
  
  public generatePracticeShell(expression: string): PracticeTableData {
    const { vars, steps, finalExpr, assigns } = this.processExpression(expression);
    
    // Para el modo práctica, no calculamos los valores de los pasos todavía.
    const rows = assigns.map(env => ({ env }));

    return { vars, steps, rows, finalExpr };
  }

  public evalSteps(steps: Step[], env: { [key: string]: boolean }): boolean[] {
    const results = new Array<boolean>(steps.length);
    const valueOf = (node: StepArg): boolean => {
      if (node.kind === "var") return !!env[node.name!];
      if (node.kind === "step") return results[node.idx!];
      throw new Error("Nodo desconocido");
    };
    for (let i = 0; i < steps.length; i++) {
      const s = steps[i];
      switch (s.op) {
        case "¬": results[i] = !valueOf(s.args[0]); break;
        case "∧": results[i] = valueOf(s.args[0]) && valueOf(s.args[1]); break;
        case "∨": results[i] = valueOf(s.args[0]) || valueOf(s.args[1]); break;
        case "→": results[i] = (!valueOf(s.args[0])) || valueOf(s.args[1]); break;
        case "↔": results[i] = (valueOf(s.args[0]) === valueOf(s.args[1])); break;
        default: throw new Error("Operador desconocido: " + s.op);
      }
    }
    return results;
  }

  // --- Lógica Interna (privada) ---

  private processExpression(expression: string) {
    if (!expression || !expression.trim()) {
      throw new Error("Escribe una expresión.");
    }
    const normalized = this.normalize(expression);
    const tokens = this.tokenize(normalized);
    const vars = this.uniqueVariables(tokens);

    if (vars.length === 0) {
      throw new Error("No se detectaron variables en la expresión.");
    }
    if (vars.length > 10) {
      throw new Error(`Demasiadas variables (${vars.length}). Límite: 10.`);
    }

    const rpn = this.toRPN(tokens);
    const { steps, finalExpr } = this.buildStepsFromRPN(rpn);
    const assigns = this.generateTruthAssignments(vars);

    return { vars, steps, finalExpr, assigns };
  }

  private normalize(expr: string): string {
    let s = (expr || "").trim();
    s = s.replace(/[\[\{]/g, "(").replace(/[\]\}]/g, ")");
    s = s.replace(/<->|<=>|↔|⇔/g, "↔");
    s = s.replace(/->|=>|→/g, "→");
    s = s.replace(/\band\b/gi, "∧");
    s = s.replace(/\bor\b/gi, "∨");
    s = s.replace(/\bnot\b/gi, "¬");
    s = s.replace(/[&]{2}|&|·|\*/g, "∧");
    s = s.replace(/\|\|/g, "∨");
    s = s.replace(/[+]/g, "∨");
    s = s.replace(/[!~]/g, "¬");
    s = s.replace(/\s+/g, " ").trim();
    return s;
  }

  private tokenize(expr: string): string[] {
    const tokens = [];
    const re = /[A-Za-zÁÉÍÓÚÑáéíóúÜü]+|[↔→∧∨¬()]|\s+/g;
    let m;
    while ((m = re.exec(expr)) !== null) {
      const t = m[0];
      if (/\s+/.test(t)) continue;
      tokens.push(t);
    }
    return tokens;
  }

  private toRPN(tokens: string[]): string[] {
    const out: string[] = [];
    const stack: string[] = [];
    const prec: { [key: string]: number } = { "¬": 5, "∧": 4, "∨": 3, "→": 2, "↔": 1 };
    const rightAssoc = new Set(["¬", "→"]);
    const isOp = (t: string) => ["¬","∧","∨","→","↔"].includes(t);

    for (const t of tokens) {
      if (t === "(") {
        stack.push(t);
      } else if (t === ")") {
        while (stack.length && stack[stack.length - 1] !== "(") out.push(stack.pop()!);
        if (!stack.length) throw new Error("Paréntesis desbalanceados");
        stack.pop();
      } else if (isOp(t)) {
        const op = t;
        while (
          stack.length &&
          stack[stack.length - 1] !== "(" &&
          (
            (!rightAssoc.has(op) && (prec[stack[stack.length - 1]] >= prec[op])) ||
            (rightAssoc.has(op) && (prec[stack[stack.length - 1]] > prec[op]))
          )
        ) {
          out.push(stack.pop()!);
        }
        stack.push(op);
      } else {
        out.push(t);
      }
    }

    while (stack.length) {
      const s = stack.pop()!;
      if (s === "(" || s === ")") throw new Error("Paréntesis desbalanceados");
      out.push(s);
    }
    return out;
  }

  private buildStepsFromRPN(rpn: string[]): { steps: Step[], finalExpr: string } {
    const stack: StepArg[] = [];
    const steps: Step[] = [];
    const memo = new Map<string, StepArg>();
    const isOp = (t: string) => ["¬","∧","∨","→","↔"].includes(t);

    for (const t of rpn) {
      if (!isOp(t)) {
        stack.push({ kind: "var", name: t, expr: t });
        continue;
      }
      let expr: string, args: StepArg[];
      if (t === "¬") {
        const a = stack.pop();
        if (!a) throw new Error("Falta operando para ¬");
        args = [a];
        expr = `¬(${a.expr})`;
      } else {
        const b = stack.pop(), a = stack.pop();
        if (!a || !b) throw new Error(`Faltan operandos para ${t}`);
        args = [a, b];
        expr = `(${a.expr} ${t} ${b.expr})`;
      }

      if (memo.has(expr)) {
        stack.push(memo.get(expr)!);
      } else {
        const stepIndex = steps.length;
        steps.push({ op: t, expr, args });
        const newNode: StepArg = { kind: "step", idx: stepIndex, expr };
        stack.push(newNode);
        memo.set(expr, newNode);
      }
    }

    if (stack.length !== 1) throw new Error("Expresión inválida");
    return { steps, finalExpr: stack[0].expr };
  }

  private uniqueVariables(tokens: string[]): string[] {
    const vars = new Set<string>();
    const ops = new Set(["¬","∧","∨","→","↔","(",")"]);
    for (const t of tokens) {
      if (!ops.has(t) && /^[A-Za-zÁÉÍÓÚÑáéíóúÜü]+$/.test(t)) {
        vars.add(t);
      }
    }
    return Array.from(vars).sort((a,b) => a.localeCompare(b, "es"));
  }

  private generateTruthAssignments(vars: string[]): { [key: string]: boolean }[] {
    const n = vars.length;
    const total = 1 << n;
    const rows = [];
    for (let i = 0; i < total; i++) {
      const env: { [key: string]: boolean } = {};
      for (let j = 0; j < n; j++) {
        env[vars[j]] = !!((i >> (n - 1 - j)) & 1);
      }
      rows.push(env);
    }
    return rows;
  }
}
