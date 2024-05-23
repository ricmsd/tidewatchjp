import { Component } from '@angular/core';
import { TideWatchJpComponent } from './tide-watch-jp/tide-watch-jp.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [TideWatchJpComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'tidewatchjp';
}
