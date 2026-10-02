import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Tooltip, TooltipPosition } from './tooltip';

@Component({
  imports: [Tooltip],
  template: `
    <p id="existing-description">Descripción existente</p>
    <button
      class="btn"
      aria-label="Guardar"
      aria-describedby="existing-description"
      [appTooltip]="text()"
      [tooltipPosition]="position()"
      [tooltipDisabled]="disabled()"
    >
      Guardar
    </button>
  `,
})
class TestHost {
  readonly text = signal<string | null | undefined>('Guardar los cambios');
  readonly position = signal<TooltipPosition>('top');
  readonly disabled = signal(false);
}

describe('Tooltip', () => {
  afterEach(() => TestBed.resetTestingModule());

  function setup() {
    const fixture = TestBed.createComponent(TestHost);
    fixture.detectChanges();
    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    return { fixture, button };
  }

  it('applies daisyUI classes and an accessible description without replacing existing labels', () => {
    const { button } = setup();
    expect(button.classList.contains('btn')).toBe(true);
    expect(button.classList.contains('tooltip')).toBe(true);
    expect(button.classList.contains('tooltip-top')).toBe(true);
    expect(button.getAttribute('data-tip')).toBe('Guardar los cambios');
    expect(button.getAttribute('aria-label')).toBe('Guardar');
    const ids = button.getAttribute('aria-describedby')!.split(' ');
    expect(ids).toContain('existing-description');
    const description = document.getElementById(ids.find((id) => id !== 'existing-description')!)!;
    expect(description.textContent).toBe('Guardar los cambios');
    expect(description.getAttribute('role')).toBe('tooltip');
  });

  it('opens on focus and hides on Escape without moving focus', () => {
    const { fixture, button } = setup();
    button.focus();
    fixture.detectChanges();
    expect(button.classList.contains('tooltip-open')).toBe(true);
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    fixture.detectChanges();
    expect(button.classList.contains('tooltip-open')).toBe(false);
    expect(button.hasAttribute('data-tip')).toBe(false);
    expect(document.activeElement).toBe(button);
    button.blur();
    button.focus();
    fixture.detectChanges();
    expect(button.classList.contains('tooltip-open')).toBe(true);
  });

  it('hides on click without moving focus or preventing the action and reopens on re-entry', () => {
    const { fixture, button } = setup();
    const action = vi.fn();
    button.addEventListener('click', action);
    button.focus();
    fixture.detectChanges();
    expect(button.classList.contains('tooltip-open')).toBe(true);
    button.click();
    fixture.detectChanges();
    expect(action).toHaveBeenCalledOnce();
    expect(document.activeElement).toBe(button);
    expect(button.classList.contains('tooltip-open')).toBe(false);
    expect(button.hasAttribute('data-tip')).toBe(false);
    expect(button.getAttribute('aria-describedby')!.split(' ')).toHaveLength(2);
    button.dispatchEvent(new Event('pointerleave'));
    button.dispatchEvent(new Event('pointerenter'));
    fixture.detectChanges();
    expect(button.classList.contains('tooltip-open')).toBe(true);
    button.click();
    button.blur();
    button.focus();
    fixture.detectChanges();
    expect(button.classList.contains('tooltip-open')).toBe(true);
  });

  it('opens on pointer entry and keeps the tooltip open while focus remains', () => {
    const { fixture, button } = setup();
    button.dispatchEvent(new Event('pointerenter'));
    fixture.detectChanges();
    expect(button.classList.contains('tooltip-open')).toBe(true);
    button.focus();
    button.dispatchEvent(new Event('pointerleave'));
    fixture.detectChanges();
    expect(button.classList.contains('tooltip-open')).toBe(true);
    button.blur();
    fixture.detectChanges();
    expect(button.classList.contains('tooltip-open')).toBe(false);
  });

  it.each(['top', 'bottom', 'left', 'right'] as const)('supports %s placement', (position) => {
    const { fixture, button } = setup();
    fixture.componentInstance.position.set(position);
    fixture.detectChanges();
    expect(button.classList.contains(`tooltip-${position}`)).toBe(true);
    expect(
      Array.from(button.classList).filter((name) => /^tooltip-(top|bottom|left|right)$/.test(name)),
    ).toHaveLength(1);
  });

  it.each(['', '   ', null, undefined])('removes empty descriptions for %s', (text) => {
    const { fixture, button } = setup();
    fixture.componentInstance.text.set(text);
    fixture.detectChanges();
    expect(button.hasAttribute('data-tip')).toBe(false);
    expect(button.classList.contains('tooltip')).toBe(false);
    expect(button.getAttribute('aria-describedby')).toBe('existing-description');
  });

  it('disables and restores the tooltip and its description', () => {
    const { fixture, button } = setup();
    fixture.componentInstance.disabled.set(true);
    fixture.detectChanges();
    expect(button.hasAttribute('data-tip')).toBe(false);
    expect(button.getAttribute('aria-describedby')).toBe('existing-description');
    fixture.componentInstance.disabled.set(false);
    fixture.detectChanges();
    expect(button.getAttribute('data-tip')).toBe('Guardar los cambios');
    expect(button.getAttribute('aria-describedby')!.split(' ')).toHaveLength(2);
  });

  it('updates text safely and cleans up its description on destroy', () => {
    const { fixture, button } = setup();
    const previous = button.getAttribute('aria-describedby')!.split(' ').at(-1)!;
    fixture.componentInstance.text.set('<img src=x onerror=alert(1)>');
    fixture.detectChanges();
    expect(document.getElementById(previous)).toBeNull();
    const current = button.getAttribute('aria-describedby')!.split(' ').at(-1)!;
    expect(document.getElementById(current)?.textContent).toBe('<img src=x onerror=alert(1)>');
    expect(document.getElementById(current)?.querySelector('img')).toBeNull();
    fixture.destroy();
    expect(document.getElementById(current)).toBeNull();
    expect(button.getAttribute('aria-describedby')).toBe('existing-description');
  });
});
