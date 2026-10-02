import { Component } from '@angular/core';

@Component({
  imports: [],
  selector: 'app-admin-footer',
  template: `
    <footer
      class="footer flex flex-col gap-2 border-t border-base-300 bg-base-100 px-4 py-4 text-xs text-base-content/70 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8 min-h-14"
    >
      <p>Ferretería · Panel operativo</p>
      <p class="flex items-center gap-2">
        <span class="status status-success status-sm" aria-hidden="true"></span>Sistema operativo
      </p>
    </footer>
  `,
  host: { class: 'block' },
})
export class AdminFooterPage {}
