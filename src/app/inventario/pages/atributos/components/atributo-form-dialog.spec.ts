import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { QueryClient, provideTanStackQuery } from '@tanstack/angular-query-experimental';
import { AtributoApi } from '../../../../api/inventario/atributo-api';
import { ToastService } from '../../../../shared/services/toast/toast.service';
import { atributosQueryKey } from '../../../actions/use-atributos-action';
import { AtributoFormDialog } from './atributo-form-dialog';

describe('AtributoFormDialog', () => {
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
        { provide: AtributoApi, useValue: { create, update } },
        { provide: ToastService, useValue: { success } },
        { provide: DialogRef, useValue: { id: 'crear-atributo', close, disableClose: false } },
      ],
    });
  });
  afterEach(() => TestBed.resetTestingModule());

  it('valida, recorta y crea el atributo', async () => {
    const fixture = TestBed.createComponent(AtributoFormDialog);
    fixture.detectChanges();
    const dialog = fixture.componentInstance;
    await dialog.save(new Event('submit'));
    expect(create).not.toHaveBeenCalled();
    const invalidate = vi.spyOn(client, 'invalidateQueries');
    create.mockResolvedValue({ id: 'a1', nombre: 'Color' });
    dialog.model.set({ nombre: ' Color ' });
    await dialog.save(new Event('submit'));
    expect(create).toHaveBeenCalledWith({ nombre: 'Color' });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: atributosQueryKey });
    expect(success).toHaveBeenCalledWith('Atributo creado correctamente.');
    expect(close).toHaveBeenCalledWith('a1');
    fixture.destroy();
  });

  it('mantiene el formulario abierto ante nombres duplicados', async () => {
    const fixture = TestBed.createComponent(AtributoFormDialog);
    const dialog = fixture.componentInstance;
    dialog.model.set({ nombre: 'Color' });
    create.mockRejectedValue(new HttpErrorResponse({ status: 409 }));
    await dialog.save(new Event('submit'));
    expect(dialog.serverError()).toContain('Ya existe un atributo');
    expect(close).not.toHaveBeenCalled();
    expect(dialog.dialogRef.disableClose).toBe(false);
    fixture.destroy();
  });

  it('precarga y actualiza el nombre existente', async () => {
    TestBed.overrideProvider(DIALOG_DATA, {
      useValue: { id: 'a1', nombre: 'Color', usoProductos: 1 },
    });
    const fixture = TestBed.createComponent(AtributoFormDialog);
    const dialog = fixture.componentInstance;
    expect(dialog.model().nombre).toBe('Color');
    update.mockResolvedValue({ id: 'a1', nombre: 'Tono' });
    dialog.model.set({ nombre: ' Tono ' });
    await dialog.save(new Event('submit'));
    expect(update).toHaveBeenCalledWith('a1', { nombre: 'Tono' });
    expect(close).toHaveBeenCalledWith('a1');
    fixture.destroy();
  });
});
