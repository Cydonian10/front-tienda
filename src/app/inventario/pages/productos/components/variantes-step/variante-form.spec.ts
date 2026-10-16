import { TestBed } from '@angular/core/testing';
import { VarianteForm } from './variante-form';

describe('VarianteForm', () => {
  it('exige un valor por atributo y un precio válido antes de emitir', async () => {
    const fixture = TestBed.createComponent(VarianteForm);
    fixture.componentRef.setInput('attributes', [
      { atributoId: 'a1', atributo: 'Color', productoId: 'p1' },
    ]);
    fixture.detectChanges();
    const emitted = vi.fn();
    fixture.componentInstance.create.subscribe(emitted);
    await fixture.componentInstance.save(new Event('submit'));
    expect(emitted).not.toHaveBeenCalled();
    expect(fixture.componentInstance.variantForm.valores().invalid()).toBe(true);
    expect(fixture.componentInstance.variantForm.valores().touched()).toBe(true);

    fixture.componentInstance.model.set({
      sku: 'S1',
      precio: '19.90',
      codigoBarras: '',
      valores: { a1: 'Negro' },
    });
    fixture.detectChanges();
    await fixture.componentInstance.save(new Event('submit'));
    expect(emitted).toHaveBeenCalledWith({
      sku: 'S1',
      precio: '19.90',
      codigoBarras: undefined,
      valores: [{ atributoId: 'a1', valor: 'Negro' }],
      imagenes: [],
    });
  });

  it('rechaza archivos no válidos antes de guardar la variante', () => {
    const fixture = TestBed.createComponent(VarianteForm);
    fixture.componentRef.setInput('attributes', [
      { atributoId: 'a1', atributo: 'Color', productoId: 'p1' },
    ]);
    fixture.detectChanges();
    const input = document.createElement('input');
    Object.defineProperty(input, 'files', {
      value: [new File(['x'], 'x.txt', { type: 'text/plain' })],
    });
    fixture.componentInstance.addImages({ target: input } as unknown as Event);
    expect(fixture.componentInstance.imageError()).toContain('JPEG');
    expect(fixture.componentInstance.images()).toEqual([]);
  });
});
