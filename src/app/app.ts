import {ChangeDetectionStrategy, Component} from '@angular/core';
import {RouterOutlet} from '@angular/router';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-root',
  imports: [RouterOutlet],
  template: `
    <main class="w-full overflow-x-hidden">
      <router-outlet></router-outlet>
    </main>
  `,
  styles: [`
    :host {
      display: block;
    }
  `],
})
export class App {}
