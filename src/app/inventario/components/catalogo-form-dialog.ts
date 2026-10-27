import { DOCUMENT } from '@angular/common';
import { CdkTrapFocus } from '@angular/cdk/a11y';
import { afterNextRender, Component, ElementRef, inject, input, OnDestroy, output, viewChild } from '@angular/core';

@Component({
  selector: 'catalogo-form-dialog',
  imports: [CdkTrapFocus],
  template: `
    <dialog #dialog class="modal" [attr.aria-labelledby]="titleId()" aria-modal="true"
      (cancel)="onEscape($event)" (keydown.escape)="onEscape($event)">
      <div class="modal-box max-h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] max-w-xl overflow-y-auto border border-base-300 bg-base-100 p-0"
        cdkTrapFocus [cdkTrapFocusAutoCapture]="true">
        <ng-content />
      </div>
      <form method="dialog" class="modal-backdrop" (submit)="requestClose($event)">
        <button type="submit" [disabled]="busy()" aria-label="Cerrar formulario">Cerrar formulario</button>
      </form>
    </dialog>
  `,
})
export class CatalogoFormDialog implements OnDestroy {
  readonly titleId = input.required<string>();
  readonly busy = input(false);
  readonly closeRequested = output<void>();
  private readonly document = inject(DOCUMENT);
  private readonly returnFocus = this.document.activeElement;
  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');

  constructor() {
    afterNextRender(() => this.dialog().nativeElement.showModal?.());
  }

  onEscape(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.requestClose();
  }

  requestClose(event?: Event): void {
    event?.preventDefault();
    if (!this.busy()) this.closeRequested.emit();
  }

  ngOnDestroy(): void {
    if (typeof HTMLElement !== 'undefined' && this.returnFocus instanceof HTMLElement && this.returnFocus.isConnected) {
      this.returnFocus.focus();
    }
  }
}
