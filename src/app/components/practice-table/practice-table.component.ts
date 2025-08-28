import { Component, ElementRef, ViewChild, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TruthTableService, PracticeTableData } from '../../services/truth-table.service';

@Component({
  selector: 'app-practice-table',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './practice-table.component.html',
  styleUrls: ['./practice-table.component.css']
})
export class PracticeTableComponent {
  @ViewChild('exprInput') exprInput!: ElementRef<HTMLInputElement>;

  expression = '';
  status = { message: '', type: '' };
  practiceData: PracticeTableData | null = null;
  userPracticeInputs: (boolean | null)[][] = [];
  verificationStatus: ('correct' | 'incorrect' | 'unfilled')[][] = [];
  isPracticeVerified = false;
  isHelpModalVisible = false;

  constructor(
    private cdr: ChangeDetectorRef,
    private truthTableService: TruthTableService
  ) {}

  onKeydown(e: KeyboardEvent): void {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey || !e.shiftKey)) {
      e.preventDefault();
      this.startPractice();
    }
  }

  clearExpression(): void {
    this.expression = '';
    this.status = { message: '', type: '' };
    this.practiceData = null;
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

  openHelpModal(): void {
    this.isHelpModalVisible = true;
  }

  closeHelpModal(): void {
    this.isHelpModalVisible = false;
  }

  startPractice(): void {
    try {
      const practiceShell = this.truthTableService.generatePracticeShell(this.expression);
      this.practiceData = practiceShell;

      const rows = practiceShell.rows.length;
      const steps = practiceShell.steps.length;
      this.userPracticeInputs = Array(rows).fill(0).map(() => Array(steps).fill(null));
      this.verificationStatus = Array(rows).fill(0).map(() => Array(steps).fill('unfilled'));
      this.isPracticeVerified = false;
      
      this.setStatus(`Tabla generada para "${practiceShell.finalExpr}". ¡Completa los valores!`, "ok");

    } catch (e: any) {
      this.setStatus(e.message || "Error al procesar la expresión.", "err");
      this.practiceData = null;
    }
  }

  togglePracticeCellValue(rowIndex: number, colIndex: number): void {
    const currentValue = this.userPracticeInputs[rowIndex][colIndex];
    if (currentValue === null) {
      this.userPracticeInputs[rowIndex][colIndex] = true;
    } else if (currentValue === true) {
      this.userPracticeInputs[rowIndex][colIndex] = false;
    } else {
      this.userPracticeInputs[rowIndex][colIndex] = null;
    }
    
    if (this.isPracticeVerified) {
      this.verificationStatus[rowIndex][colIndex] = 'unfilled';
    }
  }

  verifyAnswers(): void {
    if (!this.practiceData) return;

    const { steps, rows } = this.practiceData;
    let errorCount = 0;
    let unfilledCount = 0;

    for (let i = 0; i < rows.length; i++) {
        const correctStepVals = this.truthTableService.evalSteps(steps, rows[i].env);
        for (let j = 0; j < steps.length; j++) {
            const userVal = this.userPracticeInputs[i][j];
            const correctVal = correctStepVals[j];

            if (userVal === null) {
                this.verificationStatus[i][j] = 'unfilled';
                unfilledCount++;
            } else if (userVal === correctVal) {
                this.verificationStatus[i][j] = 'correct';
            } else {
                this.verificationStatus[i][j] = 'incorrect';
                errorCount++;
            }
        }
    }

    if (errorCount === 0 && unfilledCount === 0) {
        this.setStatus("¡Excelente! Todos los valores son correctos.", "ok");
    } else if (errorCount > 0) {
        this.setStatus(`Se encontraron ${errorCount} error(es). Revisa las celdas marcadas en rojo.`, "err");
    } else {
        this.setStatus(`¡Vas bien! Aún quedan ${unfilledCount} celdas por rellenar.`, "ok");
    }
    this.isPracticeVerified = true;
  }
}
