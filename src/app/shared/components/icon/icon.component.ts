import { Component, input } from '@angular/core';

@Component({
  selector: 'app-icon',
  templateUrl: './icon.component.html',
  styleUrl: './icon.component.css',
})
export class IconComponent {
  name = input('overview');
  paths: Record<string, string> = {
    settings: 'M4 7h16 M4 17h16 M8 4v6 M16 14v6',
    chat: 'M4 4h16v12H9l-5 4z M8 8h8 M8 12h5',
    flag: 'M5 21V3 M5 3h14l-3 5 3 5H5',
    sun: 'M12 8a4 4 0 1 1 0 8 4 4 0 0 1 0-8 M12 1v3 M12 20v3 M1 12h3 M20 12h3 M4 4l2 2 M18 18l2 2 M4 20l2-2 M18 6l2-2',
    moon: 'M20 15A9 9 0 0 1 9 4a9 9 0 1 0 11 11',
    overview: 'M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z',
    bank: 'M3 7h18v13H3z M3 7V4h15v3 M16 12h5v4h-5z',
    transactions: 'M4 7h15 M15 3l4 4-4 4 M20 17H5 M9 13l-4 4 4 4',
    bets: 'M4 3h16v18l-4-2-4 2-4-2-4 2z M8 8h8 M8 12h5',
    confirmations: 'M9 3h6l1 2h4v16H4V5h4z M8 13l3 3 5-6',
    logout: 'M9 4H4v16h5 M10 12h11 M17 8l4 4-4 4',
    arrow: 'M5 12h14 M13 6l6 6-6 6',
    trend: 'M3 17l6-6 4 4 8-10 M15 5h6v6',
    clock: 'M12 8v5l3 2 M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0',
    check: 'M5 12l4 4L19 6',
    plus: 'M12 5v14 M5 12h14',
    eye: 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0',
    menu: 'M4 6h16 M4 12h16 M4 18h16',
    close: 'M6 6l12 12 M6 18L18 6',
  };
}
