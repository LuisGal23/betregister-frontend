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
import { CreateTicketModalComponent } from '../../features/bets/components/create-ticket-modal/create-ticket-modal.component';
import { TicketModalService } from '../../features/bets/services/ticket-modal.service';
import { TranslationService } from '../../core/services/translation.service';

@Component({
  selector: 'app-shell',
  imports: [
    TutorialComponent,
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
    FormsModule,
    IconComponent,
    CreateTicketModalComponent,
  ],
  templateUrl: './shell.component.html',
})
export class ShellComponent implements OnInit {
  vm = inject(LedgerState);
  theme = inject(ThemeService);
  i18n = inject(TranslationService);
  auth = inject(AuthService);
  bank = inject(BankService);
  ticketModal = inject(TicketModalService);
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
    () => (['/', '/login', '/register','/terms','/privacy','/delete-account','/support'].includes(this.path()) || this.path().startsWith('/p/')) || !this.vm.authenticated(),
  );
  links = computed(() => [
    { path: 'overview', label: this.i18n.t().myOverview, icon: 'overview' },
    { path: 'matches', label: this.i18n.t().matches, icon: 'calendar' },
    { path: 'match-analysis', label: this.i18n.t().oddsAndStats, icon: 'trend' },
    { path: 'community', label: this.i18n.t().community, icon: 'chat' },
    { path: 'tickets', label: this.i18n.t().registerTicket, icon: 'plus' },
    { path: 'bank', label: this.i18n.t().myBank, icon: 'bank' },
    { path: 'history', label: this.i18n.t().myBets, icon: 'bets' },
    { path: 'insights', label: this.i18n.t().profitability, icon: 'trend' },
    { path: 'challenges', label: this.i18n.t().challenges, icon: 'flag' },
  ]);
  mobileLinks = computed(() => [
    { path: 'overview', label: 'Resumen', icon: 'overview' },
    { path: 'matches', label: 'Partidos', icon: 'calendar' },
    { path: 'tickets', label: 'Registrar', icon: 'plus' },
    { path: 'history', label: 'Apuestas', icon: 'bets' },
  ]);

  userProfile = computed(() => this.vm.data().profile);
  username = computed(() => this.userProfile().username || this.userProfile().email.split('@')[0]);
  displayName = computed(() => this.userProfile().display_name || this.username());
  userAvatar = computed(() => this.userProfile().avatar_url || '');
  userInitial = computed(() => (this.username() || 'U').slice(0, 2).toUpperCase());
  private menuTrigger: HTMLElement | null = null;
  trapMenu(event: KeyboardEvent) {
    if (!this.sidebarOpen() || event.key !== 'Tab') return;
    const items = Array.from(
      this.sidebar()!.nativeElement.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), select',
      ),
    ).filter((e) => e.getClientRects().length);
    const first = items[0],
      last = items.at(-1);
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last?.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first?.focus();
    }
  }
  currentTitle = computed(() => {
    if (this.path() === '/settings') return this.i18n.t().settingsAndHouses;
    return this.links().find((l) => '/' + l.path === this.path())?.label ?? this.i18n.t().mySpace;
  });
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
    this.menuTrigger = document.activeElement as HTMLElement;
    this.sidebarOpen.set(true);
    setTimeout(
      () =>
        this.sidebar()
          ?.nativeElement.querySelector<HTMLAnchorElement>('a[aria-current="page"], .mobile-close')
          ?.focus(),
      0,
    );
  }
  closeMenu() {
    const wasOpen = this.sidebarOpen();
    this.sidebarOpen.set(false);
    if (wasOpen) (this.menuTrigger ?? this.menuButton()?.nativeElement)?.focus();
  }
}
