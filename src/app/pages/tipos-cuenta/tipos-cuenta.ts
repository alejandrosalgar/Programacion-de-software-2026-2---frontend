import { CurrencyPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { TipoCuenta, TipoCuentaCreate, TipoCuentaUpdate } from '../../models/tipo-cuenta.model';
import { TipoCuentaService } from '../../services/tipo-cuenta.service';

type ModoFormulario = 'crear' | 'editar';

@Component({
  selector: 'app-tipos-cuenta',
  imports: [FormsModule, CurrencyPipe],
  templateUrl: './tipos-cuenta.html',
  styleUrl: './tipos-cuenta.css',
})
export class TiposCuenta implements OnInit {
  private readonly tipoCuentaService = inject(TipoCuentaService);

  readonly filas = signal<TipoCuenta[]>([]);
  readonly mensaje = signal('');
  readonly esError = signal(false);
  readonly cargando = signal(false);
  readonly popupAbierto = signal(false);
  readonly modo = signal<ModoFormulario>('crear');

  idFiltro = '';
  idUsuarioEdicion = '';
  formulario: TipoCuentaCreate = this.formularioVacio();
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
      next: (tipo) => { this.filas.set([tipo]); this.avisar(''); this.cargando.set(false); },
      error: (error: HttpErrorResponse) => { this.filas.set([]); this.avisar(this.textoError(error, false), true); this.cargando.set(false); },
    });
  }

  limpiarFiltro(): void { this.idFiltro = ''; this.cargarTodos(); }

  abrirCrear(): void {
    this.modo.set('crear');
    this.idEditando = '';
    this.idUsuarioEdicion = '';
    this.formulario = this.formularioVacio();
    this.popupAbierto.set(true);
  }

  abrirEditar(tipo: TipoCuenta): void {
    this.modo.set('editar');
    this.idEditando = tipo.id_tipo_cuenta;
    this.idUsuarioEdicion = '';
    this.formulario = {
      nombre: tipo.nombre,
      descripcion: tipo.descripcion,
      tasa_interes: tipo.tasa_interes,
      monto_minimo_apertura: tipo.monto_minimo_apertura,
      requiere_mantenimiento: tipo.requiere_mantenimiento,
      estado: tipo.estado,
      id_usuario_creacion: tipo.id_usuario_creacion,
    };
    this.popupAbierto.set(true);
  }

  cerrarPopup(): void { this.popupAbierto.set(false); }

  guardar(): void {
    if (!this.formularioValido()) {
      this.avisar('Completa el nombre, las tasas, el monto mínimo y el ID del usuario.', true);
      return;
    }
    this.cargando.set(true);
    if (this.modo() === 'crear') {
      this.tipoCuentaService.crear(this.datosFormulario()).subscribe({
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

  eliminar(tipo: TipoCuenta): void {
    if (!confirm(`¿Eliminar el tipo de cuenta ${tipo.nombre}?`)) return;
    this.cargando.set(true);
    this.tipoCuentaService.eliminar(tipo.id_tipo_cuenta).subscribe({
      next: () => { this.avisar('Tipo de cuenta eliminado'); this.refrescar(); },
      error: (error: HttpErrorResponse) => this.falloGuardar(error),
    });
  }

  private cargarTodos(): void {
    this.cargando.set(true);
    this.tipoCuentaService.listar().subscribe({
      next: (respuesta) => {
        this.filas.set(respuesta.data ?? []);
        if (this.esError()) this.avisar('');
        this.cargando.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.filas.set([]);
        if (error.status !== 404) this.avisar(this.textoError(error, true), true);
        this.cargando.set(false);
      },
    });
  }

  private refrescar(): void { this.idFiltro.trim() ? this.buscarPorId() : this.cargarTodos(); }

  private despuesDeGuardar(texto: string): void { this.popupAbierto.set(false); this.avisar(texto); this.refrescar(); }

  private falloGuardar(error: HttpErrorResponse): void { this.avisar(this.textoError(error, false), true); this.cargando.set(false); }

  private formularioValido(): boolean {
    const datos = this.formulario;
    return Boolean(
      datos.nombre.trim() && datos.id_usuario_creacion.trim() &&
      Number.isFinite(datos.tasa_interes) && datos.tasa_interes >= 0 &&
      Number.isFinite(datos.monto_minimo_apertura) && datos.monto_minimo_apertura >= 0,
    );
  }

  private datosFormulario(): TipoCuentaCreate {
    return { ...this.formulario, nombre: this.formulario.nombre.trim(), descripcion: this.formulario.descripcion.trim(), estado: this.formulario.estado.trim(), id_usuario_creacion: this.formulario.id_usuario_creacion.trim() };
  }

  private datosEdicion(): TipoCuentaUpdate {
    const { id_usuario_creacion: _idUsuarioCreacion, ...datos } = this.datosFormulario();
    return this.idUsuarioEdicion.trim() ? { ...datos, id_usuario_edicion: this.idUsuarioEdicion.trim() } : datos;
  }

  private formularioVacio(): TipoCuentaCreate {
    return { nombre: '', descripcion: '', tasa_interes: 0, monto_minimo_apertura: 0, requiere_mantenimiento: false, estado: 'Activo', id_usuario_creacion: '' };
  }

  private avisar(texto: string, error = false): void { this.mensaje.set(texto); this.esError.set(error && Boolean(texto)); }

  private textoError(error: HttpErrorResponse, alListar: boolean): string {
    if (error.status === 0) return 'No se pudo conectar con la API del puerto 8000.';
    const detail = error.error?.detail;
    if (typeof detail === 'string') return detail;
    if (error.status === 404) return alListar ? 'No hay tipos de cuenta.' : 'Tipo de cuenta no encontrado.';
    if (error.status === 409) return 'Ya existe un tipo de cuenta con ese nombre o está asociado a cuentas.';
    if (error.status === 422) return 'Revisa los valores y que el identificador tenga formato UUID.';
    return 'No se pudo completar la operación.';
  }
}