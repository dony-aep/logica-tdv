import { Component, ChangeDetectionStrategy, ElementRef, OnInit, viewChild, signal, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TruthTableService, TableData, Step } from '../../services/truth-table.service';
import { ActivatedRoute } from '@angular/router';
import { GeminiService } from '../../services/gemini.service';

@Component({
  selector: 'app-truth-table-generator',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule],
  templateUrl: './truth-table-generator.component.html',
  styleUrl: './truth-table-generator.component.css'
})
export class TruthTableGeneratorComponent implements OnInit {
  private readonly truthTableService = inject(TruthTableService);
  private readonly route = inject(ActivatedRoute);
  private readonly gemini = inject(GeminiService);

  readonly exprInput = viewChild<ElementRef<HTMLInputElement>>('exprInput');

  readonly expression = signal('');
  readonly status = signal<{ message: string; type: string }>({ message: '', type: '' });
  readonly nlStatus = signal<{ message: string; type: '' | 'ok' | 'err' }>({ message: '', type: '' });
  readonly examples = signal<string[]>([]);
  readonly tableData = signal<TableData | null>(null);
  readonly isHelpModalVisible = signal(false);
  readonly highlighted = signal<{ main: number | null; sources: Set<number> }>({ main: null, sources: new Set() });

  // NL → Expresión (LLM)
  readonly apiKey = signal('');
  readonly hasApiKey = signal(false);
  readonly showApiKey = signal(false);
  readonly statement = signal('');
  readonly nlLoading = signal(false);
  readonly selectedModel = signal('gemini-2.5-flash');

  readonly availableModels: { id: string; label: string; tier: 'free' | 'paid' }[] = [
    { id: 'gemini-3-flash-preview', label: 'Gemini 3 Flash', tier: 'free' },
    { id: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash', tier: 'free' },
    { id: 'gemini-2.5-flash-lite', label: 'Gemini 2.5 Flash-Lite', tier: 'free' },
    { id: 'gemini-3-pro-preview', label: 'Gemini 3 Pro', tier: 'paid' },
    { id: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro', tier: 'paid' },
  ];

  ngOnInit(): void {
    this.createExamples();
    // Cargar API Key, último enunciado y última expresión
    try {
      const savedKey = localStorage.getItem('GEMINI_API_KEY');
      if (savedKey) { this.apiKey.set(savedKey); this.hasApiKey.set(true); }
      const prevStmt = localStorage.getItem('LAST_STATEMENT');
      if (prevStmt) { this.statement.set(prevStmt); }
      const prevExpr = localStorage.getItem('LAST_GENERATED_EXPR');
      if (prevExpr) { this.expression.set(prevExpr); }
    } catch {}
    this.route.queryParamMap.subscribe(params => {
      const expr = params.get('expr');
      if (expr && expr.trim()) {
        this.expression.set(expr);
        this.generateTable();
      }
    });
  }

  generateTable(): void {
    try {
      const data = this.truthTableService.generateTableFromExpression(this.expression());
      this.tableData.set(data);
      const total = data.rows.length;
      const finalText = data.steps.length ? ` | Resultado: ${data.finalExpr}` : "";
      this.setStatus(`Tabla generada: ${total} filas.${finalText}`, "ok");
    } catch (e: any) {
      this.setStatus(e.message || "Error al procesar la expresión.", "err");
      this.tableData.set(null);
    }
  }
  
  onKeydown(e: KeyboardEvent): void {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey || !e.shiftKey)) {
      e.preventDefault();
      this.generateTable();
    }
  }

  createExamples(): void {
    this.examples.set([
      "[(p∧¬q)→(r∨p)]↔[¬q→(r∨p)]",
      "¬(p ∨ q) → r",
      "(p ∧ q) → (r ↔ s)",
      "p ↔ (q ∨ r)",
      "[a ∨ b] ∧ (¬a ∨ c)",
      "!(p && q) -> (r || s)",
      "(X ∨ Y) ↔ (¬Z)",
      "(Lluvia ∧ ¬Nubes) → Paraguas",
    ]);
  }

  setExample(expr: string): void {
    this.expression.set(expr);
    this.status.set({ message: '', type: '' });
    this.tableData.set(null);
  }
  
  clearExpression(): void {
    this.expression.set('');
    this.status.set({ message: '', type: '' });
    this.tableData.set(null);
    this.exprInput()?.nativeElement.focus();
  }

  insertText(text: string): void {
    const inputEl = this.exprInput()?.nativeElement;
    if (!inputEl) return;
    const start = inputEl.selectionStart ?? inputEl.value.length;
    const end = inputEl.selectionEnd ?? inputEl.value.length;
    const val = inputEl.value;
    inputEl.value = val.slice(0, start) + text + val.slice(end);
    this.expression.set(inputEl.value);
    inputEl.focus();
    const pos = start + text.length;
    inputEl.setSelectionRange(pos, pos);
  }

  setStatus(msg: string, type: 'ok' | 'err' | ''): void {
    this.status.set({ message: msg, type });
  }

  setNlStatus(msg: string, type: '' | 'ok' | 'err'): void {
    this.nlStatus.set({ message: msg, type });
  }
  
  onHighlightStep(stepIndex: number): void {
    const data = this.tableData();
    if (!data) return;
    const step = data.steps[stepIndex];
    const sources = new Set<number>();
    
    step.args.forEach(arg => {
      if (arg.kind === 'var' && arg.name) {
        const varIndex = data.vars.indexOf(arg.name);
        if (varIndex > -1) sources.add(varIndex);
      } else if (arg.kind === 'step' && arg.idx !== undefined) {
        sources.add(data.vars.length + arg.idx);
      }
    });
    
    this.highlighted.set({ main: data.vars.length + stepIndex, sources });
  }

  onClearHighlight(): void {
    this.highlighted.set({ main: null, sources: new Set() });
  }

  openHelpModal(): void {
    this.isHelpModalVisible.set(true);
  }

  closeHelpModal(): void {
    this.isHelpModalVisible.set(false);
  }

  escapeHtml(s: string): string {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  // --- API Key management ---
  saveApiKey(): void {
    if (!this.apiKey() || !this.apiKey().trim()) {
      this.setNlStatus('Ingresa una API Key válida.', 'err');
      return;
    }
    try {
      localStorage.setItem('GEMINI_API_KEY', this.apiKey().trim());
      this.hasApiKey.set(true);
      this.setNlStatus('API Key guardada.', 'ok');
    } catch {
      this.setNlStatus('No se pudo guardar la API Key.', 'err');
    }
  }

  clearApiKey(): void {
    try {
      localStorage.removeItem('GEMINI_API_KEY');
      this.apiKey.set('');
      this.hasApiKey.set(false);
      this.setNlStatus('API Key eliminada.', 'ok');
    } catch {
      this.setNlStatus('No se pudo eliminar la API Key.', 'err');
    }
  }

  // --- LLM flow ---
  async generateFromStatement(): Promise<void> {
    this.setNlStatus('', '');
    const key = this.apiKey().trim() || localStorage.getItem('GEMINI_API_KEY') || '';
    if (!key) { this.setNlStatus('Configura tu API Key primero.', 'err'); return; }
    if (!this.statement() || !this.statement().trim()) { this.setNlStatus('Escribe un enunciado.', 'err'); return; }
    try {
      this.nlLoading.set(true);
      try { localStorage.setItem('LAST_STATEMENT', this.statement().trim()); } catch {}
      const expr = await this.gemini.getExpressionFromStatement(key, this.statement().trim(), this.selectedModel());
      const clean = (expr || '').replace(/^```[a-z]*\n?|```$/g, '').trim();
      if (!clean) { this.setNlStatus('No se obtuvo una expresión.', 'err'); return; }
      this.expression.set(clean);
      try { localStorage.setItem('LAST_GENERATED_EXPR', this.expression()); } catch {}
      this.setNlStatus('Expresión generada.', 'ok');
    } catch (e: any) {
      this.setNlStatus(e?.message || 'Error al generar la expresión.', 'err');
    } finally {
      this.nlLoading.set(false);
    }
  }
}
