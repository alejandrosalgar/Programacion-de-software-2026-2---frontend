import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { Cuenta, CuentaCreate, CuentaUpdate } from '../../models/cuenta.model';
import { CuentaService } from '../../services/cuenta.service';

type ModoPopup = 'crear' | 'editar';

@Component({
  selector: 'app-cuenta',
  imports: [FormsModule],
  templateUrl: './cuentas.html',
  styleUrl: './cuentas.css',
})
export class Cuentas implements OnInit {
  private readonly cuentaService = inject(CuentaService);

  readonly filas = signal<Cuenta[]>([]);
  readonly mensaje = signal('');
  readonly esError = signal(false);
  readonly cargando = signal(false);
  readonly popupAbierto = signal(false);
  readonly modo = signal<ModoPopup>('crear');

  idFiltro = '';
  formulario: CuentaCreate = this.formularioVacio();
  idUsuarioEdicion = '';
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
    this.cuentaService.obtener(id).subscribe({
      next: (cuenta) => {
        this.filas.set([cuenta]);
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
    this.idUsuarioEdicion = '';
    this.formulario = this.formularioVacio();
    this.popupAbierto.set(true);
  }

  abrirEditar(cuenta: Cuenta): void {
    this.modo.set('editar');
    this.idEditando = cuenta.id_cuenta;
    this.formulario = {
      numero_cuenta: cuenta.numero_cuenta,
      id_usuario: cuenta.id_usuario,
      id_usuario_creacion: cuenta.id_usuario_creacion,
      id_tipo_cuenta: cuenta.id_tipo_cuenta,
      saldo: cuenta.saldo,
      estado: cuenta.estado,
    };
    this.idUsuarioEdicion = '';
    this.popupAbierto.set(true);
  }

  cerrarPopup(): void {
    this.popupAbierto.set(false);
  }

  guardar(): void {
    if (!this.formularioValido()) {
      this.avisar('Completa los datos requeridos y verifica los UUID.', true);
      return;
    }

    this.cargando.set(true);
    if (this.modo() === 'crear') {
      this.cuentaService.crear(this.datosCreacion()).subscribe({
        next: () => this.despuesDeGuardar('Cuenta creada'),
        error: (error: HttpErrorResponse) => this.falloGuardar(error),
      });
      return;
    }

    this.cuentaService.actualizar(this.idEditando, this.datosEdicion()).subscribe({
      next: () => this.despuesDeGuardar('Cuenta actualizada'),
      error: (error: HttpErrorResponse) => this.falloGuardar(error),
    });
  }

  eliminar(cuenta: Cuenta): void {
    const confirmar = confirm(`Eliminar la cuenta ${cuenta.numero_cuenta}?`);
    if (!confirmar) {
      return;
    }

    this.cargando.set(true);
    this.cuentaService.eliminar(cuenta.id_cuenta).subscribe({
      next: () => {
        this.avisar('Cuenta eliminada');
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
    this.cuentaService.listar().subscribe({
      next: (respuesta) => {
        const filas = respuesta.data ?? [];
        this.filas.set(filas);
        this.avisar(filas.length ? '' : 'No hay cuentas');
        this.cargando.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.filas.set([]);
        const listaVacia = error.status === 404;
        this.avisar(listaVacia ? 'No hay cuentas' : this.textoError(error, true), !listaVacia);
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
      datos.numero_cuenta.trim() &&
      datos.id_usuario.trim() &&
      datos.id_usuario_creacion.trim() &&
      (datos.saldo ?? 0) >= 0;
    if (this.modo() === 'crear') {
      return Boolean(base);
    }
    return Boolean(base && this.idUsuarioEdicion.trim());
  }

  private datosCreacion(): CuentaCreate {
    return {
      numero_cuenta: this.formulario.numero_cuenta.trim(),
      id_usuario: this.formulario.id_usuario.trim(),
      id_usuario_creacion: this.formulario.id_usuario_creacion.trim(),
      id_tipo_cuenta: this.formulario.id_tipo_cuenta?.trim() || null,
      saldo: this.formulario.saldo ?? 0,
      estado: this.formulario.estado?.trim() || 'Activa',
    };
  }

  private datosEdicion(): CuentaUpdate {
    return {
      numero_cuenta: this.formulario.numero_cuenta.trim(),
      id_usuario: this.formulario.id_usuario.trim(),
      id_usuario_edicion: this.idUsuarioEdicion.trim(),
      id_tipo_cuenta: this.formulario.id_tipo_cuenta?.trim() || null,
      saldo: this.formulario.saldo ?? 0,
      estado: this.formulario.estado?.trim() || 'Activa',
    };
  }

  private formularioVacio(): CuentaCreate {
    return {
      numero_cuenta: '',
      id_usuario: '',
      id_usuario_creacion: '',
      id_tipo_cuenta: null,
      saldo: 0,
      estado: 'Activa',
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
      return alListar ? 'No hay cuentas' : 'Cuenta no encontrada';
    }
    if (error.status === 409) {
      return 'Ese numero de cuenta ya existe';
    }
    if (error.status === 422) {
      return 'Revisa los datos y que los identificadores tengan formato UUID.';
    }
    const detail = error.error?.detail;
    if (typeof detail === 'string') {
      return detail;
    }
    return 'No se pudo completar la operacion';
  }
}
