import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class SidebarStateService {
  private readonly STORAGE_KEY = 'betregister_sidebar_collapsed';

  // Desktop sidebar collapsed state (persisted)
  collapsed = signal<boolean>(
    typeof localStorage !== 'undefined'
      ? localStorage.getItem(this.STORAGE_KEY) === 'true'
      : false
  );

  // Mobile drawer open state
  mobileOpen = signal<boolean>(false);

  toggleCollapse() {
    this.collapsed.update((v) => {
      const next = !v;
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(this.STORAGE_KEY, String(next));
      }
      return next;
    });
  }

  setCollapsed(value: boolean) {
    this.collapsed.set(value);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(this.STORAGE_KEY, String(value));
    }
  }

  openMobile() {
    this.mobileOpen.set(true);
  }

  closeMobile() {
    this.mobileOpen.set(false);
  }
}
