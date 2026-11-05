import { isPlatformBrowser } from '@angular/common';
import { inject, Injectable, PLATFORM_ID, signal } from '@angular/core';

interface SeleccionVenta {
  almacenId: string;
  turnoId: string;
}

const STORAGE_KEY = 'preparacion-venta';

@Injectable({ providedIn: 'root' })
export class PreparacionVentaService {
  private readonly browser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly estado = signal<SeleccionVenta | null>(this.recuperar());
  readonly seleccion = this.estado.asReadonly();

  seleccionar(seleccion: SeleccionVenta | null): void {
    this.estado.set(seleccion);
    if (!this.browser) return;
    try {
      if (seleccion) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seleccion));
      else window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // La selección sigue disponible en memoria si el almacenamiento no está accesible.
    }
  }

  private recuperar(): SeleccionVenta | null {
    if (!this.browser) return null;
    try {
      const valor = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? 'null');
      if (typeof valor?.almacenId === 'string' && valor.almacenId.trim() &&
          typeof valor?.turnoId === 'string' && valor.turnoId.trim()) {
        return { almacenId: valor.almacenId, turnoId: valor.turnoId };
      }
    } catch {
      // Ignorar almacenamiento inaccesible o datos inválidos.
    }
    return null;
  }
}
