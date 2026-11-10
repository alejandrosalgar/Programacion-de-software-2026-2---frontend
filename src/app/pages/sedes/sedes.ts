import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { Sede, SedeCreate, SedeUpdate } from '../../models/sede.model';
import { SedeService } from '../../services/sede.service';

type ModoPopup = 'crear' | 'editar';

interface SedeForm {
  nombre: string;
  direccion: string;
  ciudad: string;
  telefono: string;
}

@Component({
  selector: 'app-sedes',
  imports: [FormsModule],
  templateUrl: './sedes.html',
})
export class Sedes implements OnInit {
  private readonly sedeService = inject(SedeService);

  readonly filas = signal<Sede[]>([]);
  readonly mensaje = signal('');
  readonly esError = signal(false);
  readonly cargando = signal(false);
  readonly popupAbierto = signal(false);
  readonly modo = signal<ModoPopup>('crear');

  idFiltro = '';
  // UUID del usuario que crea o edita (id_usuario_creacion / id_usuario_edicion)
  idUsuarioAccion = '';
  formulario: SedeForm = this.formularioVacio();
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
    this.sedeService.obtener(id).subscribe({
      next: (sede) => {
        this.filas.set([sede]);
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

  abrirEditar(fila: Sede): void {
    this.modo.set('editar');
    this.idEditando = fila.id_sede;
    this.idUsuarioAccion = '';
    this.formulario = {
      nombre: fila.nombre,
      direccion: fila.direccion,
      ciudad: fila.ciudad,
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
        'Completa nombre, direccion, ciudad, telefono y, al crear, el UUID del usuario que crea.',
        true,
      );
      return;
    }

    this.cargando.set(true);
    if (this.modo() === 'crear') {
      this.sedeService.crear(this.datosCreacion()).subscribe({
        next: () => this.despuesDeGuardar('Sede creada'),
        error: (error: HttpErrorResponse) => this.falloGuardar(error),
      });
      return;
    }

    this.sedeService.actualizar(this.idEditando, this.datosEdicion()).subscribe({
      next: () => this.despuesDeGuardar('Sede actualizada'),
      error: (error: HttpErrorResponse) => this.falloGuardar(error),
    });
  }

  eliminar(fila: Sede): void {
    const confirmar = confirm(`Eliminar la sede ${fila.nombre}?`);
    if (!confirmar) {
      return;
    }

    this.cargando.set(true);
    this.sedeService.eliminar(fila.id_sede).subscribe({
      next: () => {
        this.avisar('Sede eliminada');
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
    this.sedeService.listar().subscribe({
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
      datos.nombre.trim() &&
      datos.direccion.trim() &&
      datos.ciudad.trim() &&
      datos.telefono.trim();
    if (this.modo() === 'crear') {
      return Boolean(base && this.idUsuarioAccion.trim());
    }
    return Boolean(base);
  }

  private datosCreacion(): SedeCreate {
    return {
      nombre: this.formulario.nombre.trim(),
      direccion: this.formulario.direccion.trim(),
      ciudad: this.formulario.ciudad.trim(),
      telefono: this.formulario.telefono.trim(),
      id_usuario_creacion: this.idUsuarioAccion.trim(),
    };
  }

  private datosEdicion(): SedeUpdate {
    const datos: SedeUpdate = {
      nombre: this.formulario.nombre.trim(),
      direccion: this.formulario.direccion.trim(),
      ciudad: this.formulario.ciudad.trim(),
      telefono: this.formulario.telefono.trim(),
    };
    if (this.idUsuarioAccion.trim()) {
      datos.id_usuario_edicion = this.idUsuarioAccion.trim();
    }
    return datos;
  }

  private formularioVacio(): SedeForm {
    return {
      nombre: '',
      direccion: '',
      ciudad: '',
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
