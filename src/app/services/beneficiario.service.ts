import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';
import { ApiLista, ApiUno } from '../models/api-respuesta.model';
import {
  Beneficiario,
  BeneficiarioCreate,
  BeneficiarioUpdate,
} from '../models/beneficiario.model';

@Injectable({ providedIn: 'root' })
export class BeneficiarioService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/beneficiarios`;

  listar(): Observable<ApiLista<Beneficiario>> {
    return this.http.get<ApiLista<Beneficiario>>(`${this.base}/`);
  }

  obtener(id: string): Observable<Beneficiario> {
    return this.http.get<Beneficiario>(`${this.base}/${id}`);
  }

  crear(datos: BeneficiarioCreate): Observable<ApiUno<Beneficiario>> {
    return this.http.post<ApiUno<Beneficiario>>(`${this.base}/`, datos);
  }

  actualizar(id: string, datos: BeneficiarioUpdate): Observable<ApiUno<Beneficiario>> {
    return this.http.put<ApiUno<Beneficiario>>(`${this.base}/${id}`, datos);
  }

  eliminar(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}

