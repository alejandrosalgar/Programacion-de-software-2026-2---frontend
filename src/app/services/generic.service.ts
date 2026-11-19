import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';
import { ApiLista, ApiUno } from '../models/api-respuesta.model';

export class GenericService<TEntity, TCreate, TUpdate> {
  private readonly base: string;

  constructor(
    private readonly http: HttpClient,
    endpoint: string,
  ) {
    this.base = `${environment.apiUrl}/${endpoint}`;
  }

  listar(): Observable<ApiLista<TEntity>> {
    return this.http.get<ApiLista<TEntity>>(`${this.base}/`);
  }

  obtener(id: string): Observable<TEntity> {
    return this.http.get<TEntity>(`${this.base}/${id}`);
  }

  crear(datos: TCreate): Observable<ApiUno<TEntity>> {
    return this.http.post<ApiUno<TEntity>>(`${this.base}/`, datos);
  }

  actualizar(id: string, datos: TUpdate): Observable<ApiUno<TEntity>> {
    return this.http.put<ApiUno<TEntity>>(`${this.base}/${id}`, datos);
  }

  eliminar(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
