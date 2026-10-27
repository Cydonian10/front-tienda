import { TestBed } from '@angular/core/testing';
import { QueryClient, provideTanStackQuery } from '@tanstack/angular-query-experimental';
import { ExistenciaApi } from '../../../../api/inventario/existencia-api';
import { PERMISSION_CODES } from '../../../../api/interfaces/access-control/permision.interface';
import type { ExistenciaItem } from '../../../../api/interfaces/inventario/existencia.interface';
import { AuthStore } from '../../../../store/auth/auth.store';
import { EditarMinimoDialog } from './editar-minimo-dialog';
import { ExistenciaMinimo } from './existencia-minimo';

describe('mínimo en la fila de Existencias', () => {
  const guardarMinimo = vi.fn();
  const quitarMinimo = vi.fn();
  const fila: ExistenciaItem = {
    producto: { id: 'p1', nombre: 'Tornillo', marca: { id: 'm1', nombre: 'Marca' }, activo: true, unidadBase: { id: 'u1', nombre: 'Unidad', simbolo: 'u' } },
    variante: { id: 'v1', sku: 'TOR-M8', activo: true, precioVenta: '1.000000', valores: [] },
    almacen: { id: 'a1', nombre: 'Principal' },
    cantidadBase: '0.000000', minimoBase: null, valorCosto: '0.000000', costoPromedioBase: null,
    costoRegistradoCero: false, unidadesSecundarias: [],
  };

  beforeEach(() => {
    vi.resetAllMocks();
    guardarMinimo.mockResolvedValue(undefined);
    quitarMinimo.mockResolvedValue(undefined);
    TestBed.configureTestingModule({ providers: [
      provideTanStackQuery(new QueryClient({ defaultOptions: { queries: { retry: false } } })),
      { provide: ExistenciaApi, useValue: { guardarMinimo, quitarMinimo } },
    ] });
  });
  afterEach(() => TestBed.resetTestingModule());

  function grant(...codes: string[]) {
    TestBed.inject(AuthStore).setProfile({ isSuperAdmin: false, permissions: codes.map((code) => ({ code, systemCode: 'INVENTARIO' })) } as never);
  }
  function createRow(item = fila) {
    const fixture = TestBed.createComponent(ExistenciaMinimo);
    fixture.componentRef.setInput('fila', item);
    fixture.detectChanges();
    return fixture;
  }
  function createDialog(item = fila) {
    const fixture = TestBed.createComponent(EditarMinimoDialog);
    fixture.componentRef.setInput('fila', item);
    fixture.detectChanges();
    return fixture;
  }

  it('muestra ausencia de mínimo incluso sin saldo y no expone edición sin permiso', () => {
    grant(PERMISSION_CODES.EXISTENCIAS_READ);
    const fixture = createRow();
    const requested = vi.fn();
    fixture.componentInstance.editRequested.subscribe(requested);
    expect(fixture.nativeElement.textContent).toContain('Sin mínimo configurado');
    expect(fixture.nativeElement.querySelector('button')).toBeNull();
    fixture.componentInstance.abrir();
    expect(requested).not.toHaveBeenCalled();
  });

  it('formatea ceros y pide editar el mínimo de la fila correcta', () => {
    grant(PERMISSION_CODES.EXISTENCIAS_EDIT_MINIMUM);
    const item = { ...fila, minimoBase: '3.000000' };
    const fixture = createRow(item);
    const requested = vi.fn();
    fixture.componentInstance.editRequested.subscribe(requested);
    expect(fixture.nativeElement.textContent).toContain('Mínimo: 3 u');
    fixture.nativeElement.querySelector('button').click();
    expect(requested).toHaveBeenCalledWith(item);
  });

  it('abre un diálogo contextual sin ceros sobrantes y conserva los decimales significativos', () => {
    grant(PERMISSION_CODES.EXISTENCIAS_EDIT_MINIMUM);
    const fixture = createDialog({ ...fila, minimoBase: '3.000000', cantidadBase: '2.500000' });
    const dialog = fixture.nativeElement.querySelector('dialog') as HTMLDialogElement;
    expect(dialog.getAttribute('aria-labelledby')).toBe(fixture.componentInstance.inputId() + '-title');
    expect(dialog.textContent).toContain('Tornillo');
    expect(dialog.textContent).toContain('Principal');
    expect(dialog.textContent).toContain('2.5 u');
    expect((dialog.querySelector('input') as HTMLInputElement).value).toBe('3');
  });

  it('valida en cliente, envía cadenas decimales y cierra al guardar', async () => {
    grant(PERMISSION_CODES.EXISTENCIAS_EDIT_MINIMUM);
    const fixture = createDialog();
    const closed = vi.fn();
    fixture.componentInstance.closed.subscribe(closed);
    fixture.componentInstance.draft.set('0');
    await fixture.componentInstance.guardar(new Event('submit'));
    expect(guardarMinimo).not.toHaveBeenCalled();
    expect(fixture.componentInstance.error()).toContain('positivo');
    fixture.componentInstance.draft.set('0.000001');
    await fixture.componentInstance.guardar(new Event('submit'));
    expect(guardarMinimo).toHaveBeenCalledExactlyOnceWith('v1', 'a1', '0.000001');
    expect(closed).toHaveBeenCalledOnce();
  });

  it('pide confirmación al borrar y vuelve a comprobar permiso antes de ejecutar', async () => {
    grant(PERMISSION_CODES.EXISTENCIAS_EDIT_MINIMUM);
    const fixture = createDialog({ ...fila, minimoBase: '3.000000' });
    const closed = vi.fn();
    fixture.componentInstance.closed.subscribe(closed);
    await fixture.componentInstance.quitar();
    expect(quitarMinimo).not.toHaveBeenCalled();
    fixture.componentInstance.confirming.set(true);
    grant(PERMISSION_CODES.EXISTENCIAS_READ);
    await fixture.componentInstance.quitar();
    expect(quitarMinimo).not.toHaveBeenCalled();
    grant(PERMISSION_CODES.EXISTENCIAS_EDIT_MINIMUM);
    await fixture.componentInstance.quitar();
    expect(quitarMinimo).toHaveBeenCalledExactlyOnceWith('v1', 'a1');
    expect(closed).toHaveBeenCalledOnce();
  });

  it('mantiene el formulario abierto ante 403 y muestra error sin borrar datos', async () => {
    grant(PERMISSION_CODES.EXISTENCIAS_EDIT_MINIMUM);
    guardarMinimo.mockRejectedValue({ status: 403 });
    const fixture = createDialog();
    const closed = vi.fn();
    fixture.componentInstance.closed.subscribe(closed);
    fixture.componentInstance.draft.set('2.5');
    await fixture.componentInstance.guardar(new Event('submit'));
    expect(closed).not.toHaveBeenCalled();
    expect(fixture.componentInstance.error()).toContain('permiso');
    expect(fixture.componentInstance.draft()).toBe('2.5');
  });
});
