import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { QueryClient, provideTanStackQuery } from '@tanstack/angular-query-experimental';
import { UnidadApi } from '../../../../api/inventario/unidad-api';
import { ToastService } from '../../../../shared/services/toast/toast.service';
import { catalogoUnidadesQueryKey } from '../../../actions/use-producto-unidades-action';
import { unidadesQueryKey } from '../../../actions/use-unidad-medida-action';
import { UnidadFormDialog } from './unidad-form-dialog';

describe('UnidadFormDialog', () => {
  const create = vi.fn();
  const update = vi.fn();
  const close = vi.fn();
  const success = vi.fn();
  let client: QueryClient;

  beforeEach(() => {
    vi.resetAllMocks();
    client = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    TestBed.configureTestingModule({
      providers: [
        provideTanStackQuery(client),
        { provide: UnidadApi, useValue: { create, update } },
        { provide: ToastService, useValue: { success } },
        { provide: DialogRef, useValue: { id: 'crear-unidad', close, disableClose: false } },
      ],
    });
  });

  afterEach(() => TestBed.resetTestingModule());

  function render() {
    const fixture = TestBed.createComponent(UnidadFormDialog);
    fixture.detectChanges();
    return fixture;
  }

  it('valida, recorta campos, crea e invalida los catálogos', async () => {
    const fixture = render();
    const dialog = fixture.componentInstance;
    await dialog.save(new Event('submit'));
    expect(create).not.toHaveBeenCalled();

    const invalidate = vi.spyOn(client, 'invalidateQueries');
    create.mockResolvedValue({ id: 'u1', nombre: 'Docena', simbolo: 'doc', tipo: 'conteo' });
    dialog.model.set({ nombre: ' Docena ', simbolo: ' doc ', tipo: ' conteo ' });
    await dialog.save(new Event('submit'));

    expect(create).toHaveBeenCalledWith({ nombre: 'Docena', simbolo: 'doc', tipo: 'conteo' });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: unidadesQueryKey });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: catalogoUnidadesQueryKey });
    expect(success).toHaveBeenCalledWith('Unidad creada correctamente.');
    expect(close).toHaveBeenCalledWith('u1');
    fixture.destroy();
  });

  it('muestra el conflicto y permite corregir el nombre sin cerrar el modal', async () => {
    const fixture = render();
    const dialog = fixture.componentInstance;
    dialog.model.set({ nombre: 'Caja', simbolo: 'cja', tipo: 'empaque' });
    create.mockRejectedValue(new HttpErrorResponse({ status: 409 }));
    await dialog.save(new Event('submit'));

    expect(dialog.serverError()).toContain('Ya existe una unidad');
    expect(dialog.model().nombre).toBe('Caja');
    expect(close).not.toHaveBeenCalled();
    expect(dialog.dialogRef.disableClose).toBe(false);
    fixture.destroy();
  });

  it('precarga los valores y actualiza la unidad sin crear otra', async () => {
    const unidad = { id: 'u2', nombre: 'Caja', simbolo: 'cja', tipo: 'empaque' };
    TestBed.overrideProvider(DIALOG_DATA, { useValue: unidad });
    const fixture = render();
    const dialog = fixture.componentInstance;
    expect(dialog.model()).toEqual({ nombre: 'Caja', simbolo: 'cja', tipo: 'empaque' });
    update.mockResolvedValue({ ...unidad, simbolo: 'caja' });
    dialog.model.set({ nombre: 'Caja', simbolo: 'caja', tipo: 'empaque' });
    await dialog.save(new Event('submit'));

    expect(update).toHaveBeenCalledWith('u2', { nombre: 'Caja', simbolo: 'caja', tipo: 'empaque' });
    expect(create).not.toHaveBeenCalled();
    expect(success).toHaveBeenCalledWith('Unidad actualizada correctamente.');
    expect(close).toHaveBeenCalledWith('u2');
    fixture.destroy();
  });
});
