import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';
import { ApiLista, ApiUno } from '../models/api-respuesta.model';
import { Usuario, UsuarioCreate, UsuarioUpdate } from '../models/usuario.model';

@Injectable({ providedIn: 'root' })
export class UsuarioService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/usuarios`;

  listar(): Observable<ApiLista<Usuario>> {
    return this.http.get<ApiLista<Usuario>>(`${this.base}/`);
  }

  obtener(id: string): Observable<Usuario> {
    return this.http.get<Usuario>(`${this.base}/${id}`);
  }

  crear(datos: UsuarioCreate): Observable<ApiUno<Usuario>> {
    return this.http.post<ApiUno<Usuario>>(`${this.base}/`, datos);
  }

  actualizar(id: string, datos: UsuarioUpdate): Observable<ApiUno<Usuario>> {
    return this.http.put<ApiUno<Usuario>>(`${this.base}/${id}`, datos);
  }

  eliminar(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
