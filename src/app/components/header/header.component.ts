import { Component, ChangeDetectionStrategy, OnInit, signal, computed, inject } from '@angular/core';
import { Renderer2 } from '@angular/core';

@Component({
  selector: 'app-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent implements OnInit {
  private readonly renderer = inject(Renderer2);

  readonly currentTheme = signal<'light' | 'dark'>('dark');
  readonly themeIcon = computed(() => this.currentTheme() === 'dark' ? 'light_mode' : 'dark_mode');

  ngOnInit(): void {
    try {
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme === 'light' || savedTheme === 'dark') {
        this.currentTheme.set(savedTheme);
      } else {
        const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches;
        this.currentTheme.set(prefersDark ? 'dark' : 'light');
      }
    } catch {}
    this.applyTheme();
  }

  toggleTheme(): void {
    this.currentTheme.update(theme => theme === 'dark' ? 'light' : 'dark');
    try {
      localStorage.setItem('theme', this.currentTheme());
    } catch {}
    this.applyTheme();
  }

  private applyTheme(): void {
    if (this.currentTheme() === 'light') {
      this.renderer.addClass(document.documentElement, 'light-theme');
    } else {
      this.renderer.removeClass(document.documentElement, 'light-theme');
    }
  }
}
