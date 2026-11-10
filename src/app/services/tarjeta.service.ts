import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';
import { ApiLista, ApiUno } from '../models/api-respuesta.model';
import { Tarjeta, TarjetaCreate, TarjetaUpdate } from '../models/tarjeta.model';

@Injectable({ providedIn: 'root' })
export class TarjetaService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/tarjetas`;

  listar(): Observable<ApiLista<Tarjeta>> {
    return this.http.get<ApiLista<Tarjeta>>(`${this.base}/`);
  }

  obtener(id: string): Observable<Tarjeta> {
    return this.http.get<Tarjeta>(`${this.base}/${id}`);
  }

  crear(datos: TarjetaCreate): Observable<ApiUno<Tarjeta>> {
    return this.http.post<ApiUno<Tarjeta>>(`${this.base}/`, datos);
  }

  actualizar(id: string, datos: TarjetaUpdate): Observable<ApiUno<Tarjeta>> {
    return this.http.put<ApiUno<Tarjeta>>(`${this.base}/${id}`, datos);
  }

  eliminar(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}