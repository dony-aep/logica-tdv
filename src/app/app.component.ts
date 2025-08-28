import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { filter } from 'rxjs';
import { HeaderComponent } from './components/header/header.component';
import { FooterComponent } from './components/footer/footer.component';
import { ModeSelectorComponent, AppMode } from './components/mode-selector/mode-selector.component';
import { inject } from '@vercel/analytics';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    HeaderComponent,
    FooterComponent,
    ModeSelectorComponent
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  title = 'logica-tdv-angular';
  selectedMode: AppMode = 'generate';

  constructor(
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    // Inicializar Vercel Analytics solo en el navegador
    if (isPlatformBrowser(this.platformId)) {
      inject();
    }

    // Escuchar cambios de ruta para mantener el estado del selector actualizado
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      const mode = event.urlAfterRedirects.substring(1) as AppMode;
      if (mode === 'generate' || mode === 'practice') {
        this.selectedMode = mode;
      }
    });
  }

  selectMode(mode: AppMode): void {
    this.router.navigate([mode]);
  }
}