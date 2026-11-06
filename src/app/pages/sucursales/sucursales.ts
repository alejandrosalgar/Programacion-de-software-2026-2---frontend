import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { Sucursal, SucursalCreate, SucursalUpdate } from '../../models/sucursal.model';
import { SucursalService } from '../../services/sucursal.service';

type ModoPopup = 'crear' | 'editar';

@Component({
  selector: 'app-sucursales',
  imports: [FormsModule],
  templateUrl: './sucursales.html',
  styleUrl: './sucursales.css',
})
export class Sucursales implements OnInit {
  private readonly sucursalService = inject(SucursalService);

  readonly filas = signal<Sucursal[]>([]);
  readonly mensaje = signal('');
  readonly esError = signal(false);
  readonly cargando = signal(false);
  readonly popupAbierto = signal(false);
  readonly modo = signal<ModoPopup>('crear');

  idFiltro = '';
  formulario: SucursalCreate = this.formularioVacio();
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
    this.sucursalService.obtener(id).subscribe({
      next: (sucursal) => {
        this.filas.set([sucursal]);
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

  abrirEditar(sucursal: Sucursal): void {
    this.modo.set('editar');
    this.idEditando = sucursal.id_sucursal;
    this.formulario = {
      nombre: sucursal.nombre,
      direccion: sucursal.direccion,
      ciudad: sucursal.ciudad,
      telefono: sucursal.telefono,
      id_usuario_creacion: sucursal.id_usuario_creacion,
    };
    this.popupAbierto.set(true);
  }

  cerrarPopup(): void {
    this.popupAbierto.set(false);
  }

  guardar(): void {
    if (!this.formularioValido()) {
      this.avisar('Completa el nombre, la direccion, la ciudad y el telefono.', true);
      return;
    }

    this.cargando.set(true);
    if (this.modo() === 'crear') {
      this.sucursalService.crear(this.datosFormulario()).subscribe({
        next: () => this.despuesDeGuardar('Sucursal creada'),
        error: (error: HttpErrorResponse) => this.falloGuardar(error),
      });
      return;
    }

    this.sucursalService.actualizar(this.idEditando, this.datosEdicion()).subscribe({
      next: () => this.despuesDeGuardar('Sucursal actualizada'),
      error: (error: HttpErrorResponse) => this.falloGuardar(error),
    });
  }

  eliminar(sucursal: Sucursal): void {
    if (!confirm(`Eliminar la sucursal ${sucursal.nombre}?`)) {
      return;
    }

    this.cargando.set(true);
    this.sucursalService.eliminar(sucursal.id_sucursal).subscribe({
      next: () => {
        this.avisar('Sucursal eliminada');
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
    this.sucursalService.listar().subscribe({
      next: (respuesta) => {
        const filas = respuesta.data ?? [];
        this.filas.set(filas);
        this.avisar(filas.length ? '' : 'No hay sucursales');
        this.cargando.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.filas.set([]);
        const listaVacia = error.status === 404;
        this.avisar(listaVacia ? 'No hay sucursales' : this.textoError(error, true), !listaVacia);
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
      this.formulario.nombre.trim() &&
        this.formulario.direccion.trim() &&
        this.formulario.ciudad.trim() &&
        this.formulario.telefono.trim(),
    );
  }

  private datosFormulario(): SucursalCreate {
    return {
      nombre: this.formulario.nombre.trim(),
      direccion: this.formulario.direccion.trim(),
      ciudad: this.formulario.ciudad.trim(),
      telefono: this.formulario.telefono.trim(),
      id_usuario_creacion: this.formulario.id_usuario_creacion,
    };
  }

  private datosEdicion(): SucursalUpdate {
    return this.datosFormulario();
  }

  private formularioVacio(): SucursalCreate {
    return { nombre: '', direccion: '', ciudad: '', telefono: '' };
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
      return alListar ? 'No hay sucursales' : 'Sucursal no encontrada';
    }
    const detail = error.error?.detail;
    return typeof detail === 'string' ? detail : 'No se pudo completar la operacion';
  }
}