import { inject, Injectable } from '@angular/core';
import { CanActivateFn, CanDeactivateFn, Router } from '@angular/router';
import { of } from 'rxjs';
import { ConfirmDialogService } from '../../../../shared/services/confirm-dialog/confirm-dialog.service';

@Injectable({ providedIn: 'root' })
export class PendingProductChanges {
  private changes: (() => boolean) | null = null;
  private saving: (() => boolean) | null = null;
  private readonly confirmation = inject(ConfirmDialogService);

  watch(changes: () => boolean, saving: () => boolean): () => void {
    this.changes = changes;
    this.saving = saving;
    return () => {
      if (this.changes === changes) {
        this.changes = null;
        this.saving = null;
      }
    };
  }

  confirmLeave() {
    if (this.saving?.()) return of(false);
    if (!this.changes?.()) return of(true);
    return this.confirmation.confirm({
      title: 'Descartar cambios',
      message: 'Tienes cambios sin guardar. ¿Quieres descartarlos?',
      confirmText: 'Descartar cambios',
      cancelText: 'Seguir editando',
      tone: 'danger',
    });
  }
}

export const confirmLeavingProduct: CanDeactivateFn<unknown> = (_, __, currentState, nextState) => {
  if (nextState && currentState.url.split('?')[0] === nextState.url.split('?')[0]) return true;
  return inject(PendingProductChanges).confirmLeave();
};

export const confirmChangingProduct: CanActivateFn = (_, nextState) => {
  const router = inject(Router);
  if (router.url.split('?')[0] !== nextState.url.split('?')[0]) return true;
  const current = router.parseUrl(router.url).queryParams['productoId'];
  const next = router.parseUrl(nextState.url).queryParams['productoId'];
  return current === next || inject(PendingProductChanges).confirmLeave();
};
