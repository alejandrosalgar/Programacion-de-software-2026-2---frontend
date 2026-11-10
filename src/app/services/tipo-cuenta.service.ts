import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';
import { ApiLista, ApiUno } from '../models/api-respuesta.model';
import { TipoCuenta, TipoCuentaCreate, TipoCuentaUpdate } from '../models/tipo-cuenta.model';

@Injectable({ providedIn: 'root' })
export class TipoCuentaService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/tipocuentas`;

  listar(): Observable<ApiLista<TipoCuenta>> {
    return this.http.get<ApiLista<TipoCuenta>>(`${this.base}/`);
  }

  obtener(id: string): Observable<TipoCuenta> {
    return this.http.get<TipoCuenta>(`${this.base}/${id}`);
  }

  crear(datos: TipoCuentaCreate): Observable<ApiUno<TipoCuenta>> {
    return this.http.post<ApiUno<TipoCuenta>>(`${this.base}/`, datos);
  }

  actualizar(id: string, datos: TipoCuentaUpdate): Observable<ApiUno<TipoCuenta>> {
    return this.http.put<ApiUno<TipoCuenta>>(`${this.base}/${id}`, datos);
  }

  eliminar(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}