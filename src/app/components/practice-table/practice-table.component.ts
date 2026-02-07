import { Component, ChangeDetectionStrategy, ElementRef, viewChild, signal, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TruthTableService, PracticeTableData } from '../../services/truth-table.service';

@Component({
  selector: 'app-practice-table',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule],
  templateUrl: './practice-table.component.html',
  styleUrls: ['./practice-table.component.css']
})
export class PracticeTableComponent {
  private readonly truthTableService = inject(TruthTableService);

  readonly exprInput = viewChild<ElementRef<HTMLInputElement>>('exprInput');

  readonly expression = signal('');
  readonly status = signal<{ message: string; type: string }>({ message: '', type: '' });
  readonly practiceData = signal<PracticeTableData | null>(null);
  readonly userPracticeInputs = signal<(boolean | null)[][]>([]);
  readonly verificationStatus = signal<('correct' | 'incorrect' | 'unfilled')[][]>([]);
  readonly isPracticeVerified = signal(false);
  readonly isHelpModalVisible = signal(false);

  onKeydown(e: KeyboardEvent): void {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey || !e.shiftKey)) {
      e.preventDefault();
      this.startPractice();
    }
  }

  clearExpression(): void {
    this.expression.set('');
    this.status.set({ message: '', type: '' });
    this.practiceData.set(null);
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

  openHelpModal(): void {
    this.isHelpModalVisible.set(true);
  }

  closeHelpModal(): void {
    this.isHelpModalVisible.set(false);
  }

  startPractice(): void {
    try {
      const practiceShell = this.truthTableService.generatePracticeShell(this.expression());
      this.practiceData.set(practiceShell);

      const rows = practiceShell.rows.length;
      const steps = practiceShell.steps.length;
      this.userPracticeInputs.set(Array(rows).fill(0).map(() => Array(steps).fill(null)));
      this.verificationStatus.set(Array(rows).fill(0).map(() => Array(steps).fill('unfilled')));
      this.isPracticeVerified.set(false);
      
      this.setStatus(`Tabla generada para "${practiceShell.finalExpr}". ¡Completa los valores!`, "ok");

    } catch (e: any) {
      this.setStatus(e.message || "Error al procesar la expresión.", "err");
      this.practiceData.set(null);
    }
  }

  togglePracticeCellValue(rowIndex: number, colIndex: number): void {
    this.userPracticeInputs.update(inputs => {
      const copy = inputs.map(row => [...row]);
      const currentValue = copy[rowIndex][colIndex];
      if (currentValue === null) {
        copy[rowIndex][colIndex] = true;
      } else if (currentValue === true) {
        copy[rowIndex][colIndex] = false;
      } else {
        copy[rowIndex][colIndex] = null;
      }
      return copy;
    });
    
    if (this.isPracticeVerified()) {
      this.verificationStatus.update(status => {
        const copy = status.map(row => [...row]);
        copy[rowIndex][colIndex] = 'unfilled';
        return copy;
      });
    }
  }

  verifyAnswers(): void {
    const data = this.practiceData();
    if (!data) return;

    const { steps, rows } = data;
    const inputs = this.userPracticeInputs();
    let errorCount = 0;
    let unfilledCount = 0;
    const newStatus: ('correct' | 'incorrect' | 'unfilled')[][] = [];

    for (let i = 0; i < rows.length; i++) {
        const correctStepVals = this.truthTableService.evalSteps(steps, rows[i].env);
        const rowStatus: ('correct' | 'incorrect' | 'unfilled')[] = [];
        for (let j = 0; j < steps.length; j++) {
            const userVal = inputs[i][j];
            const correctVal = correctStepVals[j];

            if (userVal === null) {
                rowStatus.push('unfilled');
                unfilledCount++;
            } else if (userVal === correctVal) {
                rowStatus.push('correct');
            } else {
                rowStatus.push('incorrect');
                errorCount++;
            }
        }
        newStatus.push(rowStatus);
    }

    this.verificationStatus.set(newStatus);

    if (errorCount === 0 && unfilledCount === 0) {
        this.setStatus("¡Excelente! Todos los valores son correctos.", "ok");
    } else if (errorCount > 0) {
        this.setStatus(`Se encontraron ${errorCount} error(es). Revisa las celdas marcadas en rojo.`, "err");
    } else {
        this.setStatus(`¡Vas bien! Aún quedan ${unfilledCount} celdas por rellenar.`, "ok");
    }
    this.isPracticeVerified.set(true);
  }
}
