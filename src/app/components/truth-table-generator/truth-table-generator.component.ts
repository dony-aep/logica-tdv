import { Component, ElementRef, OnInit, ViewChild, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TruthTableService, TableData, Step } from '../../services/truth-table.service';

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
  examples: string[] = [];
  tableData: TableData | null = null;
  isHelpModalVisible = false;
  
  highlighted: { main: number | null, sources: Set<number> } = { main: null, sources: new Set() };

  constructor(
    private cdr: ChangeDetectorRef,
    private truthTableService: TruthTableService
  ) {}

  ngOnInit(): void {
    this.createExamples();
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
}
