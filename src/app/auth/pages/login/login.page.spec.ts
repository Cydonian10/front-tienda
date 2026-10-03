import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideTanStackQuery, QueryClient } from '@tanstack/angular-query-experimental';
import LoginPage from './login.page';
import { provideRouter, Router } from '@angular/router';
import { AuthProfileService } from '../../services/auth-profile.service';
import { AuthSessionService } from '../../services/auth-session.service';
import { AuthStore } from '../../../store/auth/auth.store';

describe('LoginPage', () => {
  afterEach(() => TestBed.resetTestingModule());

  function setup() {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideTanStackQuery(new QueryClient()), provideRouter([])],
    });
    const fixture = TestBed.createComponent(LoginPage);
    fixture.detectChanges();
    return { fixture, element: fixture.nativeElement as HTMLElement };
  }

  it('renders the visual login fields and unavailable authentication actions', () => {
    const { element } = setup();

    expect(element.querySelector('input[type="email"]')).toBeTruthy();
    expect(element.querySelector('input[type="password"]')).toBeTruthy();
    expect(element.querySelectorAll('button:disabled')).toHaveLength(2);
    expect(element.textContent).toContain('Acceso de demostración');
  });

  it('toggles password visibility accessibly', () => {
    const { fixture, element } = setup();
    const input = element.querySelector('input[type="password"]') as HTMLInputElement;
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

  it('inherits the application theme and provides a theme toggle', () => {
    const { element } = setup();

    expect(element.querySelector('.login-shell')?.hasAttribute('data-theme')).toBe(false);
    expect(element.querySelector('app-theme-toggle button[aria-label]')).toBeTruthy();
  });

  it('shows only the touched field errors and links them to their input', () => {
    const { fixture, element } = setup();
    const page = fixture.componentInstance;
    page.loginModel.set({ email: '', password: '' });
    fixture.detectChanges();
    const email = element.querySelector('input[type="email"]') as HTMLInputElement;
    const password = element.querySelector('input[type="password"]') as HTMLInputElement;

    expect(element.querySelector('[role="alert"]')).toBeNull();

    page.loginForm.password().markAsTouched();
    fixture.detectChanges();

    expect(element.querySelector('#login-password-errors')?.textContent).toContain(
      'El password es obligatorio',
    );
    expect(element.querySelector('#login-email-errors')).toBeNull();
    expect(password.getAttribute('aria-describedby')).toBe('login-password-errors');
    expect(email.hasAttribute('aria-describedby')).toBe(false);

    page.loginForm.email().markAsTouched();
    fixture.detectChanges();

    expect(element.querySelector('#login-email-errors')?.textContent).toContain(
      'El email es obligatorio',
    );
    expect(email.getAttribute('aria-describedby')).toBe('login-email-errors');
  });

  it('reuses the injected login mutation when submitting', async () => {
    const { fixture } = setup();
    const page = fixture.componentInstance;
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    const load = vi.spyOn(TestBed.inject(AuthProfileService), 'load').mockResolvedValue();
    const mutate = vi.spyOn(page.authLoginAction, 'mutateAsync').mockResolvedValue({
      accessToken: 'test-token',
      tokenType: 'Bearer',
      expiresIn: 60,
    });
    page.loginModel.set({ email: 'empleado@empresa.com', password: 'password123' });

    await page.loginSubmit();

    expect(mutate).toHaveBeenCalledWith({ email: 'empleado@empresa.com', password: 'password123' });
    expect(load).toHaveBeenCalledOnce();
    expect(navigate).toHaveBeenCalledWith('/admin');
  });

  it('does not navigate if the profile cannot be loaded after login', async () => {
    const { fixture } = setup();
    const page = fixture.componentInstance;
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    vi.spyOn(page.authLoginAction, 'mutateAsync').mockResolvedValue({
      accessToken: 'test-token',
      tokenType: 'Bearer',
      expiresIn: 60,
    });
    const session = TestBed.inject(AuthSessionService);
    session.set({ accessToken: 'test-token', tokenType: 'Bearer', expiresIn: 60 });
    TestBed.inject(AuthStore).setProfile({ id: 'old-profile' } as never);
    vi.spyOn(TestBed.inject(AuthProfileService), 'load').mockRejectedValue(
      new Error('Network error'),
    );
    page.loginModel.set({ email: 'empleado@empresa.com', password: 'password123' });

    await page.loginSubmit();

    expect(navigate).not.toHaveBeenCalled();
    expect(session.get()).toBeNull();
    expect(TestBed.inject(AuthStore).authPerfil()).toBeNull();
  });
});
