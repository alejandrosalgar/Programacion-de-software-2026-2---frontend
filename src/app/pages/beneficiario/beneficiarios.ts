import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import {
  Beneficiario,
  BeneficiarioCreate,
  BeneficiarioUpdate,
} from '../../models/beneficiario.model';
import { BeneficiarioService } from '../../services/beneficiario.service';

type ModoPopup = 'crear' | 'editar';

interface BeneficiarioForm {
  id_cliente: string;
  nombre_completo: string;
  parentesco: string;
  telefono: string;
}

@Component({
  selector: 'app-beneficiarios',
  imports: [FormsModule],
  templateUrl: './beneficiarios.html',
})
export class Beneficiarios implements OnInit {
  private readonly beneficiarioService = inject(BeneficiarioService);

  readonly filas = signal<Beneficiario[]>([]);
  readonly mensaje = signal('');
  readonly esError = signal(false);
  readonly cargando = signal(false);
  readonly popupAbierto = signal(false);
  readonly modo = signal<ModoPopup>('crear');

  idFiltro = '';
  // UUID del usuario que crea o edita (id_usuario_creacion / id_usuario_edicion)
  idUsuarioAccion = '';
  formulario: BeneficiarioForm = this.formularioVacio();
  private idEditando = '';

  ngOnInit(): void {
    this.cargarTodos();
  }

  buscarPorId(): void {
    const id = this.idFiltro.trim();
    if (!id) {
      this.cargarTodos();
      return;
    }

    this.cargando.set(true);
    this.beneficiarioService.obtener(id).subscribe({
      next: (beneficiario) => {
        this.filas.set([beneficiario]);
        this.avisar('');
        this.cargando.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.filas.set([]);
        this.avisar(this.textoError(error, false), true);
        this.cargando.set(false);
      },
    });
  }

  limpiarFiltro(): void {
    this.idFiltro = '';
    this.cargarTodos();
  }

  abrirCrear(): void {
    this.modo.set('crear');
    this.idEditando = '';
    this.idUsuarioAccion = '';
    this.formulario = this.formularioVacio();
    this.popupAbierto.set(true);
  }

  abrirEditar(fila: Beneficiario): void {
    this.modo.set('editar');
    this.idEditando = fila.id_beneficiario;
    this.idUsuarioAccion = '';
    this.formulario = {
      id_cliente: fila.id_cliente,
      nombre_completo: fila.nombre_completo,
      parentesco: fila.parentesco,
      telefono: fila.telefono,
    };
    this.popupAbierto.set(true);
  }

  cerrarPopup(): void {
    this.popupAbierto.set(false);
  }

  guardar(): void {
    if (!this.formularioValido()) {
      this.avisar(
        'Completa nombre, parentesco, telefono y, al crear, el cliente y el UUID del usuario que crea.',
        true,
      );
      return;
    }

    this.cargando.set(true);
    if (this.modo() === 'crear') {
      this.beneficiarioService.crear(this.datosCreacion()).subscribe({
        next: () => this.despuesDeGuardar('Beneficiario creado'),
        error: (error: HttpErrorResponse) => this.falloGuardar(error),
      });
      return;
    }

    this.beneficiarioService.actualizar(this.idEditando, this.datosEdicion()).subscribe({
      next: () => this.despuesDeGuardar('Beneficiario actualizado'),
      error: (error: HttpErrorResponse) => this.falloGuardar(error),
    });
  }

  eliminar(fila: Beneficiario): void {
    const confirmar = confirm(`Eliminar al beneficiario ${fila.nombre_completo}?`);
    if (!confirmar) {
      return;
    }

    this.cargando.set(true);
    this.beneficiarioService.eliminar(fila.id_beneficiario).subscribe({
      next: () => {
        this.avisar('Beneficiario eliminado');
        this.refrescar();
      },
      error: (error: HttpErrorResponse) => {
        this.avisar(this.textoError(error, false), true);
        this.cargando.set(false);
      },
    });
  }

  private cargarTodos(): void {
    this.cargando.set(true);
    this.beneficiarioService.listar().subscribe({
      next: (respuesta) => {
        const filas = respuesta.data ?? [];
        this.filas.set(filas);
        this.avisar(filas.length ? '' : 'No hay registros');
        this.cargando.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.filas.set([]);
        const listaVacia = error.status === 404;
        this.avisar(listaVacia ? 'No hay registros' : this.textoError(error, true), !listaVacia);
        this.cargando.set(false);
      },
    });
  }

  private refrescar(): void {
    if (this.idFiltro.trim()) {
      this.buscarPorId();
      return;
    }
    this.cargarTodos();
  }

  private despuesDeGuardar(texto: string): void {
    this.popupAbierto.set(false);
    this.avisar(texto);
    this.refrescar();
  }

  private falloGuardar(error: HttpErrorResponse): void {
    this.avisar(this.textoError(error, false), true);
    this.cargando.set(false);
  }

  private formularioValido(): boolean {
    const datos = this.formulario;
    const base =
      datos.nombre_completo.trim() && datos.parentesco.trim() && datos.telefono.trim();
    if (this.modo() === 'crear') {
      return Boolean(base && datos.id_cliente.trim() && this.idUsuarioAccion.trim());
    }
    return Boolean(base);
  }

  private datosCreacion(): BeneficiarioCreate {
    return {
      id_cliente: this.formulario.id_cliente.trim(),
      nombre_completo: this.formulario.nombre_completo.trim(),
      parentesco: this.formulario.parentesco.trim(),
      telefono: this.formulario.telefono.trim(),
      id_usuario_creacion: this.idUsuarioAccion.trim(),
    };
  }

  // BeneficiarioUpdate no incluye id_cliente: no se modifica al editar
  private datosEdicion(): BeneficiarioUpdate {
    const datos: BeneficiarioUpdate = {
      nombre_completo: this.formulario.nombre_completo.trim(),
      parentesco: this.formulario.parentesco.trim(),
      telefono: this.formulario.telefono.trim(),
    };
    if (this.idUsuarioAccion.trim()) {
      datos.id_usuario_edicion = this.idUsuarioAccion.trim();
    }
    return datos;
  }

  private formularioVacio(): BeneficiarioForm {
    return {
      id_cliente: '',
      nombre_completo: '',
      parentesco: '',
      telefono: '',
    };
  }

  private avisar(texto: string, error = false): void {
    this.mensaje.set(texto);
    this.esError.set(error && texto.length > 0);
  }

  private textoError(error: HttpErrorResponse, alListar: boolean): string {
    if (error.status === 0) {
      return 'No se pudo conectar con la API. Revisa que el backend este en el puerto 8000.';
    }
    if (error.status === 404) {
      return alListar ? 'No hay registros' : 'No encontrado';
    }
    const detalle = error.error?.detail;
    if (Array.isArray(detalle)) {
      return (
        'Revisa: ' +
        detalle
          .map((d: { loc?: string[]; msg?: string }) => `${(d.loc ?? []).slice(1).join('.')}: ${d.msg}`)
          .join(' | ')
      );
    }
    if (typeof detalle === 'string') {
      return detalle;
    }
    return `No se pudo completar la operacion (error ${error.status})`;
  }
}
