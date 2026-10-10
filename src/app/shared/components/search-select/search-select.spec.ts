import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { SearchSelect, SearchSelectOption } from './search-select';

describe('SearchSelect', () => {
  const options: SearchSelectOption[] = [
    { value: 1, label: 'Martillo' },
    { value: 2, label: 'Taladro' },
    { value: 3, label: 'Serrucho', disabled: true },
  ];

  function setup(multiple = false) {
    const fixture = TestBed.createComponent(SearchSelect);
    fixture.componentRef.setInput('options', options);
    fixture.componentRef.setInput('multiple', multiple);
    fixture.detectChanges();
    return { fixture, component: fixture.componentInstance };
  }

  it('filters labels without changing the selected value', () => {
    const { component } = setup();
    component.writeValue(1);
    component.onSearch('  TAL  ');
    expect(component.filteredOptions().map((option) => option.value)).toEqual([2]);
    expect(component.displayValue()).toBe('Martillo');
  });

  it('uses custom keys for search, display and single selection', () => {
    const { fixture, component } = setup();
    const products = [
      { productId: 0, nombre: 'Martillo' },
      { productId: 12, nombre: 'Taladro' },
    ];
    fixture.componentRef.setInput('options', products);
    fixture.componentRef.setInput('valueKey', 'productId');
    fixture.componentRef.setInput('labelKey', 'nombre');
    component.writeValue(0);
    fixture.detectChanges();
    expect(component.displayValue()).toBe('Martillo');
    component.onSearch('TAL');
    expect(component.filteredOptions().map((option) => option.value)).toEqual([12]);
    const changed = vi.fn();
    const emitted = vi.fn();
    component.registerOnChange(changed);
    component.selectionChange.subscribe(emitted);
    component.choose(component.filteredOptions()[0]);
    expect(changed).toHaveBeenCalledWith(12);
    expect(emitted).toHaveBeenCalledWith(12);
    expect(component.displayValue()).toBe('Taladro');
    expect(products[0]).toEqual({ productId: 0, nombre: 'Martillo' });
  });

  it('uses custom keys for multiple selection and retains disabled options', () => {
    const { fixture, component } = setup(true);
    fixture.componentRef.setInput('options', [
      { id: 'a', descripcion: 'Administrador' },
      { id: 'b', descripcion: 'Vendedor' },
      { id: 'c', descripcion: 'Invitado', disabled: true },
    ]);
    fixture.componentRef.setInput('valueKey', 'id');
    fixture.componentRef.setInput('labelKey', 'descripcion');
    fixture.detectChanges();
    const changed = vi.fn();
    component.registerOnChange(changed);
    const normalized = component.filteredOptions();
    component.choose(normalized[0]);
    component.choose(normalized[1]);
    component.choose(normalized[2]);
    expect(changed).toHaveBeenLastCalledWith(['a', 'b']);
    expect(changed).toHaveBeenCalledTimes(2);
    expect(component.displayValue()).toBe('Administrador, Vendedor');
    component.choose(normalized[0]);
    expect(changed).toHaveBeenLastCalledWith(['b']);
  });

  it('recomputes labels when labelKey changes', () => {
    const { fixture, component } = setup();
    fixture.componentRef.setInput('options', [{ value: 1, label: 'Martillo', nombre: 'Hammer' }]);
    component.writeValue(1);
    expect(component.displayValue()).toBe('Martillo');
    fixture.componentRef.setInput('labelKey', 'nombre');
    expect(component.displayValue()).toBe('Hammer');
  });

  it('rejects a missing value property instead of emitting undefined', () => {
    const { fixture, component } = setup();
    fixture.componentRef.setInput('valueKey', 'productId');
    expect(() => component.filteredOptions()).toThrow('"productId" must contain a string or number');
  });

  it('emits a single value and closes after selection', () => {
    const { component } = setup();
    const changed = vi.fn();
    const touched = vi.fn();
    component.registerOnChange(changed);
    component.registerOnTouched(touched);
    component.toggle();
    component.choose(options[1]);
    expect(changed).toHaveBeenCalledWith(2);
    expect(component.selected()).toEqual([2]);
    expect(component.opened()).toBe(false);
    expect(touched).toHaveBeenCalledOnce();
  });

  it('toggles multiple selections without closing', () => {
    const { component } = setup(true);
    const changed = vi.fn();
    component.registerOnChange(changed);
    component.writeValue([1]);
    component.toggle();
    component.choose(options[1]);
    expect(changed).toHaveBeenLastCalledWith([1, 2]);
    component.choose(options[0]);
    expect(changed).toHaveBeenLastCalledWith([2]);
    expect(component.opened()).toBe(true);
    component.choose(options[2]);
    expect(changed).toHaveBeenCalledTimes(2);
  });

  it('respects disabled state and the configured visible rows', () => {
    const { fixture, component } = setup();
    fixture.componentRef.setInput('visibleItems', 3);
    fixture.detectChanges();
    expect(component.maxListHeight).toBe(120);
    component.setDisabledState(true);
    component.toggle();
    component.choose(options[0]);
    expect(component.opened()).toBe(false);
    expect(component.selected()).toEqual([]);
  });

  it('renders the overlay, filters and selects an option through the UI', () => {
    const { fixture, component } = setup();
    fixture.componentRef.setInput('visibleItems', 2);
    fixture.detectChanges();
    (fixture.nativeElement.querySelector('button') as HTMLButtonElement).click();
    fixture.detectChanges();

    const list = document.getElementById(`${component.id}-listbox`)!;
    expect(list.style.maxHeight).toBe('80px');
    const search = document.querySelector(`input[aria-controls="${component.id}-listbox"]`) as HTMLInputElement;
    search.value = 'tal';
    search.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();
    expect(list.querySelectorAll('[role="option"]')).toHaveLength(1);
    (list.querySelector('[role="option"]') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(component.selected()).toEqual([2]);
    expect(component.opened()).toBe(false);
    fixture.destroy();
  });

  it('updates a reactive form control when selecting an option and when resetting', () => {
    @Component({
      imports: [SearchSelect, ReactiveFormsModule],
      template: `<app-search-select [options]="options" [formControl]="roleId" />`,
    })
    class RoleForm {
      readonly options = [
        { value: 'admin', label: 'Administrador' },
        { value: 'seller', label: 'Vendedor' },
      ];
      readonly roleId = new FormControl('', { nonNullable: true, validators: Validators.required });
    }

    const fixture = TestBed.createComponent(RoleForm);
    fixture.detectChanges();
    const select = fixture.debugElement.children[0].componentInstance as SearchSelect;
    expect(fixture.componentInstance.roleId.invalid).toBe(true);

    select.choose(select.filteredOptions()[1]);
    expect(fixture.componentInstance.roleId.value).toBe('seller');
    expect(fixture.componentInstance.roleId.valid).toBe(true);

    fixture.componentInstance.roleId.setValue('');
    fixture.detectChanges();
    expect(select.displayValue()).toBe('');
    expect(fixture.componentInstance.roleId.invalid).toBe(true);
    fixture.destroy();
  });
});
