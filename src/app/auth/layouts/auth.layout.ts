import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  imports: [RouterOutlet],
  selector: 'app-auth',
  template: `
    <h1>Auth Layout</h1>
    <router-outlet />
  `,
  host: { class: 'block' },
})
export class AuthLayout {}
