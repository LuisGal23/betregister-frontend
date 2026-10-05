import { Injectable, signal } from '@angular/core';
@Injectable({ providedIn: 'root' })
export class ThemeService {
  dark = signal(true);
  constructor() {
    try {
      this.dark.set(localStorage.getItem('betregister-theme-v2') !== 'light');
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
      localStorage.setItem('betregister-theme-v2', this.dark() ? 'dark' : 'light');
    } catch {}
  }
}
