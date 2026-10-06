import { Component, input } from '@angular/core';

@Component({
  selector: 'app-dialog-shell',
  template: `
    <section
      class="flex max-h-[calc(100dvh-2rem)] flex-col overflow-hidden rounded-box border border-base-300 bg-base-100 text-base-content"
    >
      <header class="shrink-0 border-b border-base-300 px-5 py-4 sm:px-6">
        <h2 [id]="titleId()" class="text-lg font-semibold">{{ title() }}</h2>
      </header>

      <div class="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">
        <ng-content />
      </div>

      <footer
        class="flex shrink-0 flex-col gap-3 border-t border-base-300 px-5 py-4 sm:flex-row sm:justify-end sm:px-6"
      >
        <ng-content select="[dialog-actions]" />
      </footer>
    </section>
  `,
  host: { class: 'block min-w-0' },
})
export class DialogShell {
  readonly title = input.required<string>();
  readonly titleId = input.required<string>();
}
