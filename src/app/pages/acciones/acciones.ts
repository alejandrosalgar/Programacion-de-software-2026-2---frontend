import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { Accion, AccionCreate, AccionUpdate } from '../../models/accion.model';
import { AccionService } from '../../services/accion.service';

type ModoFormulario = 'crear' | 'editar';

@Component({
  selector: 'app-acciones',
  imports: [FormsModule],
  templateUrl: './acciones.html',
  styleUrl: './acciones.css',
})
export class Acciones implements OnInit {
  private readonly accionService = inject(AccionService);

  readonly filas = signal<Accion[]>([]);
  readonly mensaje = signal('');
  readonly esError = signal(false);
  readonly cargando = signal(false);
  readonly popupAbierto = signal(false);
  readonly modo = signal<ModoFormulario>('crear');

  idUsuarioFiltro = '';
  formulario: AccionCreate = this.formularioVacio();
  private idEditando = '';

  ngOnInit(): void { this.cargarTodos(); }

  buscarPorUsuario(): void {
    const idUsuario = this.idUsuarioFiltro.trim();
    if (!idUsuario) { this.cargarTodos(); return; }
    this.cargando.set(true);
    this.accionService.listarPorUsuario(idUsuario).subscribe({
      next: (respuesta) => { this.filas.set(respuesta.data ?? []); this.avisar(''); this.cargando.set(false); },
      error: (error: HttpErrorResponse) => { this.filas.set([]); this.avisar(this.textoError(error), true); this.cargando.set(false); },
    });
  }

  limpiarFiltro(): void { this.idUsuarioFiltro = ''; this.cargarTodos(); }

  abrirCrear(): void {
    this.modo.set('crear');
    this.idEditando = '';
    this.formulario = this.formularioVacio();
    this.popupAbierto.set(true);
  }

  abrirEditar(accion: Accion): void {
    this.modo.set('editar');
    this.idEditando = accion.id_accion;
    this.formulario = { id_usuario: accion.id_usuario, tipo_accion: accion.tipo_accion, descripcion: accion.descripcion, ip_origen: accion.ip_origen, resultado: accion.resultado };
    this.popupAbierto.set(true);
  }

  cerrarPopup(): void { this.popupAbierto.set(false); }

  guardar(): void {
    if (!this.formularioValido()) { this.avisar('Indica el usuario y el tipo de acción.', true); return; }
    this.cargando.set(true);
    if (this.modo() === 'crear') {
      this.accionService.crear(this.datosFormulario()).subscribe({
        next: () => this.despuesDeGuardar('Acción registrada'),
        error: (error: HttpErrorResponse) => this.falloGuardar(error),
      });
      return;
    }
    this.accionService.actualizar(this.idEditando, this.datosEdicion()).subscribe({
      next: () => this.despuesDeGuardar('Acción actualizada'),
      error: (error: HttpErrorResponse) => this.falloGuardar(error),
    });
  }

  eliminar(accion: Accion): void {
    if (!confirm(`¿Eliminar el registro de acción “${accion.tipo_accion}”?`)) return;
    this.cargando.set(true);
    this.accionService.eliminar(accion.id_accion).subscribe({
      next: () => { this.avisar('Registro eliminado'); this.refrescar(); },
      error: (error: HttpErrorResponse) => this.falloGuardar(error),
    });
  }

  private cargarTodos(): void {
    this.cargando.set(true);
    this.accionService.listar().subscribe({
      next: (respuesta) => {
        this.filas.set(respuesta.data ?? []);
        if (this.esError()) this.avisar('');
        this.cargando.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.filas.set([]);
        if (error.status !== 404) this.avisar(this.textoError(error), true);
        this.cargando.set(false);
      },
    });
  }

  private refrescar(): void { this.idUsuarioFiltro.trim() ? this.buscarPorUsuario() : this.cargarTodos(); }

  private despuesDeGuardar(texto: string): void { this.popupAbierto.set(false); this.avisar(texto); this.refrescar(); }

  private falloGuardar(error: HttpErrorResponse): void { this.avisar(this.textoError(error), true); this.cargando.set(false); }

  private formularioValido(): boolean { return Boolean(this.formulario.id_usuario.trim() && this.formulario.tipo_accion.trim()); }

  private datosFormulario(): AccionCreate {
    return { ...this.formulario, id_usuario: this.formulario.id_usuario.trim(), tipo_accion: this.formulario.tipo_accion.trim(), descripcion: this.formulario.descripcion.trim(), ip_origen: this.formulario.ip_origen?.trim() || null, resultado: this.formulario.resultado.trim() };
  }

  private datosEdicion(): AccionUpdate {
    const { id_usuario: _idUsuario, ...datos } = this.datosFormulario();
    return datos;
  }

  private formularioVacio(): AccionCreate { return { id_usuario: '', tipo_accion: '', descripcion: '', ip_origen: null, resultado: 'Exito' }; }

  private avisar(texto: string, error = false): void { this.mensaje.set(texto); this.esError.set(error && Boolean(texto)); }

  private textoError(error: HttpErrorResponse): string {
    if (error.status === 0) return 'No se pudo conectar con la API del puerto 8000.';
    const detail = error.error?.detail;
    if (typeof detail === 'string') return detail;
    if (error.status === 404) return 'No se encontró el registro o el usuario no tiene acciones.';
    if (error.status === 409) return 'No se pudo guardar; confirma que el usuario exista.';
    if (error.status === 422) return 'El identificador debe tener formato UUID.';
    return 'No se pudo completar la operación.';
  }
}