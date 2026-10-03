import { TestBed } from '@angular/core/testing';
import LoginPage from './login.page';

describe('LoginPage', () => {
  afterEach(() => TestBed.resetTestingModule());

  function setup() {
    const fixture = TestBed.createComponent(LoginPage);
    fixture.detectChanges();
    return { fixture, element: fixture.nativeElement as HTMLElement };
  }

  it('renders the visual login fields and unavailable authentication actions', () => {
    const { element } = setup();

    expect(element.querySelector('input[type="email"]')).toBeTruthy();
    expect(element.querySelector('input[type="password"]')).toBeTruthy();
    expect(element.querySelectorAll('button:disabled')).toHaveLength(3);
    expect(element.textContent).toContain('Acceso de demostración');
  });

  it('toggles password visibility accessibly', () => {
    const { fixture, element } = setup();
    const input = element.querySelector('input[name="password"]') as HTMLInputElement;
    const toggle = element.querySelector('.password-toggle') as HTMLButtonElement;

    expect(input.type).toBe('password');
    expect(toggle.getAttribute('aria-label')).toBe('Mostrar contraseña');
    expect(toggle.getAttribute('aria-pressed')).toBe('false');

    toggle.click();
    fixture.detectChanges();

    expect(input.type).toBe('text');
    expect(toggle.getAttribute('aria-label')).toBe('Ocultar contraseña');
    expect(toggle.getAttribute('aria-pressed')).toBe('true');
  });
});
