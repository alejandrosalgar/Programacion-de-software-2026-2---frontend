import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { Accion, AccionCreate, AccionUpdate } from '../../models/accion.model';
import { AccionService } from '../../services/accion.service';

type ModoPopup = 'crear' | 'editar';

interface AccionForm {
  id_usuario: string;
  tipo_accion: string;
  descripcion: string;
  ip_origen: string;
  resultado: string;
}

@Component({
  selector: 'app-acciones',
  imports: [FormsModule],
  templateUrl: './accion.html',
  styleUrl: './accion.css',
})
export class Acciones implements OnInit {
  private readonly accionService = inject(AccionService);

  readonly filas = signal<Accion[]>([]);
  readonly mensaje = signal('');
  readonly esError = signal(false);
  readonly cargando = signal(false);
  readonly popupAbierto = signal(false);
  readonly modo = signal<ModoPopup>('crear');

  idFiltro = '';
  formulario: AccionForm = this.formularioVacio();
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
    this.accionService.obtener(id).subscribe({
      next: (accion) => {
        this.filas.set([accion]);
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

  abrirEditar(fila: Accion): void {
    this.modo.set('editar');
    this.idEditando = fila.id_accion;
    this.formulario = {
      id_usuario: fila.id_usuario,
      tipo_accion: fila.tipo_accion,
      descripcion: fila.descripcion,
      ip_origen: fila.ip_origen ?? '',
      resultado: fila.resultado,
    };
    this.popupAbierto.set(true);
  }

  cerrarPopup(): void {
    this.popupAbierto.set(false);
  }

  guardar(): void {
    if (!this.formularioValido()) {
      this.avisar('Completa el tipo de accion, el resultado y, al crear, el UUID del usuario.', true);
      return;
    }

    this.cargando.set(true);
    if (this.modo() === 'crear') {
      this.accionService.crear(this.datosCreacion()).subscribe({
        next: () => this.despuesDeGuardar('Accion creada'),
        error: (error: HttpErrorResponse) => this.falloGuardar(error),
      });
      return;
    }

    this.accionService.actualizar(this.idEditando, this.datosEdicion()).subscribe({
      next: () => this.despuesDeGuardar('Accion actualizada'),
      error: (error: HttpErrorResponse) => this.falloGuardar(error),
    });
  }

  eliminar(fila: Accion): void {
    const confirmar = confirm(`Eliminar la accion ${fila.tipo_accion}?`);
    if (!confirmar) {
      return;
    }

    this.cargando.set(true);
    this.accionService.eliminar(fila.id_accion).subscribe({
      next: () => {
        this.avisar('Accion eliminada');
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
    this.accionService.listar().subscribe({
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
    const base = datos.tipo_accion.trim() && datos.resultado.trim();
    if (this.modo() === 'crear') {
      return Boolean(base && datos.id_usuario.trim());
    }
    return Boolean(base);
  }

  private datosCreacion(): AccionCreate {
    return {
      id_usuario: this.formulario.id_usuario.trim(),
      tipo_accion: this.formulario.tipo_accion.trim(),
      descripcion: this.formulario.descripcion.trim(),
      ip_origen: this.formulario.ip_origen.trim() || null,
      resultado: this.formulario.resultado.trim(),
    };
  }

  // AccionUpdate no incluye id_usuario: el usuario de una accion no se cambia
  private datosEdicion(): AccionUpdate {
    return {
      tipo_accion: this.formulario.tipo_accion.trim(),
      descripcion: this.formulario.descripcion.trim(),
      ip_origen: this.formulario.ip_origen.trim() || null,
      resultado: this.formulario.resultado.trim(),
    };
  }

  private formularioVacio(): AccionForm {
    return {
      id_usuario: '',
      tipo_accion: '',
      descripcion: '',
      ip_origen: '',
      resultado: 'Exito',
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
    if (error.status === 409) {
      return 'Ya existe una accion con esos datos';
    }
    if (error.status === 422) {
      return 'Revisa los datos. Los IDs tienen que ser UUID.';
    }
    const detail = error.error?.detail;
    if (typeof detail === 'string') {
      return detail;
    }
    return 'No se pudo completar la operacion';
  }
}

