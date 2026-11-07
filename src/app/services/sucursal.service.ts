import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';
import { ApiLista, ApiUno } from '../models/api-respuesta.model';
import { Sucursal, SucursalCreate, SucursalUpdate } from '../models/sucursal.model';

@Injectable({ providedIn: 'root' })
export class SucursalService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/sucursales`;

  listar(): Observable<ApiLista<Sucursal>> {
    return this.http.get<ApiLista<Sucursal>>(`${this.base}/`);
  }

  obtener(id: string): Observable<Sucursal> {
    return this.http.get<Sucursal>(`${this.base}/${id}`);
  }

  crear(datos: SucursalCreate): Observable<ApiUno<Sucursal>> {
    return this.http.post<ApiUno<Sucursal>>(`${this.base}/`, datos);
  }

  actualizar(id: string, datos: SucursalUpdate): Observable<ApiUno<Sucursal>> {
    return this.http.put<ApiUno<Sucursal>>(`${this.base}/${id}`, datos);
  }

  eliminar(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}