import { Injectable, inject } from '@angular/core';
import { CanActivateFn, CanDeactivateFn, Router } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class PendingPermissionsGuard {
  private hasChanges: (() => boolean) | null = null;

  watch(hasChanges: () => boolean) {
    this.hasChanges = hasChanges;
    return () => {
      if (this.hasChanges === hasChanges) this.hasChanges = null;
    };
  }

  confirmLeave() {
    return (
      !this.hasChanges?.() ||
      window.confirm('Tienes cambios sin guardar. ¿Quieres salir y descartarlos?')
    );
  }
}

export const confirmLeavingPage: CanDeactivateFn<unknown> = () =>
  inject(PendingPermissionsGuard).confirmLeave();

export const confirmChangingSelection: CanActivateFn = (_route, nextState) => {
  const router = inject(Router);
  const current = router.parseUrl(router.url).queryParams;
  const next = router.parseUrl(nextState.url).queryParams;
  const selectionChanged = ['system', 'roleCode', 'step'].some(
    (key) => current[key] !== next[key],
  );
  return !selectionChanged || inject(PendingPermissionsGuard).confirmLeave();
};
