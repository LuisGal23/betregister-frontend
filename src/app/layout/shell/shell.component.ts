import { TutorialComponent } from '../../shared/components/tutorial/tutorial.component';
import { ThemeService } from '../../core/services/theme.service';
import { Component, computed, ElementRef, inject, OnInit, signal, viewChild } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { LedgerState } from '../../core/services/ledger-state.service';
import { AuthService } from '../../features/auth/services/auth.service';
import { BankService } from '../../features/bank/services/bank.service';
import { IconComponent } from '../../shared/components/icon/icon.component';
@Component({
  selector: 'app-shell',
  imports: [
    TutorialComponent,
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
    FormsModule,
    IconComponent,
  ],
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.css',
})
export class ShellComponent implements OnInit {
  vm = inject(LedgerState);
  theme = inject(ThemeService);
  auth = inject(AuthService);
  bank = inject(BankService);
  router = inject(Router);
  menuButton = viewChild<ElementRef<HTMLButtonElement>>('menuButton');
  sidebar = viewChild<ElementRef<HTMLElement>>('sidebar');
  tutorial = signal(false);
  tutorialButton = viewChild<ElementRef<HTMLButtonElement>>('tutorialButton');
  closeTutorial() {
    this.tutorial.set(false);
    this.tutorialButton()?.nativeElement.focus();
  }
  sidebarOpen = signal(false);
  path = signal(this.router.url.split('?')[0]);
  publicPage = computed(
    () => ['/', '/login', '/register'].includes(this.path()) || !this.vm.authenticated(),
  );
  links = [
    { path: 'overview', label: 'Resumen', icon: 'overview' },
    { path: 'bank', label: 'Mi bank', icon: 'bank' },
    { path: 'bets', label: 'Mis apuestas', icon: 'bets' },
    { path: 'insights', label: 'Recomendaciones', icon: 'trend' },
    { path: 'challenges', label: 'Retos', icon: 'flag' },
  ];
  currentTitle = computed(
    () => this.links.find((l) => '/' + l.path === this.path())?.label ?? 'Mi espacio',
  );
  constructor() {
    this.router.events.pipe(takeUntilDestroyed()).subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.path.set(event.urlAfterRedirects.split('?')[0]);
        this.sidebarOpen.set(false);
      }
    });
  }
  focusMain(event: Event) {
    event.preventDefault();
    document.getElementById('main-content')?.focus();
  }
  ngOnInit() {
    void this.vm.init();
  }
  openMenu() {
    this.sidebarOpen.set(true);
    setTimeout(
      () =>
        this.sidebar()
          ?.nativeElement.querySelector<HTMLAnchorElement>('a[aria-current="page"]')
          ?.focus(),
      0,
    );
  }
  closeMenu() {
    const wasOpen = this.sidebarOpen();
    this.sidebarOpen.set(false);
    if (wasOpen) this.menuButton()?.nativeElement.focus();
  }
}
