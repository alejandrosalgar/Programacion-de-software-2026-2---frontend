import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { Empleado, EmpleadoCreate, EmpleadoUpdate } from '../../models/empleado.model';
import { EmpleadoService } from '../../services/empleado.service';

type ModoPopup = 'crear' | 'editar';

@Component({
  selector: 'app-empleados',
  imports: [FormsModule],
  templateUrl: './empleados.html',
  styleUrl: './empleados.css',
})
export class Empleados implements OnInit {
  private readonly empleadoService = inject(EmpleadoService);

  readonly filas = signal<Empleado[]>([]);
  readonly mensaje = signal('');
  readonly esError = signal(false);
  readonly cargando = signal(false);
  readonly popupAbierto = signal(false);
  readonly modo = signal<ModoPopup>('crear');

  idFiltro = '';
  formulario: EmpleadoCreate = this.formularioVacio();
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
    this.empleadoService.obtener(id).subscribe({
      next: (empleado) => {
        this.filas.set([empleado]);
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

  abrirEditar(empleado: Empleado): void {
    this.modo.set('editar');
    this.idEditando = empleado.id_empleado;
    this.formulario = {
      id_usuario: empleado.id_usuario,
      id_sucursal: empleado.id_sucursal,
      cargo: empleado.cargo,
      activo: empleado.activo,
      id_usuario_creacion: empleado.id_usuario_creacion,
    };
    this.popupAbierto.set(true);
  }

  cerrarPopup(): void {
    this.popupAbierto.set(false);
  }

  guardar(): void {
    if (!this.formularioValido()) {
      this.avisar('Completa los identificadores de usuario y sucursal y el cargo.', true);
      return;
    }

    this.cargando.set(true);
    if (this.modo() === 'crear') {
      this.empleadoService.crear(this.datosFormulario()).subscribe({
        next: () => this.despuesDeGuardar('Empleado creado'),
        error: (error: HttpErrorResponse) => this.falloGuardar(error),
      });
      return;
    }

    this.empleadoService.actualizar(this.idEditando, this.datosEdicion()).subscribe({
      next: () => this.despuesDeGuardar('Empleado actualizado'),
      error: (error: HttpErrorResponse) => this.falloGuardar(error),
    });
  }

  eliminar(empleado: Empleado): void {
    if (!confirm(`Eliminar el empleado ${empleado.id_empleado}?`)) {
      return;
    }

    this.cargando.set(true);
    this.empleadoService.eliminar(empleado.id_empleado).subscribe({
      next: () => {
        this.avisar('Empleado eliminado');
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
    this.empleadoService.listar().subscribe({
      next: (respuesta) => {
        const filas = respuesta.data ?? [];
        this.filas.set(filas);
        this.avisar(filas.length ? '' : 'No hay empleados');
        this.cargando.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.filas.set([]);
        const listaVacia = error.status === 404;
        this.avisar(listaVacia ? 'No hay empleados' : this.textoError(error, true), !listaVacia);
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
      this.formulario.id_usuario.trim() &&
        this.formulario.id_sucursal.trim() &&
        this.formulario.cargo.trim(),
    );
  }

  private datosFormulario(): EmpleadoCreate {
    return {
      id_usuario: this.formulario.id_usuario.trim(),
      id_sucursal: this.formulario.id_sucursal.trim(),
      cargo: this.formulario.cargo.trim(),
      activo: this.formulario.activo ?? true,
      id_usuario_creacion: this.formulario.id_usuario_creacion,
    };
  }

  private datosEdicion(): EmpleadoUpdate {
    return this.datosFormulario();
  }

  private formularioVacio(): EmpleadoCreate {
    return { id_usuario: '', id_sucursal: '', cargo: '', activo: true };
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
      return alListar ? 'No hay empleados' : 'Empleado no encontrado';
    }
    if (error.status === 422) {
      return 'Revisa los datos y que los identificadores tengan formato UUID.';
    }
    const detail = error.error?.detail;
    return typeof detail === 'string' ? detail : 'No se pudo completar la operacion';
  }
}