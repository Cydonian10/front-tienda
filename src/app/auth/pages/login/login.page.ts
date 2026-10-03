import { Component, signal } from '@angular/core';
import { Icon } from '../../../shared/components/icon/icon';
import { ThemeToggle } from '../../../shared/components/theme-toggle/theme-toggle';

@Component({
  imports: [Icon, ThemeToggle],
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrl: './login.page.css',
  host: { class: 'block' },
})
export default class LoginPage {
  readonly passwordVisible = signal(false);
}
