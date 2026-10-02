import { Dialog } from '@angular/cdk/dialog';
import { OverlayContainer } from '@angular/cdk/overlay';
import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ConfirmDialogService } from './confirm-dialog.service';

describe('ConfirmDialogService', () => {
  const options = { title: '¿Eliminar producto?', message: 'Esta acción no se puede deshacer.' };

  function container(): HTMLElement {
    return TestBed.inject(OverlayContainer).getContainerElement();
  }

  async function render(): Promise<void> {
    await TestBed.tick();
    await new Promise<void>((resolve) => setTimeout(resolve));
  }

  afterEach(() => {
    TestBed.inject(Dialog).closeAll();
    TestBed.resetTestingModule();
  });

  it('renders accessible labels, focuses Cancel and restores the trigger after confirmation', async () => {
    const trigger = document.createElement('button');
    document.body.appendChild(trigger);
    try {
      trigger.focus();
      const results: boolean[] = [];
      const complete = vi.fn();
      TestBed.inject(ConfirmDialogService)
        .confirm(options)
        .subscribe({ next: (value) => results.push(value), complete });
      await render();
      const dialog = container().querySelector('[role="alertdialog"]')!;
      expect(document.getElementById(dialog.getAttribute('aria-labelledby')!)?.textContent).toBe(
        options.title,
      );
      expect(document.getElementById(dialog.getAttribute('aria-describedby')!)?.textContent).toBe(
        options.message,
      );
      expect(dialog.getAttribute('aria-modal')).toBe('true');
      expect(document.activeElement).toBe(container().querySelector('[data-confirm-cancel]'));
      container().querySelector<HTMLButtonElement>('[data-confirm-accept]')!.click();
      expect(results).toEqual([true]);
      expect(complete).toHaveBeenCalledOnce();
      expect(container().querySelector('[role="alertdialog"]')).toBeNull();
      expect(document.activeElement).toBe(trigger);
    } finally {
      trigger.remove();
    }
  });

  it.each(['cancel', 'escape', 'backdrop', 'programmatic'])(
    'returns false when closed by %s',
    async (method) => {
      const result = vi.fn();
      TestBed.inject(ConfirmDialogService).confirm(options).subscribe(result);
      await render();
      if (method === 'cancel')
        container().querySelector<HTMLButtonElement>('[data-confirm-cancel]')!.click();
      if (method === 'escape') {
        document.activeElement!.dispatchEvent(
          new KeyboardEvent('keydown', { key: 'Escape', keyCode: 27, bubbles: true }),
        );
      }
      if (method === 'backdrop')
        container().querySelector<HTMLElement>('.cdk-overlay-backdrop')!.click();
      if (method === 'programmatic') TestBed.inject(Dialog).closeAll();
      expect(result).toHaveBeenCalledExactlyOnceWith(false);
    },
  );

  it('uses custom labels and destructive styling without interpreting HTML', async () => {
    TestBed.inject(ConfirmDialogService)
      .confirm({
        title: '<img src=x>',
        message: '<strong>Mensaje</strong>',
        confirmText: 'Eliminar',
        cancelText: 'Volver',
        tone: 'danger',
      })
      .subscribe();
    await render();
    expect(container().querySelector('h2')?.textContent).toBe('<img src=x>');
    expect(container().querySelector('p')?.textContent).toBe('<strong>Mensaje</strong>');
    expect(container().querySelector('img, strong')).toBeNull();
    expect(
      container().querySelector('[data-confirm-accept]')?.classList.contains('btn-error'),
    ).toBe(true);
    expect(container().querySelector('[data-confirm-accept]')?.textContent?.trim()).toBe(
      'Eliminar',
    );
    expect(container().querySelector('[data-confirm-cancel]')?.textContent?.trim()).toBe('Volver');
  });

  it('gives each dialog unique accessible labels', async () => {
    const confirmation = TestBed.inject(ConfirmDialogService);
    confirmation.confirm(options).subscribe();
    confirmation.confirm(options).subscribe();
    await render();
    const ids = Array.from(container().querySelectorAll('h2')).map((element) => element.id);
    expect(new Set(ids).size).toBe(2);
  });

  it('does not open an overlay during SSR', () => {
    TestBed.overrideProvider(PLATFORM_ID, { useValue: 'server' });
    const open = vi.spyOn(TestBed.inject(Dialog), 'open');
    const result = vi.fn();
    TestBed.inject(ConfirmDialogService).confirm(options).subscribe(result);
    expect(result).toHaveBeenCalledExactlyOnceWith(false);
    expect(open).not.toHaveBeenCalled();
  });
});
