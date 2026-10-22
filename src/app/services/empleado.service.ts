import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';
import { ApiLista, ApiUno } from '../models/api-respuesta.model';
import { Empleado, EmpleadoCreate, EmpleadoUpdate } from '../models/empleado.model';

@Injectable({ providedIn: 'root' })
export class EmpleadoService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/empleados`;

  listar(): Observable<ApiLista<Empleado>> {
    return this.http.get<ApiLista<Empleado>>(`${this.base}/`);
  }

  obtener(id: string): Observable<Empleado> {
    return this.http.get<Empleado>(`${this.base}/${id}`);
  }

  crear(datos: EmpleadoCreate): Observable<ApiUno<Empleado>> {
    return this.http.post<ApiUno<Empleado>>(`${this.base}/`, datos);
  }

  actualizar(id: string, datos: EmpleadoUpdate): Observable<ApiUno<Empleado>> {
    return this.http.put<ApiUno<Empleado>>(`${this.base}/${id}`, datos);
  }

  eliminar(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}