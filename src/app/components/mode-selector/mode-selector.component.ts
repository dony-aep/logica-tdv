import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

// Definimos un tipo para que el modo sea consistente en toda la aplicación
export type AppMode = 'generate' | 'practice';

@Component({
  selector: 'app-mode-selector',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './mode-selector.component.html',
  styleUrl: './mode-selector.component.css'
})
export class ModeSelectorComponent {
  @Input() selectedMode: AppMode = 'generate';
  @Output() modeChange = new EventEmitter<AppMode>();

  selectMode(mode: AppMode): void {
    this.modeChange.emit(mode);
  }
}
