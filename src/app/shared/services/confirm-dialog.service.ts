import { isPlatformBrowser } from '@angular/common';
import { Dialog } from '@angular/cdk/dialog';
import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { Observable, map, of } from 'rxjs';
import { ConfirmDialog, ConfirmDialogOptions } from '../components/confirm-dialog/confirm-dialog';

let nextId = 0;

@Injectable({ providedIn: 'root' })
export class ConfirmDialogService {
  private readonly dialog = inject(Dialog);
  private readonly platformId = inject(PLATFORM_ID);

  /** Opens immediately; only an explicit confirmation emits true. */
  confirm(options: ConfirmDialogOptions): Observable<boolean> {
    if (!isPlatformBrowser(this.platformId)) return of(false);

    const id = `app-confirm-dialog-${nextId++}`;
    const ref = this.dialog.open<boolean, ConfirmDialogOptions, ConfirmDialog>(ConfirmDialog, {
      id,
      data: { ...options },
      width: '28rem',
      maxWidth: 'calc(100vw - 2rem)',
      role: 'alertdialog',
      ariaModal: true,
      ariaLabelledBy: `${id}-title`,
      ariaDescribedBy: `${id}-message`,
      autoFocus: '[data-confirm-cancel]',
      restoreFocus: true,
      hasBackdrop: true,
      disableClose: false,
      closeOnNavigation: true,
    });

    return ref.closed.pipe(map((result) => result === true));
  }
}
