import { TestBed } from '@angular/core/testing';
import { Icon } from './icon';
import { ICONS, IconName } from './icons';

describe('Icon', () => {
  function setup(name: IconName = 'settings') {
    const fixture = TestBed.createComponent(Icon);
    fixture.componentRef.setInput('name', name);
    fixture.detectChanges();
    return fixture;
  }

  it.each(Object.keys(ICONS) as IconName[])('renders the registered %s geometry', (name) => {
    const fixture = setup(name);
    const svg = fixture.nativeElement.querySelector('svg') as SVGElement;
    const shapes = ICONS[name];
    expect(svg.getAttribute('viewBox')).toBe('0 0 24 24');
    expect(svg.children).toHaveLength(shapes.length);
    shapes.forEach((shape, index) => {
      const element = svg.children[index];
      expect(element.localName).toBe(shape.type);
      if (shape.type === 'path') {
        expect(element.getAttribute('d')).toBe(shape.d);
      } else {
        expect(element.getAttribute('cx')).toBe(String(shape.cx));
        expect(element.getAttribute('cy')).toBe(String(shape.cy));
        expect(element.getAttribute('r')).toBe(String(shape.r));
      }
    });
  });

  it('is decorative by default and does not override inherited color or text classes', () => {
    const fixture = setup();
    const host = fixture.nativeElement as HTMLElement;
    const svg = host.querySelector('svg')!;
    expect(host.style.color).toBe('');
    expect(svg.getAttribute('aria-hidden')).toBe('true');
    expect(svg.getAttribute('role')).toBeNull();
    expect(svg.getAttribute('focusable')).toBe('false');
  });

  it('exposes an accessible label when the icon communicates information', () => {
    const fixture = setup();
    fixture.componentRef.setInput('label', 'Configuración');
    fixture.detectChanges();
    const svg = fixture.nativeElement.querySelector('svg') as SVGElement;
    expect(svg.getAttribute('role')).toBe('img');
    expect(svg.getAttribute('aria-label')).toBe('Configuración');
    expect(svg.hasAttribute('aria-hidden')).toBe(false);
  });

  it('supports semantic theme colors and arbitrary CSS colors', () => {
    const fixture = setup();
    fixture.componentRef.setInput('color', 'primary');
    fixture.detectChanges();
    expect(fixture.nativeElement.style.color).toBe('var(--color-primary)');
    fixture.componentRef.setInput('color', '#123456');
    fixture.detectChanges();
    expect(fixture.nativeElement.style.color).toBe('rgb(18, 52, 86)');
    fixture.componentRef.setInput('color', 'currentColor');
    fixture.detectChanges();
    expect(fixture.nativeElement.style.color).toBe('');
  });

  it('accepts numeric attributes and updates size, stroke and geometry', () => {
    const fixture = setup('menu');
    fixture.componentRef.setInput('size', '32');
    fixture.componentRef.setInput('strokeWidth', '2.5');
    fixture.componentRef.setInput('name', 'sun');
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;
    expect(host.style.width).toBe('32px');
    expect(host.style.height).toBe('32px');
    expect(host.querySelector('svg')?.style.strokeWidth).toBe('2.5');
    expect(host.querySelector('circle')?.getAttribute('r')).toBe('4');
  });

  it('maps surface colors and semantic content variants to theme variables', () => {
    const fixture = setup();
    for (const color of [
      'base-100',
      'base-200',
      'base-300',
      'success-content',
      'error-content',
      'warning-content',
      'info-content',
    ]) {
      fixture.componentRef.setInput('color', color);
      fixture.detectChanges();
      expect(fixture.nativeElement.style.color).toBe(`var(--color-${color})`);
    }
  });

  it('falls back to safe dimensions for invalid numeric inputs', () => {
    const fixture = setup();
    fixture.componentRef.setInput('size', -1);
    fixture.componentRef.setInput('strokeWidth', 'invalid');
    fixture.detectChanges();
    expect(fixture.nativeElement.style.width).toBe('20px');
    expect(fixture.nativeElement.querySelector('svg').style.strokeWidth).toBe('1.7');
  });

  it('does not resolve unknown names or inherited object properties', () => {
    const fixture = setup();
    fixture.componentRef.setInput('name', '__proto__');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('svg').children).toHaveLength(0);
  });
});
