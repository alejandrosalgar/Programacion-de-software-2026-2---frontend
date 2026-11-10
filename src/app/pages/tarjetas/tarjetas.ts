import { CurrencyPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { Tarjeta, TarjetaCreate, TarjetaUpdate } from '../../models/tarjeta.model';
import { TarjetaService } from '../../services/tarjeta.service';

type ModoFormulario = 'crear' | 'editar';

@Component({
  selector: 'app-tarjetas',
  imports: [FormsModule, CurrencyPipe],
  templateUrl: './tarjetas.html',
  styleUrl: './tarjetas.css',
})
export class Tarjetas implements OnInit {
  private readonly tarjetaService = inject(TarjetaService);

  readonly filas = signal<Tarjeta[]>([]);
  readonly mensaje = signal('');
  readonly esError = signal(false);
  readonly cargando = signal(false);
  readonly popupAbierto = signal(false);
  readonly modo = signal<ModoFormulario>('crear');

  idFiltro = '';
  formulario: TarjetaCreate = this.formularioVacio();
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
    this.tarjetaService.obtener(id).subscribe({
      next: (tarjeta) => {
        this.filas.set([tarjeta]);
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

  abrirEditar(tarjeta: Tarjeta): void {
    this.modo.set('editar');
    this.idEditando = tarjeta.id_tarjeta;
    this.formulario = {
      id_cuenta: tarjeta.id_cuenta,
      numero_tarjeta: tarjeta.numero_tarjeta,
      tipo_tarjeta: tarjeta.tipo_tarjeta,
      fecha_emision: tarjeta.fecha_emision,
      fecha_vencimiento: tarjeta.fecha_vencimiento,
      cvv: '',
      limite_credito: tarjeta.limite_credito,
      estado: tarjeta.estado,
      id_usuario_creacion: tarjeta.id_usuario_creacion,
    };
    this.popupAbierto.set(true);
  }

  cerrarPopup(): void {
    this.popupAbierto.set(false);
  }

  guardar(): void {
    if (!this.formularioValido()) {
      this.avisar('Completa los datos de la tarjeta y verifica sus fechas.', true);
      return;
    }

    this.cargando.set(true);
    if (this.modo() === 'crear') {
      this.tarjetaService.crear(this.datosFormulario()).subscribe({
        next: () => this.despuesDeGuardar('Tarjeta creada'),
        error: (error: HttpErrorResponse) => this.falloGuardar(error),
      });
      return;
    }

    this.tarjetaService.actualizar(this.idEditando, this.datosEdicion()).subscribe({
      next: () => this.despuesDeGuardar('Tarjeta actualizada'),
      error: (error: HttpErrorResponse) => this.falloGuardar(error),
    });
  }

  eliminar(tarjeta: Tarjeta): void {
    if (!confirm(`¿Eliminar la tarjeta terminada en ${tarjeta.numero_tarjeta.slice(-4)}?`)) return;

    this.cargando.set(true);
    this.tarjetaService.eliminar(tarjeta.id_tarjeta).subscribe({
      next: () => {
        this.avisar('Tarjeta eliminada');
        this.refrescar();
      },
      error: (error: HttpErrorResponse) => this.falloGuardar(error),
    });
  }

  numeroVisible(numero: string): string {
    return `•••• •••• •••• ${numero.slice(-4)}`;
  }

  private cargarTodos(): void {
    this.cargando.set(true);
    this.tarjetaService.listar().subscribe({
      next: (respuesta) => {
        this.filas.set(respuesta.data ?? []);
        if (this.esError()) this.avisar('');
        this.cargando.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.filas.set([]);
        if (error.status === 404) {
          this.cargando.set(false);
          return;
        }
        this.avisar(this.textoError(error, true), true);
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
    const base = Boolean(
      datos.id_cuenta.trim() &&
        datos.numero_tarjeta.trim() &&
        datos.tipo_tarjeta.trim() &&
        datos.fecha_emision &&
        datos.fecha_vencimiento &&
        datos.estado.trim() &&
        datos.id_usuario_creacion.trim() &&
        Number.isFinite(datos.limite_credito) &&
        datos.limite_credito >= 0,
    );
    const cvvValido = this.modo() === 'editar' && !datos.cvv.trim()
      ? true
      : /^\d{3,4}$/.test(datos.cvv.trim());
    return base && cvvValido && datos.fecha_vencimiento >= datos.fecha_emision;
  }

  private datosFormulario(): TarjetaCreate {
    return {
      ...this.formulario,
      id_cuenta: this.formulario.id_cuenta.trim(),
      numero_tarjeta: this.formulario.numero_tarjeta.trim(),
      tipo_tarjeta: this.formulario.tipo_tarjeta.trim(),
      cvv: this.formulario.cvv.trim(),
      estado: this.formulario.estado.trim(),
      id_usuario_creacion: this.formulario.id_usuario_creacion.trim(),
    };
  }

  private datosEdicion(): TarjetaUpdate {
    const { id_usuario_creacion: _idUsuarioCreacion, cvv, ...datos } = this.datosFormulario();
    return cvv ? { ...datos, cvv } : datos;
  }

  private formularioVacio(): TarjetaCreate {
    return {
      id_cuenta: '',
      numero_tarjeta: '',
      tipo_tarjeta: 'Debito',
      fecha_emision: '',
      fecha_vencimiento: '',
      cvv: '',
      limite_credito: 0,
      estado: 'Activa',
      id_usuario_creacion: '',
    };
  }

  private avisar(texto: string, error = false): void {
    this.mensaje.set(texto);
    this.esError.set(error && Boolean(texto));
  }

  private textoError(error: HttpErrorResponse, alListar: boolean): string {
    if (error.status === 0) return 'No se pudo conectar con la API del puerto 8000.';
    const detail = error.error?.detail;
    if (typeof detail === 'string') return detail;
    if (error.status === 404) return alListar ? 'No hay tarjetas registradas.' : 'Tarjeta no encontrada.';
    if (error.status === 409) return 'El número de tarjeta ya existe o una referencia no es válida.';
    if (error.status === 422) return 'Revisa los datos y que los identificadores tengan formato UUID.';
    return 'No se pudo completar la operación.';
  }
}