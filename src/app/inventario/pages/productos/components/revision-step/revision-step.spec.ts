import { TestBed } from '@angular/core/testing';
import { QueryClient, provideTanStackQuery } from '@tanstack/angular-query-experimental';
import { ProductoApi } from '../../../../../api/inventario/product-api';
import { VarianteApi } from '../../../../../api/inventario/variante-api';
import { ToastService } from '../../../../../shared/services/toast/toast.service';
import { productoAtributosQueryKey } from '../../../../actions/use-producto-atributos-action';
import { variantesQueryKey } from '../../../../actions/use-variante-action';
import { RevisionStep } from './revision-step';

describe('RevisionStep', () => {
  it('reutiliza las variantes y atributos en caché al mostrar la revisión', () => {
    const client = new QueryClient();
    client.setQueryData(productoAtributosQueryKey('p1'), [
      { atributoId: 'a1', atributo: 'Color', productoId: 'p1' },
    ]);
    client.setQueryData(variantesQueryKey('p1'), [
      {
        id: 'v1',
        sku: 'SKU-1',
        precio: '10.00',
        codigoBarras: null,
        valores: [{ atributoId: 'a1', valor: 'Negro' }],
        imagenes: [],
      },
    ]);
    const listAttributes = vi.fn();
    const list = vi.fn();
    TestBed.configureTestingModule({
      providers: [
        provideTanStackQuery(client),
        { provide: ProductoApi, useValue: { listAttributes } },
        { provide: VarianteApi, useValue: { list } },
        { provide: ToastService, useValue: { success: vi.fn() } },
      ],
    });
    const fixture = TestBed.createComponent(RevisionStep);
    fixture.componentRef.setInput('product', {
      id: 'p1',
      nombre: 'Martillo',
      descripcion: null,
      activo: true,
      imagenes: [],
      unidadBaseId: 'u1',
    });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('SKU-1');
    expect(fixture.nativeElement.textContent).toContain('Color: Negro');
    expect(listAttributes).not.toHaveBeenCalled();
    expect(list).not.toHaveBeenCalled();
  });
});
