import { TestBed } from '@angular/core/testing';
import { Dialog } from '@angular/cdk/dialog';
import { of } from 'rxjs';
import UsuariosPage from './usuarios.page';
import { ConfirmDialogService } from '../../../shared/services/confirm-dialog/confirm-dialog.service';

describe('UsuariosPage (datos de ejemplo)', () => {
  const dialog = { open: vi.fn() };
  const confirmation = { confirm: vi.fn() };

  beforeEach(async () => {
    dialog.open.mockReset();
    confirmation.confirm.mockReset();
    await TestBed.configureTestingModule({
      imports: [UsuariosPage],
      providers: [
        { provide: Dialog, useValue: dialog },
        { provide: ConfirmDialogService, useValue: confirmation },
      ],
    }).compileComponents();
  });

  it('muestra cuatro usuarios y permite filtrar por nombre y estado', () => {
    const fixture = TestBed.createComponent(UsuariosPage);
    fixture.detectChanges();
    const element: HTMLElement = fixture.nativeElement;
    expect(element.textContent).toContain('Gabriel Pérez');
    expect(element.querySelectorAll('app-usuarios-list button[aria-current]')).toHaveLength(1);

    const search: HTMLInputElement = element.querySelector('input[type="search"]')!;
    search.value = 'María';
    search.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(element.querySelectorAll('app-usuarios-list button')).toHaveLength(1);
    expect(element.querySelector('app-usuarios-list')?.textContent).toContain('María Rojas');
    expect(element.querySelector('app-usuarios-list')?.textContent).not.toContain('Luis Quispe');

    const status: HTMLSelectElement = element.querySelector('app-usuarios-list select')!;
    status.value = 'inactive';
    status.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    expect(element.querySelector('app-usuarios-list')?.textContent).toContain(
      'No hay usuarios con estos filtros',
    );
  });

  it('crea una persona y su cuenta solo en el estado local', () => {
    dialog.open.mockReturnValue({
      closed: of({
        email: 'test@example.com',
        nickName: 'test',
        emailVerified: false,
        active: true,
        person: {
          id: 'person-test',
          firstName: 'Test',
          lastName: 'Local',
          identityDocument: '100',
          dateOfBirth: '1999-01-01',
          active: true,
        },
      }),
    });
    const fixture = TestBed.createComponent(UsuariosPage);
    fixture.detectChanges();
    const button = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll('button'),
    ).find((item) => item.textContent?.includes('Nuevo usuario'))!;
    button.click();
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Test Local');
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Usuarios 5');
  });

  it('quita una asignación solamente después de confirmar', () => {
    confirmation.confirm.mockReturnValue(of(true));
    const fixture = TestBed.createComponent(UsuariosPage);
    fixture.detectChanges();
    const remove = (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>(
      'button[aria-label="Quitar rol Administrador"]',
    )!;
    remove.click();
    fixture.detectChanges();
    expect(confirmation.confirm).toHaveBeenCalledOnce();
    expect(
      (fixture.nativeElement as HTMLElement).querySelector(
        'button[aria-label="Quitar rol Administrador"]',
      ),
    ).toBeNull();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Supervisor');
  });
});
