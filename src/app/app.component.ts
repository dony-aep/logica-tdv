import { Component, ChangeDetectionStrategy, OnInit, PLATFORM_ID, signal, inject } from '@angular/core';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { filter } from 'rxjs';
import { HeaderComponent } from './components/header/header.component';
import { FooterComponent } from './components/footer/footer.component';
import { ModeSelectorComponent, AppMode } from './components/mode-selector/mode-selector.component';
import { inject as injectAnalytics } from '@vercel/analytics';

@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterOutlet,
    HeaderComponent,
    FooterComponent,
    ModeSelectorComponent
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly platformId = inject(PLATFORM_ID);

  readonly selectedMode = signal<AppMode>('generate');

  ngOnInit(): void {
    // Inicializar Vercel Analytics solo en el navegador
    if (isPlatformBrowser(this.platformId)) {
      injectAnalytics();
    }

    // Escuchar cambios de ruta para mantener el estado del selector actualizado
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      const path = event.urlAfterRedirects.split('?')[0];
      const mode = path.substring(1) as AppMode;
      if (mode === 'generate' || mode === 'practice') {
        this.selectedMode.set(mode);
      }
    });
  }

  selectMode(mode: AppMode): void {
    this.router.navigate([mode]);
  }
}