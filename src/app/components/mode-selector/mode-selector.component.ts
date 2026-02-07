import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';

// Definimos un tipo para que el modo sea consistente en toda la aplicación
export type AppMode = 'generate' | 'practice';

@Component({
  selector: 'app-mode-selector',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
  templateUrl: './mode-selector.component.html',
  styleUrl: './mode-selector.component.css'
})
export class ModeSelectorComponent {
  readonly selectedMode = input<AppMode>('generate');
  readonly modeChange = output<AppMode>();

  selectMode(mode: AppMode): void {
    this.modeChange.emit(mode);
  }
}
