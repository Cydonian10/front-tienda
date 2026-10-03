import { Component, signal } from '@angular/core';
import { Icon } from '../../../shared/components/icon/icon';

@Component({
  imports: [Icon],
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrl: './login.page.css',
  host: { class: 'block' },
})
export default class LoginPage {
  readonly passwordVisible = signal(false);
}
