import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import ProductoPruebaPage from './producto-prueba-page';

describe('ProductoPruebaPage', () => {
  it('keeps the sample creation flow navigable', () => {
    const fixture = TestBed.createComponent(ProductoPruebaPage);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Producto prueba · vista de demostración');
    fixture.componentInstance.goToStep(3);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('CAM-NEG-M');
    expect(fixture.nativeElement.textContent).toContain('1 Caja = 12 u');
  });

  it('shows the existing product without affecting the creation flow', () => {
    const fixture = TestBed.createComponent(ProductoPruebaPage);
    fixture.componentInstance.showManage();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Variantes actuales');
    fixture.componentInstance.showCreate();
    expect(fixture.componentInstance.step()).toBe(0);
  });
});
