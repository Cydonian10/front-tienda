import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  imports: [RouterOutlet],
  selector: 'app-adminlayout',
  template: `
    <h1>Admin layout</h1>
    <router-outlet />
  `,
  host: { class: 'block' },
})
export class AdminLayout {}
