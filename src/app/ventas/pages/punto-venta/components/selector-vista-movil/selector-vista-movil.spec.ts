import { TestBed } from '@angular/core/testing';
import { SelectorVistaMovil, type VistaPuntoVenta } from './selector-vista-movil';

describe('SelectorVistaMovil', () => {
  it('refleja la vista recibida y sus cambios', async () => {
    // Preparar el selector con la vista de productos.
    await TestBed.configureTestingModule({ imports: [SelectorVistaMovil] }).compileComponents();
    const fixture = TestBed.createComponent(SelectorVistaMovil);
    fixture.componentRef.setInput('vista', 'productos');
    fixture.detectChanges();

    const pagina = fixture.nativeElement as HTMLElement;
    const productos = pagina.querySelector<HTMLInputElement>('#vista-productos')!;
    const venta = pagina.querySelector<HTMLInputElement>('#vista-venta')!;
    const seleccionInicial = { productos: productos.checked, venta: venta.checked };
    expect(seleccionInicial).toEqual({ productos: true, venta: false });

    // Actualizar el input desde el componente padre.
    fixture.componentRef.setInput('vista', 'venta');
    fixture.detectChanges();
    const seleccionActualizada = { productos: productos.checked, venta: venta.checked };
    expect(seleccionActualizada).toEqual({ productos: false, venta: true });
  });

  it('emite la vista elegida por el usuario', async () => {
    // Escuchar los cambios como lo haría la página.
    await TestBed.configureTestingModule({ imports: [SelectorVistaMovil] }).compileComponents();
    const fixture = TestBed.createComponent(SelectorVistaMovil);
    fixture.componentRef.setInput('vista', 'productos');
    const vistasEmitidas: VistaPuntoVenta[] = [];
    fixture.componentInstance.vistaChange.subscribe((vista) => vistasEmitidas.push(vista));
    fixture.detectChanges();

    // Seleccionar cada opción y comprobar los valores emitidos.
    const pagina = fixture.nativeElement as HTMLElement;
    const venta = pagina.querySelector<HTMLInputElement>('#vista-venta')!;
    const productos = pagina.querySelector<HTMLInputElement>('#vista-productos')!;
    venta.click();
    productos.click();
    const resultado = vistasEmitidas;
    expect(resultado).toEqual(['venta', 'productos']);
  });

  it('agrupa las opciones y las vincula con sus etiquetas', async () => {
    // Renderizar el selector para revisar su estructura accesible.
    await TestBed.configureTestingModule({ imports: [SelectorVistaMovil] }).compileComponents();
    const fixture = TestBed.createComponent(SelectorVistaMovil);
    fixture.componentRef.setInput('vista', 'productos');
    fixture.detectChanges();

    const pagina = fixture.nativeElement as HTMLElement;
    const grupo = pagina.querySelector('fieldset');
    const productos = pagina.querySelector<HTMLInputElement>('#vista-productos')!;
    const venta = pagina.querySelector<HTMLInputElement>('#vista-venta')!;
    const etiquetaProductos = pagina.querySelector<HTMLLabelElement>(
      'label[for="vista-productos"]',
    );
    const etiquetaVenta = pagina.querySelector<HTMLLabelElement>('label[for="vista-venta"]');
    const nombreGrupo = grupo?.querySelector('legend')?.textContent?.trim();

    expect(nombreGrupo).toBe('Vista del punto de venta');
    expect(productos.type).toBe('radio');
    expect(venta.type).toBe('radio');
    expect(productos.name).toBe('vista-punto-venta');
    expect(venta.name).toBe(productos.name);
    expect(etiquetaProductos?.control).toBe(productos);
    expect(etiquetaVenta?.control).toBe(venta);
  });
});
