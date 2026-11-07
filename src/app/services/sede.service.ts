import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';
import { ApiLista, ApiUno } from '../models/api-respuesta.model';
import { Sede, SedeCreate, SedeUpdate } from '../models/sede.model';

@Injectable({ providedIn: 'root' })
export class SedeService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/sedes`;

  listar(): Observable<ApiLista<Sede>> {
    return this.http.get<ApiLista<Sede>>(`${this.base}/`);
  }

  obtener(id: string): Observable<Sede> {
    return this.http.get<Sede>(`${this.base}/${id}`);
  }

  crear(datos: SedeCreate): Observable<ApiUno<Sede>> {
    return this.http.post<ApiUno<Sede>>(`${this.base}/`, datos);
  }

  actualizar(id: string, datos: SedeUpdate): Observable<ApiUno<Sede>> {
    return this.http.put<ApiUno<Sede>>(`${this.base}/${id}`, datos);
  }

  eliminar(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
