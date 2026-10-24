import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { QueryClient, provideTanStackQuery } from '@tanstack/angular-query-experimental';
import { ProductoApi } from '../../../../../api/inventario/product-api';
import { VarianteApi } from '../../../../../api/inventario/variante-api';
import type { VarianteResponse } from '../../../../../api/interfaces/inventario/variante.interface';
import { ToastService } from '../../../../../shared/services/toast/toast.service';
import { VarianteCard } from './variante-card';

describe('VarianteCard', () => {
  const variant: VarianteResponse = {
    id: 'v1', productoId: 'p1', sku: 'SKU-1', precio: '10.00', codigoBarras: '123', activo: true,
    valores: [{ atributoId: 'a1', valor: 'Negro' }], imagenes: [],
  };
  const productImage = { id: 'producto-as1', imagenId: 'img-producto', orden: 0, esPrincipal: true };
  const ownImage = { id: 'variante-as1', imagenId: 'img-variante', orden: 0, esPrincipal: true };
  const listImages = vi.fn();
  const getVariantImage = vi.fn();
  const getProductImage = vi.fn();
  const update = vi.fn();
  let client: QueryClient;
  let originalCreate: typeof URL.createObjectURL;
  let originalRevoke: typeof URL.revokeObjectURL;

  beforeEach(() => {
    vi.resetAllMocks();
    originalCreate = URL.createObjectURL;
    originalRevoke = URL.revokeObjectURL;
    Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: vi.fn(() => 'blob:foto') });
    Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: vi.fn() });
    listImages.mockResolvedValue([]);
    getVariantImage.mockResolvedValue(new Blob(['foto']));
    getProductImage.mockResolvedValue(new Blob(['foto']));
    client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    TestBed.configureTestingModule({ providers: [
      provideTanStackQuery(client),
      { provide: VarianteApi, useValue: { listImages, getImage: getVariantImage, update } },
      { provide: ProductoApi, useValue: { getImage: getProductImage } },
      { provide: ToastService, useValue: { success: vi.fn() } },
    ] });
  });

  afterEach(() => {
    client.clear();
    TestBed.resetTestingModule();
    if (originalCreate) Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: originalCreate });
    else delete (URL as unknown as Record<string, unknown>)['createObjectURL'];
    if (originalRevoke) Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: originalRevoke });
    else delete (URL as unknown as Record<string, unknown>)['revokeObjectURL'];
  });

  function setup(data: VarianteResponse = variant, canEdit = false) {
    const fixture = TestBed.createComponent(VarianteCard);
    fixture.componentRef.setInput('productId', 'p1');
    fixture.componentRef.setInput('variant', data);
    fixture.componentRef.setInput('productImages', [productImage]);
    fixture.componentRef.setInput('attributes', [{ atributoId: 'a1', atributo: 'Color', productoId: 'p1' }]);
    fixture.componentRef.setInput('canEdit', canEdit);
    fixture.detectChanges();
    return fixture;
  }

  it('muestra SKU y atributos no editables sin habilitar escritura en solo lectura', async () => {
    const fixture = setup();
    await vi.waitFor(() => expect(fixture.componentInstance.galleryQuery.isSuccess()).toBe(true));
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('SKU-1');
    expect(fixture.nativeElement.textContent).toContain('Color');
    expect(fixture.nativeElement.textContent).toContain('Negro');
    expect((fixture.nativeElement.querySelector('input[type=text]') as HTMLInputElement).matches(':disabled')).toBe(true);
    expect(fixture.nativeElement.querySelector('button[type=submit]')).toBeNull();
    fixture.componentInstance.setPrice({ target: { value: '20.00' } } as unknown as Event);
    await fixture.componentInstance.save(new Event('submit'));
    expect(update).not.toHaveBeenCalled();
  });

  it('etiqueta la galería heredada sin ofrecer quitarla; foto propia la reemplaza', async () => {
    listImages.mockResolvedValue([{ ...productImage, origen: 'producto' }]);
    const fixture = setup(variant, true);
    await vi.waitFor(() => expect(fixture.componentInstance.galleryQuery.isSuccess()).toBe(true));
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Heredada');
    expect(fixture.nativeElement.querySelector('button[aria-label^="Quitar foto propia"]')).toBeNull();
    fixture.componentInstance.removeSavedImage(productImage.id);
    expect(fixture.componentInstance.removedIds()).toEqual([]);

    const image = new File(['nueva'], 'nueva.png', { type: 'image/png' });
    const input = document.createElement('input');
    Object.defineProperty(input, 'files', { value: [image] });
    fixture.componentInstance.addImages({ target: input } as unknown as Event);
    expect(fixture.componentInstance.shownImages()).toEqual([]);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).not.toContain('Heredada');
    fixture.componentInstance.removeNewImage(0);
    expect(fixture.componentInstance.shownImages()[0].origen).toBe('producto');
  });

  it('al quitar la última foto propia vuelve a mostrar las heredadas y conserva solo IDs propios', async () => {
    listImages.mockResolvedValue([{ ...ownImage, origen: 'variante' }]);
    update.mockResolvedValue({ ...variant, imagenes: [], precio: '20.00' });
    const fixture = setup({ ...variant, imagenes: [ownImage] }, true);
    fixture.componentInstance.removeSavedImage(ownImage.id);
    expect(fixture.componentInstance.shownImages()[0]).toMatchObject({
      id: productImage.id, origen: 'producto',
    });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('button[aria-label^="Quitar foto propia"]')).toBeNull();
    await fixture.componentInstance.save(new Event('submit'));
    expect(update).toHaveBeenCalledWith('p1', 'v1', expect.objectContaining({
      imagenesConservarIds: [], imagenes: [], precio: '10.00', codigoBarras: '123', activo: true,
    }));
  });

  it('envía precio, código anulable, estado y fotos juntos; conserva el borrador si falla', async () => {
    listImages.mockResolvedValue([{ ...ownImage, origen: 'variante' }]);
    const fixture = setup({ ...variant, imagenes: [ownImage] }, true);
    const card = fixture.componentInstance;
    card.setPrice({ target: { value: '25.00' } } as unknown as Event);
    card.setBarcode({ target: { value: '' } } as unknown as Event);
    card.setActive({ target: { checked: false } } as unknown as Event);
    card.setValue('a1', { target: { value: 'Azul' } } as unknown as Event);
    const file = new File(['foto'], 'foto.png', { type: 'image/png' });
    const input = document.createElement('input');
    Object.defineProperty(input, 'files', { value: [file] });
    card.addImages({ target: input } as unknown as Event);
    update.mockRejectedValue(new HttpErrorResponse({ status: 409, error: { message: 'SKU no disponible' } }));

    await card.save(new Event('submit'));
    await vi.waitFor(() => expect(card.updateMutation.isError()).toBe(true));
    expect(update).toHaveBeenCalledWith('p1', 'v1', {
      precio: '25.00', codigoBarras: null, activo: false,
      valores: [{ atributoId: 'a1', valor: 'Azul' }],
      imagenesConservarIds: [ownImage.id], imagenes: [file],
    });
    expect(card.dirty()).toBe(true);
    expect(card.newImages()).toHaveLength(1);
    expect(card.model().valores['a1']).toBe('Azul');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('SKU no disponible');
  });

  it('edita un atributo sin modificar el SKU y limpia el borrador tras guardar', async () => {
    update.mockResolvedValue({ ...variant, valores: [{ atributoId: 'a1', valor: 'Azul' }] });
    const fixture = setup(variant, true);
    const input = fixture.nativeElement.querySelector('input[id^="value-"]') as HTMLInputElement;
    expect(input.value).toBe('Negro');
    input.value = ' Azul ';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(fixture.componentInstance.dirty()).toBe(true);
    await fixture.componentInstance.save(new Event('submit'));
    expect(update).toHaveBeenCalledWith('p1', 'v1', expect.objectContaining({
      valores: [{ atributoId: 'a1', valor: 'Azul' }],
    }));
    fixture.componentRef.setInput('variant', { ...variant, valores: [{ atributoId: 'a1', valor: 'Azul' }] });
    fixture.detectChanges();
    expect(fixture.componentInstance.dirty()).toBe(false);
    expect(fixture.componentInstance.model().valores['a1']).toBe('Azul');
  });

  it('impide guardar valores vacíos o de más de 150 caracteres', async () => {
    const fixture = setup(variant, true);
    const card = fixture.componentInstance;
    for (const invalid of ['   ', 'x'.repeat(151)]) {
      card.setValue('a1', { target: { value: invalid } } as unknown as Event);
      fixture.detectChanges();
      expect(card.valuesError()).toBe(true);
      expect((fixture.nativeElement.querySelector('button[type=submit]') as HTMLButtonElement).disabled).toBe(true);
      await card.save(new Event('submit'));
    }
    expect(update).not.toHaveBeenCalled();
  });

  it('no admite más de diez fotos propias', () => {
    const ten = Array.from({ length: 10 }, (_, i) => ({ ...ownImage, id: `as${i}` }));
    const fixture = setup({ ...variant, imagenes: ten }, true);
    const file = new File(['foto'], 'foto.png', { type: 'image/png' });
    const input = document.createElement('input');
    Object.defineProperty(input, 'files', { value: [file] });
    fixture.componentInstance.addImages({ target: input } as unknown as Event);
    expect(fixture.componentInstance.newImages()).toHaveLength(0);
    expect(fixture.componentInstance.imageError()).toContain('10 imágenes');
  });
});
