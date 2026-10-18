import { Component } from '@angular/core';
import { ShellComponent } from './layout/shell/shell.component';
@Component({
  selector: 'app-root',
  imports: [ShellComponent],
  templateUrl: './app.html',
  host: { class: 'block' },
})
export class App {}
