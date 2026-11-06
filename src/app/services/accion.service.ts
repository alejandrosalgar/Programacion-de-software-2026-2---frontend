import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';
import { Accion, AccionCreate, AccionUpdate } from '../models/accion.model';
import { ApiLista, ApiUno } from '../models/api-respuesta.model';

@Injectable({ providedIn: 'root' })
export class AccionService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/acciones`;

  listar(): Observable<ApiLista<Accion>> {
    return this.http.get<ApiLista<Accion>>(`${this.base}/`);
  }

  obtener(id: string): Observable<Accion> {
    return this.http.get<Accion>(`${this.base}/${id}`);
  }

  crear(datos: AccionCreate): Observable<ApiUno<Accion>> {
    return this.http.post<ApiUno<Accion>>(`${this.base}/`, datos);
  }

  actualizar(id: string, datos: AccionUpdate): Observable<ApiUno<Accion>> {
    return this.http.put<ApiUno<Accion>>(`${this.base}/${id}`, datos);
  }

  eliminar(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}


