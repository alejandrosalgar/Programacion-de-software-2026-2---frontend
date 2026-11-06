import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import {
  TipoCuenta,
  TipoCuentaCreate,
  TipoCuentaUpdate,
} from '../../models/tipocuenta.model';
import { TipoCuentaService } from '../../services/tipocuenta.service';

type ModoPopup = 'crear' | 'editar';

interface TipoCuentaForm {
  nombre: string;
  descripcion: string;
  tasa_interes: number | null;
  monto_minimo_apertura: number | null;
  requiere_mantenimiento: boolean;
  estado: string;
}

@Component({
  selector: 'app-tipo-cuenta',
  imports: [FormsModule],
  templateUrl: './tipocuenta.html',
  styleUrl: './tipocuenta.css',
})
export class TiposCuenta implements OnInit {
  private readonly tipoCuentaService = inject(TipoCuentaService);

  readonly filas = signal<TipoCuenta[]>([]);
  readonly mensaje = signal('');
  readonly esError = signal(false);
  readonly cargando = signal(false);
  readonly popupAbierto = signal(false);
  readonly modo = signal<ModoPopup>('crear');

  idFiltro = '';
  // UUID del usuario que crea o edita (id_usuario_creacion / id_usuario_edicion)
  idUsuario = '';
  formulario: TipoCuentaForm = this.formularioVacio();
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
    this.tipoCuentaService.obtener(id).subscribe({
      next: (tipo) => {
        this.filas.set([tipo]);
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
    this.idUsuario = '';
    this.formulario = this.formularioVacio();
    this.popupAbierto.set(true);
  }

  abrirEditar(fila: TipoCuenta): void {
    this.modo.set('editar');
    this.idEditando = fila.id_tipo_cuenta;
    this.idUsuario = '';
    this.formulario = {
      nombre: fila.nombre,
      descripcion: fila.descripcion,
      tasa_interes: fila.tasa_interes,
      monto_minimo_apertura: fila.monto_minimo_apertura,
      requiere_mantenimiento: fila.requiere_mantenimiento,
      estado: fila.estado,
    };
    this.popupAbierto.set(true);
  }

  cerrarPopup(): void {
    this.popupAbierto.set(false);
  }

  guardar(): void {
    if (!this.formularioValido()) {
      this.avisar(
        'Completa nombre, tasa, monto minimo, estado y, al crear, el UUID del usuario.',
        true,
      );
      return;
    }

    this.cargando.set(true);
    if (this.modo() === 'crear') {
      this.tipoCuentaService.crear(this.datosCreacion()).subscribe({
        next: () => this.despuesDeGuardar('Tipo de cuenta creado'),
        error: (error: HttpErrorResponse) => this.falloGuardar(error),
      });
      return;
    }

    this.tipoCuentaService.actualizar(this.idEditando, this.datosEdicion()).subscribe({
      next: () => this.despuesDeGuardar('Tipo de cuenta actualizado'),
      error: (error: HttpErrorResponse) => this.falloGuardar(error),
    });
  }

  eliminar(fila: TipoCuenta): void {
    const confirmar = confirm(`Eliminar el tipo de cuenta ${fila.nombre}?`);
    if (!confirmar) {
      return;
    }

    this.cargando.set(true);
    this.tipoCuentaService.eliminar(fila.id_tipo_cuenta).subscribe({
      next: () => {
        this.avisar('Tipo de cuenta eliminado');
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
    this.tipoCuentaService.listar().subscribe({
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
      datos.estado.trim() &&
      datos.tasa_interes !== null &&
      datos.monto_minimo_apertura !== null;
    if (this.modo() === 'crear') {
      return Boolean(base && this.idUsuario.trim());
    }
    return Boolean(base);
  }

  private datosCreacion(): TipoCuentaCreate {
    return {
      nombre: this.formulario.nombre.trim(),
      descripcion: this.formulario.descripcion.trim(),
      tasa_interes: Number(this.formulario.tasa_interes),
      monto_minimo_apertura: Number(this.formulario.monto_minimo_apertura),
      requiere_mantenimiento: this.formulario.requiere_mantenimiento,
      estado: this.formulario.estado.trim(),
      id_usuario_creacion: this.idUsuario.trim(),
    };
  }

  private datosEdicion(): TipoCuentaUpdate {
    const datos: TipoCuentaUpdate = {
      nombre: this.formulario.nombre.trim(),
      descripcion: this.formulario.descripcion.trim(),
      tasa_interes: Number(this.formulario.tasa_interes),
      monto_minimo_apertura: Number(this.formulario.monto_minimo_apertura),
      requiere_mantenimiento: this.formulario.requiere_mantenimiento,
      estado: this.formulario.estado.trim(),
    };
    if (this.idUsuario.trim()) {
      datos.id_usuario_edicion = this.idUsuario.trim();
    }
    return datos;
  }

  private formularioVacio(): TipoCuentaForm {
    return {
      nombre: '',
      descripcion: '',
      tasa_interes: null,
      monto_minimo_apertura: null,
      requiere_mantenimiento: false,
      estado: 'Activo',
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
      return 'Ya existe un tipo de cuenta con ese nombre';
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


