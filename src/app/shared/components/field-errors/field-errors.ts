import { Component, input } from '@angular/core';
import { FieldState } from '@angular/forms/signals';

@Component({
  selector: 'app-field-errors',
  template: `
    @if (field().touched() && field().invalid()) {
      <div [id]="errorId()" class="grid gap-1 text-sm leading-snug text-error" role="alert">
        @for (error of field().errors(); track $index) {
          <span>{{ error.message }}</span>
        }
      </div>
    }
  `,
  styles: `
    :host {
      display: contents;
    }
  `,
})
export class FieldErrors {
  readonly field = input.required<Pick<FieldState<string>, 'touched' | 'invalid' | 'errors'>>();
  readonly errorId = input.required<string>();
}
