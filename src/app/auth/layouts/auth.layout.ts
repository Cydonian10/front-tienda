import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  imports: [RouterOutlet],
  selector: 'app-auth',
  template: `<router-outlet />`,
  host: { class: 'block min-h-dvh' },
})
export class AuthLayout {}
