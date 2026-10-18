import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ENVIRONMENT } from '../config/env-dev';
import type {
  CompraListadoResponse,
  CompraResponse,
  ComprobanteCompraResponse,
  CrearCompraResponse,
  NuevaCompra,
  PaginatedResponse,
} from '../interfaces/inventario/compra.interface';

@Injectable({ providedIn: 'root' })
export class CompraApi {
  private readonly http = inject(HttpClient);
  private readonly url = `${inject(ENVIRONMENT).apiUrl}/compras`;

  list(page: number, limit: number, q?: string): Promise<PaginatedResponse<CompraListadoResponse>> {
    return firstValueFrom(
      this.http.get<PaginatedResponse<CompraListadoResponse>>(this.url, {
        params: { page, limit, ...(q ? { q } : {}) },
      }),
    );
  }

  getById(id: string): Promise<CompraResponse> {
    return firstValueFrom(this.http.get<CompraResponse>(`${this.url}/${id}`));
  }

  create(compra: NuevaCompra): Promise<CrearCompraResponse> {
    const body = new FormData();
    body.append('proveedorId', compra.proveedorId);
    body.append('almacenId', compra.almacenId);
    body.append('tipoDocumento', compra.tipoDocumento);
    body.append('fecha', compra.fecha);
    body.append('serieDocumento', compra.serieDocumento);
    body.append('numeroDocumento', compra.numeroDocumento);
    if (compra.observaciones) body.append('observaciones', compra.observaciones);
    body.append('renglones', JSON.stringify(compra.renglones));
    if (compra.comprobante) body.append('comprobante', compra.comprobante);
    return firstValueFrom(this.http.post<CrearCompraResponse>(this.url, body));
  }

  attachComprobante(id: string, file: File): Promise<ComprobanteCompraResponse> {
    const body = new FormData();
    body.append('comprobante', file);
    return firstValueFrom(
      this.http.post<ComprobanteCompraResponse>(`${this.url}/${id}/comprobante`, body),
    );
  }

  downloadComprobante(id: string): Promise<Blob> {
    return firstValueFrom(
      this.http.get(`${this.url}/${id}/comprobante/archivo`, { responseType: 'blob' }),
    );
  }
}
