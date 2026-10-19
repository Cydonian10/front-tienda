import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot } from '@angular/router';
import { firstValueFrom, of, type Observable } from 'rxjs';
import { ConfirmDialogService } from '../../../../shared/services/confirm-dialog/confirm-dialog.service';
import {
  confirmChangingProduct,
  confirmLeavingProduct,
  PendingProductChanges,
} from './pending-product-changes.guard';

describe('protección de cambios del producto', () => {
  const confirm = vi.fn();
  const router = {
    url: '/admin/inventario/productos/gestion?productoId=p1',
    parseUrl: (url: string) => ({ queryParams: Object.fromEntries(new URL(url, 'http://localhost').searchParams) }),
  };

  beforeEach(() => {
    vi.resetAllMocks();
    TestBed.configureTestingModule({
      providers: [
        { provide: ConfirmDialogService, useValue: { confirm } },
        { provide: Router, useValue: router },
      ],
    });
  });

  afterEach(() => TestBed.resetTestingModule());

  it('permite salir sin cambios e impide cambiar de producto mientras se guarda', async () => {
    const changes = TestBed.inject(PendingProductChanges);
    let saving = false;
    const stop = changes.watch(() => false, () => saving);
    expect(await firstValueFrom(changes.confirmLeave())).toBe(true);
    saving = true;
    expect(await firstValueFrom(changes.confirmLeave())).toBe(false);
    expect(confirm).not.toHaveBeenCalled();
    stop();
  });

  it('consulta antes de cambiar de producto o salir y cancelar mantiene la ruta', async () => {
    TestBed.inject(PendingProductChanges).watch(() => true, () => false);
    confirm.mockReturnValueOnce(of(false)).mockReturnValueOnce(of(true));
    const nextUrl = '/admin/inventario/productos/gestion?productoId=p2';
    const decision = TestBed.runInInjectionContext(() => confirmChangingProduct(
      {} as ActivatedRouteSnapshot, { url: nextUrl } as RouterStateSnapshot,
    ));
    expect(await firstValueFrom(decision as Observable<boolean>)).toBe(false);
    const exit = TestBed.runInInjectionContext(() => confirmLeavingProduct(
      {} as never, {} as never, {} as never, {} as never,
    ));
    expect(await firstValueFrom(exit as Observable<boolean>)).toBe(true);
    expect(confirm).toHaveBeenCalledTimes(2);
    expect(confirm).toHaveBeenCalledWith(expect.objectContaining({ confirmText: 'Descartar cambios' }));
  });

  it('no pide confirmación si el ID del producto no cambia', () => {
    TestBed.inject(PendingProductChanges).watch(() => true, () => false);
    const decision = TestBed.runInInjectionContext(() => confirmChangingProduct(
      {} as ActivatedRouteSnapshot,
      { url: '/admin/inventario/productos/gestion?productoId=p1&otra=1' } as RouterStateSnapshot,
    ));
    expect(decision).toBe(true);
    expect(confirm).not.toHaveBeenCalled();
  });
});
