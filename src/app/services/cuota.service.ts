import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';
import { ApiLista, ApiUno } from '../models/api-respuesta.model';
import { Cuota, CuotaCreate, CuotaUpdate } from '../models/cuota.model';

@Injectable({ providedIn: 'root' })
export class CuotaService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/cuotas`;

  listar(): Observable<ApiLista<Cuota>> {
    return this.http.get<ApiLista<Cuota>>(`${this.base}/`);
  }

  obtener(id: string): Observable<Cuota> {
    return this.http.get<Cuota>(`${this.base}/${id}`);
  }

  crear(datos: CuotaCreate): Observable<ApiUno<Cuota>> {
    return this.http.post<ApiUno<Cuota>>(`${this.base}/`, datos);
  }

  actualizar(id: string, datos: CuotaUpdate): Observable<ApiUno<Cuota>> {
    return this.http.put<ApiUno<Cuota>>(`${this.base}/${id}`, datos);
  }

  eliminar(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}