import { TestBed } from '@angular/core/testing';
import { ToastContainer } from './toast-container';

describe('ToastContainer', () => {
  beforeEach(() => {
    vi.spyOn(document, 'hidden', 'get').mockReturnValue(false);
  });

  afterEach(() => {
    TestBed.resetTestingModule();
    vi.restoreAllMocks();
  });

  it('keeps live regions available even when there are no notifications', () => {
    const fixture = TestBed.createComponent(ToastContainer);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[aria-live="polite"]')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('[aria-live="assertive"]')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('section')).toBeNull();
  });

  it('renders semantic icons, separates announcements and closes from the UI', () => {
    const fixture = TestBed.createComponent(ToastContainer);
    fixture.componentInstance.toast.success('Cambios guardados', {
      title: 'Producto actualizado',
      duration: 0,
    });
    fixture.componentInstance.toast.error('Revisa la conexión e intenta nuevamente');
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;
    expect(host.querySelectorAll('article')).toHaveLength(2);
    expect(host.querySelector('[aria-live="polite"]')?.textContent).toContain('Cambios guardados');
    expect(host.querySelector('[aria-live="assertive"]')?.textContent).toContain(
      'Revisa la conexión',
    );
    expect(host.querySelector('.text-success')).not.toBeNull();
    expect(host.querySelector('.text-error')).not.toBeNull();
    (host.querySelector('button') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(host.querySelectorAll('article')).toHaveLength(1);
  });

  it('renders messages as text instead of interpreting markup', () => {
    const fixture = TestBed.createComponent(ToastContainer);
    fixture.componentInstance.toast.info('<img src=x onerror=alert(1)>', { duration: 0 });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('article p').textContent).toContain('<img');
    expect(fixture.nativeElement.querySelector('img')).toBeNull();
  });

  it('returns keyboard focus to the previous control after Escape', () => {
    const fixture = TestBed.createComponent(ToastContainer);
    fixture.componentInstance.toast.info('Información', { duration: 0 });
    fixture.detectChanges();
    const previous = document.createElement('button');
    document.body.appendChild(previous);
    try {
      previous.focus();
      const close = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
      close.focus();
      close.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      fixture.detectChanges();
      expect(document.activeElement).toBe(previous);
      expect(fixture.componentInstance.toast.notifications()).toHaveLength(0);
    } finally {
      previous.remove();
    }
  });
});
