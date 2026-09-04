import { HttpEvent, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';

import { ApiResponse, ApiService } from './api.service';
import { Image } from '../models/image.model';

@Injectable({ providedIn: 'root' })
export class ImagesService extends ApiService {
  upload(file: File, entityType: string, entityId: number): Observable<HttpEvent<Image>> {
    const body = new FormData();
    body.append('file', file);
    body.append('entityType', entityType);
    body.append('entityId', String(entityId));

    return this.http
      .post<ApiResponse<Image>>(`${this.apiUrl}/images`, body, {
        observe: 'events',
        reportProgress: true,
      })
      .pipe(
        map((event) =>
          event instanceof HttpResponse ? event.clone({ body: event.body!.data }) : event,
        ),
      );
  }

  findAll(entityType: string, entityId: number): Observable<Image[]> {
    return this.unwrap(
      this.http.get<ApiResponse<Image[]>>(`${this.apiUrl}/images`, {
        params: { entityType, entityId },
      }),
    );
  }

  setMain(id: number): Observable<Image> {
    return this.unwrap(
      this.http.patch<ApiResponse<Image>>(`${this.apiUrl}/images/${id}`, { isMain: true }),
    );
  }

  remove(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/images/${id}`);
  }
}
