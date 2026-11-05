import { TestBed } from '@angular/core/testing';
import { PreparacionVentaService } from './preparacion-venta.service';

describe('PreparacionVentaService', () => {
  beforeEach(() => {
    // Cada prueba usa un almacenamiento independiente en memoria.
    const datos = new Map<string, string>();
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => datos.get(key) ?? null,
      setItem: (key: string, value: string) => datos.set(key, value),
      removeItem: (key: string) => datos.delete(key),
    });
  });
  // Restaurar el almacenamiento original después de cada prueba.
  afterEach(() => vi.unstubAllGlobals());

  it('guarda y recupera la selección al crear de nuevo el servicio', () => {
    // Guardar la selección con la primera instancia del servicio.
    TestBed.inject(PreparacionVentaService).seleccionar({ almacenId: 'a1', turnoId: 't1' });

    // Crear una nueva instancia para comprobar que recupera los datos guardados.
    TestBed.resetTestingModule();
    const servicio = TestBed.inject(PreparacionVentaService);
    const seleccionRecuperada = servicio.seleccion();
    expect(seleccionRecuperada).toEqual({ almacenId: 'a1', turnoId: 't1' });

    // Al limpiar la selección, también se elimina del almacenamiento.
    servicio.seleccionar(null);
    expect(window.localStorage.getItem('preparacion-venta')).toBeNull();
  });

  it('ignora datos inválidos', () => {
    // Guardar un JSON incorrecto antes de crear el servicio.
    window.localStorage.setItem('preparacion-venta', '{incorrecto');
    const servicio = TestBed.inject(PreparacionVentaService);
    const seleccionRecuperada = servicio.seleccion();

    // El servicio ignora los datos incorrectos y devuelve una selección vacía.
    expect(seleccionRecuperada).toBeNull();
  });
});
