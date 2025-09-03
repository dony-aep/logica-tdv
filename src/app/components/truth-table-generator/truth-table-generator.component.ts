import { Component, ElementRef, OnInit, ViewChild, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TruthTableService, TableData, Step } from '../../services/truth-table.service';
import { ActivatedRoute } from '@angular/router';
import { GeminiService } from '../../services/gemini.service';

@Component({
  selector: 'app-truth-table-generator',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './truth-table-generator.component.html',
  styleUrl: './truth-table-generator.component.css'
})
export class TruthTableGeneratorComponent implements OnInit {
  @ViewChild('exprInput') exprInput!: ElementRef<HTMLInputElement>;

  expression = '';
  status = { message: '', type: '' };
  nlStatus: { message: string, type: '' | 'ok' | 'err' } = { message: '', type: '' };
  examples: string[] = [];
  tableData: TableData | null = null;
  isHelpModalVisible = false;
  
  highlighted: { main: number | null, sources: Set<number> } = { main: null, sources: new Set() };

  // NL → Expresión (LLM)
  apiKey: string = '';
  hasApiKey: boolean = false;
  showApiKey: boolean = false;
  statement: string = '';
  nlLoading: boolean = false;

  constructor(
    private cdr: ChangeDetectorRef,
    private truthTableService: TruthTableService,
    private route: ActivatedRoute,
    private gemini: GeminiService,
  ) {}

  ngOnInit(): void {
    this.createExamples();
    // Cargar API Key, último enunciado y última expresión
    try {
      const savedKey = localStorage.getItem('GEMINI_API_KEY');
      if (savedKey) { this.apiKey = savedKey; this.hasApiKey = true; }
      const prevStmt = localStorage.getItem('LAST_STATEMENT');
      if (prevStmt) { this.statement = prevStmt; }
      const prevExpr = localStorage.getItem('LAST_GENERATED_EXPR');
      if (prevExpr) { this.expression = prevExpr; }
    } catch {}
    this.route.queryParamMap.subscribe(params => {
      const expr = params.get('expr');
      if (expr && expr.trim()) {
        this.expression = expr;
        this.generateTable();
      }
    });
  }

  generateTable(): void {
    try {
      this.tableData = this.truthTableService.generateTableFromExpression(this.expression);
      const total = this.tableData.rows.length;
      const finalText = this.tableData.steps.length ? ` | Resultado: ${this.tableData.finalExpr}` : "";
      this.setStatus(`Tabla generada: ${total} filas.${finalText}`, "ok");
    } catch (e: any) {
      this.setStatus(e.message || "Error al procesar la expresión.", "err");
      this.tableData = null;
    }
  }
  
  onKeydown(e: KeyboardEvent): void {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey || !e.shiftKey)) {
      e.preventDefault();
      this.generateTable();
    }
  }

  createExamples(): void {
    this.examples = [
      "[(p∧¬q)→(r∨p)]↔[¬q→(r∨p)]",
      "¬(p ∨ q) → r",
      "(p ∧ q) → (r ↔ s)",
      "p ↔ (q ∨ r)",
      "[a ∨ b] ∧ (¬a ∨ c)",
      "!(p && q) -> (r || s)",
      "(X ∨ Y) ↔ (¬Z)",
      "(Lluvia ∧ ¬Nubes) → Paraguas",
    ];
  }

  setExample(expr: string): void {
    this.expression = expr;
    this.status = { message: '', type: '' };
    this.tableData = null;
  }
  
  clearExpression(): void {
    this.expression = '';
    this.status = { message: '', type: '' };
    this.tableData = null;
    if (this.exprInput) {
      this.exprInput.nativeElement.focus();
    }
  }

  insertText(text: string): void {
    const input = this.exprInput.nativeElement;
    const start = input.selectionStart ?? input.value.length;
    const end = input.selectionEnd ?? input.value.length;
    const val = input.value;
    input.value = val.slice(0, start) + text + val.slice(end);
    this.expression = input.value;
    input.focus();
    const pos = start + text.length;
    input.setSelectionRange(pos, pos);
    this.cdr.detectChanges();
  }

  setStatus(msg: string, type: 'ok' | 'err' | ''): void {
    this.status = { message: msg, type: type };
  }

  setNlStatus(msg: string, type: '' | 'ok' | 'err'): void {
    this.nlStatus = { message: msg, type };
  }
  
  onHighlightStep(stepIndex: number): void {
    if (!this.tableData) return;
    const step = this.tableData.steps[stepIndex];
    const sources = new Set<number>();
    
    step.args.forEach(arg => {
      if (arg.kind === 'var' && arg.name) {
        const varIndex = this.tableData!.vars.indexOf(arg.name);
        if (varIndex > -1) sources.add(varIndex);
      } else if (arg.kind === 'step' && arg.idx !== undefined) {
        sources.add(this.tableData!.vars.length + arg.idx);
      }
    });
    
    this.highlighted = {
      main: this.tableData.vars.length + stepIndex,
      sources
    };
  }

  onClearHighlight(): void {
    this.highlighted = { main: null, sources: new Set() };
  }

  openHelpModal(): void {
    this.isHelpModalVisible = true;
  }

  closeHelpModal(): void {
    this.isHelpModalVisible = false;
  }

  escapeHtml(s: string): string {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  // --- API Key management ---
  saveApiKey(): void {
    if (!this.apiKey || !this.apiKey.trim()) {
      this.setNlStatus('Ingresa una API Key válida.', 'err');
      return;
    }
    try {
      localStorage.setItem('GEMINI_API_KEY', this.apiKey.trim());
      this.hasApiKey = true;
      this.setNlStatus('API Key guardada.', 'ok');
    } catch {
      this.setNlStatus('No se pudo guardar la API Key.', 'err');
    }
  }

  clearApiKey(): void {
    try {
      localStorage.removeItem('GEMINI_API_KEY');
      this.apiKey = '';
      this.hasApiKey = false;
      this.setNlStatus('API Key eliminada.', 'ok');
    } catch {
      this.setNlStatus('No se pudo eliminar la API Key.', 'err');
    }
  }

  // --- LLM flow ---
  async generateFromStatement(): Promise<void> {
    this.setNlStatus('', '');
    const key = this.apiKey.trim() || localStorage.getItem('GEMINI_API_KEY') || '';
    if (!key) { this.setNlStatus('Configura tu API Key primero.', 'err'); return; }
    if (!this.statement || !this.statement.trim()) { this.setNlStatus('Escribe un enunciado.', 'err'); return; }
    try {
      this.nlLoading = true;
      try { localStorage.setItem('LAST_STATEMENT', this.statement.trim()); } catch {}
      const expr = await this.gemini.getExpressionFromStatement(key, this.statement.trim());
      const clean = (expr || '').replace(/^```[a-z]*\n?|```$/g, '').trim();
      if (!clean) { this.setNlStatus('No se obtuvo una expresión.', 'err'); return; }
      this.expression = clean;
      try { localStorage.setItem('LAST_GENERATED_EXPR', this.expression); } catch {}
      this.setNlStatus('Expresión generada.', 'ok');
    } catch (e: any) {
      this.setNlStatus(e?.message || 'Error al generar la expresión.', 'err');
    } finally {
      this.nlLoading = false;
    }
  }
}
