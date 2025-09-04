import { Component, OnInit, Renderer2 } from '@angular/core';

@Component({
  selector: 'app-header',
  imports: [],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent implements OnInit {
  currentTheme: 'light' | 'dark' = 'dark';
  themeIcon: 'light_mode' | 'dark_mode' = 'light_mode';

  constructor(private renderer: Renderer2) {}

  ngOnInit(): void {
    try {
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme === 'light' || savedTheme === 'dark') {
        this.currentTheme = savedTheme;
      } else {
        const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches;
        this.currentTheme = prefersDark ? 'dark' : 'light';
      }
    } catch {}
    this.applyTheme();
  }

  toggleTheme(): void {
    this.currentTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
    try {
      localStorage.setItem('theme', this.currentTheme);
    } catch {}
    this.applyTheme();
  }

  private applyTheme(): void {
    if (this.currentTheme === 'light') {
      this.renderer.addClass(document.documentElement, 'light-theme');
      this.themeIcon = 'dark_mode';
    } else {
      this.renderer.removeClass(document.documentElement, 'light-theme');
      this.themeIcon = 'light_mode';
    }
  }
}
