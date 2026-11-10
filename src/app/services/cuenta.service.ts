import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';
import { ApiLista, ApiUno } from '../models/api-respuesta.model';
import { Cuenta, CuentaCreate, CuentaUpdate } from '../models/cuenta.model';

@Injectable({ providedIn: 'root' })
export class CuentaService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/cuentas`;

  listar(): Observable<ApiLista<Cuenta>> {
    return this.http.get<ApiLista<Cuenta>>(`${this.base}/`);
  }

  obtener(id: string): Observable<Cuenta> {
    return this.http.get<Cuenta>(`${this.base}/${id}`);
  }

  crear(datos: CuentaCreate): Observable<ApiUno<Cuenta>> {
    return this.http.post<ApiUno<Cuenta>>(`${this.base}/`, datos);
  }

  actualizar(id: string, datos: CuentaUpdate): Observable<ApiUno<Cuenta>> {
    return this.http.put<ApiUno<Cuenta>>(`${this.base}/${id}`, datos);
  }

  eliminar(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}


