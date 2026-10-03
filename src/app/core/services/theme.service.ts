import { Injectable, signal } from '@angular/core';
@Injectable({ providedIn: 'root' })
export class ThemeService {
  dark = signal(false);
  constructor() {
    try {
      this.dark.set(localStorage.getItem('betregister-theme') === 'dark');
    } catch {}
    this.apply();
  }
  toggle() {
    this.dark.update((v) => !v);
    this.apply();
  }
  private apply() {
    document.documentElement.dataset['theme'] = this.dark() ? 'dark' : 'light';
    try {
      localStorage.setItem('betregister-theme', this.dark() ? 'dark' : 'light');
    } catch {}
  }
}
