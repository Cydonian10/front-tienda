import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import ProductosPage from './productos-page';

describe('ProductosPage', () => {
  it('navigates through all creation steps with example data', async () => {
    const fixture = TestBed.createComponent(ProductosPage);
    fixture.detectChanges();

    const productName = fixture.nativeElement.querySelector(
      '#demo-product-name',
    ) as HTMLInputElement;
    expect(productName.value).toBe('Camiseta básica');
    expect(fixture.componentInstance.step()).toBe(0);

    for (let step = 1; step <= 3; step++) {
      const next = Array.from<HTMLButtonElement>(
        fixture.nativeElement.querySelectorAll('button'),
      ).find((button) => button.textContent?.includes('Siguiente'));
      next?.click();
      fixture.detectChanges();
      expect(fixture.componentInstance.step()).toBe(step);
    }

    expect(fixture.nativeElement.textContent).toContain('CAM-NEG-M');
    expect(fixture.nativeElement.textContent).toContain('1 Caja = 12 u');
    const save = Array.from<HTMLButtonElement>(
      fixture.nativeElement.querySelectorAll('button'),
    ).find((button) => button.textContent?.includes('Guardar producto'));
    expect(save?.disabled).toBe(true);
  });

  it('switches to existing product and resets creation on return', () => {
    const fixture = TestBed.createComponent(ProductosPage);
    fixture.componentInstance.goToStep(2);
    fixture.componentInstance.showManage();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Variantes actuales');
    expect(fixture.nativeElement.textContent).toContain('Sin variantes nuevas');
    fixture.componentInstance.showCreate();
    fixture.detectChanges();
    expect(fixture.componentInstance.step()).toBe(0);
  });
});
