import { TestBed } from '@angular/core/testing';
import { QueryClient, provideTanStackQuery } from '@tanstack/angular-query-experimental';
import { ProductoApi } from '../../../../../api/inventario/product-api';
import { VarianteApi } from '../../../../../api/inventario/variante-api';
import { ToastService } from '../../../../../shared/services/toast/toast.service';
import { productoAtributosQueryKey } from '../../../../actions/use-producto-atributos-action';
import { variantesQueryKey } from '../../../../actions/use-variante-action';
import { VariantesStep } from './variantes-step';

describe('VariantesStep', () => {
  const attr = { atributoId: 'a1', atributo: 'Color', productoId: 'p1' };
  const variant = {
    id: 'v1',
    productoId: 'p1',
    sku: 'SKU-1',
    precio: '10.00',
    codigoBarras: null,
    activo: true,
    valores: [{ atributoId: 'a1', valor: 'Negro' }],
    imagenes: [],
  };
  const productApi = {
    listAttributes: vi.fn(),
    addAttribute: vi.fn(),
    removeAttribute: vi.fn(),
  };
  const variantApi = { list: vi.fn(), create: vi.fn() };
  let client: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    productApi.listAttributes.mockResolvedValue([attr]);
    variantApi.list.mockResolvedValue([variant]);
    client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    client.setQueryData(productoAtributosQueryKey('p1'), [attr]);
    client.setQueryData(variantesQueryKey('p1'), [variant]);
    TestBed.configureTestingModule({
      providers: [
        provideTanStackQuery(client),
        { provide: ProductoApi, useValue: productApi },
        { provide: VarianteApi, useValue: variantApi },
        { provide: ToastService, useValue: { success: vi.fn() } },
      ],
    });
  });

  it('recupera variantes guardadas y bloquea cambios de atributos al volver al producto', async () => {
    const fixture = TestBed.createComponent(VariantesStep);
    fixture.componentRef.setInput('productId', 'p1');
    fixture.detectChanges();
    fixture.detectChanges();
    expect(fixture.componentInstance.variants()).toEqual([variant]);
    expect(fixture.nativeElement.textContent).toContain('SKU-1');
    expect(fixture.nativeElement.textContent).toContain('No se pueden cambiar aquí');
    await fixture.componentInstance.toggleAttribute(attr);
    expect(productApi.removeAttribute).not.toHaveBeenCalled();
  });

  it('rechaza combinaciones duplicadas sin enviarlas al servidor', async () => {
    const fixture = TestBed.createComponent(VariantesStep);
    fixture.componentRef.setInput('productId', 'p1');
    fixture.detectChanges();
    await fixture.componentInstance.createVariant({
      precio: '12.00',
      valores: [{ atributoId: 'a1', valor: ' negro ' }],
      imagenes: [],
    });
    expect(variantApi.create).not.toHaveBeenCalled();
    expect(fixture.componentInstance.actionError()).toContain('Ya existe');
  });

  it('permite seleccionar atributos existentes antes de crear la primera variante sin ofrecer creación de atributos', async () => {
    productApi.listAttributes.mockResolvedValue([attr]);
    variantApi.list.mockResolvedValue([]);
    client.setQueryData(productoAtributosQueryKey('p1'), [{ ...attr, productoId: null }]);
    client.setQueryData(variantesQueryKey('p1'), []);
    productApi.addAttribute.mockResolvedValue({});
    const fixture = TestBed.createComponent(VariantesStep);
    fixture.componentRef.setInput('productId', 'p1');
    fixture.detectChanges();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Disponibles en el catálogo');
    expect(fixture.nativeElement.textContent).not.toContain('Crear y agregar');
    await fixture.componentInstance.toggleAttribute({ ...attr, productoId: null });
    expect(productApi.addAttribute).toHaveBeenCalledWith('p1', 'a1');
    await vi.waitFor(() => expect(fixture.componentInstance.selectedAttributes()).toEqual([attr]));
  });

  it('invalida la consulta al crear una variante y actualiza la lista compartida', async () => {
    client.setQueryData(variantesQueryKey('p1'), []);
    variantApi.list.mockResolvedValue([variant]);
    variantApi.create.mockResolvedValue(variant);
    const fixture = TestBed.createComponent(VariantesStep);
    fixture.componentRef.setInput('productId', 'p1');
    fixture.detectChanges();

    await fixture.componentInstance.createVariant({
      precio: '10.00',
      valores: [{ atributoId: 'a1', valor: 'Negro' }],
      imagenes: [],
    });
    expect(variantApi.create).toHaveBeenCalledWith(
      'p1',
      expect.objectContaining({ precio: '10.00' }),
    );
    await vi.waitFor(() => expect(client.getQueryData(variantesQueryKey('p1'))).toEqual([variant]));
    expect(fixture.componentInstance.savedVersion()).toBe(1);
  });
});
