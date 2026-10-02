import { Component } from '@angular/core';

@Component({
  imports: [],
  selector: 'app-admin-footer',
  template: `
    <footer
      class="footer items-center border-t border-base-300 bg-base-100 px-4 py-4 text-xs text-base-content/55 sm:px-6 lg:px-8"
    >
      <p>Ferretería · Panel operativo</p>
      <p class="sm:justify-self-end">
        <span class="status status-success mr-2"></span>Sistema operativo
      </p>
    </footer>
  `,
  host: { class: 'block' },
})
export class AdminFooterPage {}
