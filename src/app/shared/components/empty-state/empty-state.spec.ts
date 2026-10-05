import { TestBed } from '@angular/core/testing';
import { EmptyState } from './empty-state';

describe('EmptyState', () => {
  afterEach(() => TestBed.resetTestingModule());

  it.each(['empty', 'no-results', 'error'] as const)('provides defaults for %s without a dead action', (variant) => {
    const fixture = TestBed.createComponent(EmptyState);
    fixture.componentRef.setInput('variant', variant);
    fixture.detectChanges();
    const section = fixture.nativeElement.querySelector('section') as HTMLElement;
    const title = fixture.nativeElement.querySelector('h3') as HTMLElement;
    expect(title.textContent?.trim()).toBe(fixture.componentInstance.resolvedTitle());
    expect(section.getAttribute('aria-labelledby')).toBe(title.id);
    expect(section.getAttribute('aria-describedby')).toBe(fixture.nativeElement.querySelector('p').id);
    expect(fixture.nativeElement.querySelector('button')).toBeNull();
    expect(fixture.nativeElement.querySelector('[role=alert]')).toBeNull();
  });

  it('reacts to variant changes and preserves custom text', () => {
    const fixture = TestBed.createComponent(EmptyState);
    fixture.detectChanges();
    fixture.componentRef.setInput('variant', 'error');
    fixture.detectChanges();
    expect(fixture.componentInstance.resolvedIcon()).toBe('error');
    fixture.componentRef.setInput('title', 'Sin proveedores');
    fixture.componentRef.setInput('description', 'Agrega tu primer proveedor.');
    fixture.componentRef.setInput('icon', 'users');
    fixture.detectChanges();
    expect(fixture.componentInstance.resolvedTitle()).toBe('Sin proveedores');
    expect(fixture.componentInstance.resolvedDescription()).toBe('Agrega tu primer proveedor.');
    expect(fixture.componentInstance.resolvedIcon()).toBe('users');
  });

  it('emits only enabled actions and uses a mobile-friendly button', () => {
    const fixture = TestBed.createComponent(EmptyState);
    fixture.componentRef.setInput('actionLabel', 'Agregar proveedor');
    const action = vi.fn();
    fixture.componentInstance.action.subscribe(action);
    fixture.detectChanges();
    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    expect(button.classList.contains('w-full')).toBe(true);
    button.click();
    expect(action).toHaveBeenCalledOnce();
    fixture.componentRef.setInput('actionDisabled', true);
    fixture.detectChanges();
    button.click();
    fixture.componentInstance.onAction();
    expect(action).toHaveBeenCalledOnce();
  });

  it('hides blank actions and descriptions, supports compact mode and does not interpret HTML', () => {
    const fixture = TestBed.createComponent(EmptyState);
    fixture.componentRef.setInput('title', '<img src=x>');
    fixture.componentRef.setInput('description', '');
    fixture.componentRef.setInput('actionLabel', '   ');
    fixture.componentRef.setInput('compact', true);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('h3').textContent).toContain('<img src=x>');
    expect(fixture.nativeElement.querySelector('img, p, button')).toBeNull();
    expect(fixture.nativeElement.querySelector('section').hasAttribute('aria-describedby')).toBe(false);
    expect(fixture.nativeElement.querySelector('section').classList.contains('py-6')).toBe(true);
  });
});
