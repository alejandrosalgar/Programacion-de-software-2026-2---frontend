import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { Cuota, CuotaCreate, CuotaUpdate } from '../../models/cuota.model';
import { CuotaService } from '../../services/cuota.service';

type ModoPopup = 'crear' | 'editar';

@Component({
  selector: 'app-cuotas',
  imports: [FormsModule],
  templateUrl: './cuotas.html',
  styleUrl: './cuotas.css',
})
export class Cuotas implements OnInit {
  private readonly cuotaService = inject(CuotaService);

  readonly filas = signal<Cuota[]>([]);
  readonly mensaje = signal('');
  readonly esError = signal(false);
  readonly cargando = signal(false);
  readonly popupAbierto = signal(false);
  readonly modo = signal<ModoPopup>('crear');

  idFiltro = '';
  formulario: CuotaCreate = this.formularioVacio();
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
    this.cuotaService.obtener(id).subscribe({
      next: (cuota) => {
        this.filas.set([cuota]);
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
    this.formulario = this.formularioVacio();
    this.popupAbierto.set(true);
  }

  abrirEditar(cuota: Cuota): void {
    this.modo.set('editar');
    this.idEditando = cuota.id_cuota;
    this.formulario = {
      id_prestamo: cuota.id_prestamo,
      valor: cuota.valor,
      numero_cuota: cuota.numero_cuota,
      fecha_vencimiento: cuota.fecha_vencimiento,
      estado: cuota.estado,
      id_usuario_creacion: cuota.id_usuario_creacion,
    };
    this.popupAbierto.set(true);
  }

  cerrarPopup(): void {
    this.popupAbierto.set(false);
  }

  guardar(): void {
    if (!this.formularioValido()) {
      this.avisar('Completa el prestamo, valor, numero y fecha de vencimiento.', true);
      return;
    }

    this.cargando.set(true);
    if (this.modo() === 'crear') {
      this.cuotaService.crear(this.datosFormulario()).subscribe({
        next: () => this.despuesDeGuardar('Cuota creada'),
        error: (error: HttpErrorResponse) => this.falloGuardar(error),
      });
      return;
    }

    this.cuotaService.actualizar(this.idEditando, this.datosEdicion()).subscribe({
      next: () => this.despuesDeGuardar('Cuota actualizada'),
      error: (error: HttpErrorResponse) => this.falloGuardar(error),
    });
  }

  eliminar(cuota: Cuota): void {
    if (!confirm(`Eliminar la cuota ${cuota.numero_cuota}?`)) {
      return;
    }

    this.cargando.set(true);
    this.cuotaService.eliminar(cuota.id_cuota).subscribe({
      next: () => {
        this.avisar('Cuota eliminada');
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
    this.cuotaService.listar().subscribe({
      next: (respuesta) => {
        const filas = respuesta.data ?? [];
        this.filas.set(filas);
        this.avisar(filas.length ? '' : 'No hay cuotas');
        this.cargando.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.filas.set([]);
        const listaVacia = error.status === 404;
        this.avisar(listaVacia ? 'No hay cuotas' : this.textoError(error, true), !listaVacia);
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
    return Boolean(
      this.formulario.id_prestamo.trim() &&
        this.formulario.valor > 0 &&
        this.formulario.numero_cuota > 0 &&
        this.formulario.fecha_vencimiento,
    );
  }

  private datosFormulario(): CuotaCreate {
    return {
      id_prestamo: this.formulario.id_prestamo.trim(),
      valor: this.formulario.valor,
      numero_cuota: this.formulario.numero_cuota,
      fecha_vencimiento: this.formulario.fecha_vencimiento,
      estado: this.formulario.estado?.trim() || 'pendiente',
      id_usuario_creacion: this.formulario.id_usuario_creacion,
    };
  }

  private datosEdicion(): CuotaUpdate {
    return this.datosFormulario();
  }

  private formularioVacio(): CuotaCreate {
    return {
      id_prestamo: '',
      valor: 0,
      numero_cuota: 1,
      fecha_vencimiento: '',
      estado: 'pendiente',
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
      return alListar ? 'No hay cuotas' : 'Cuota no encontrada';
    }
    if (error.status === 422) {
      return 'Revisa los datos y que los identificadores tengan formato UUID.';
    }
    const detail = error.error?.detail;
    return typeof detail === 'string' ? detail : 'No se pudo completar la operacion';
  }
}