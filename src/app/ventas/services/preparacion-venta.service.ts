import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class PreparacionVentaService {
  readonly seleccion = signal<{ almacenId: string; turnoId: string } | null>(null);
}
