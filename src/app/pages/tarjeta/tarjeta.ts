import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { Tarjeta, TarjetaCreate, TarjetaUpdate } from '../../models/tarjeta.model';
import { TarjetaService } from '../../services/tarjeta.service';

type ModoPopup = 'crear' | 'editar';

interface TarjetaForm {
  id_cuenta: string;
  numero_tarjeta: string;
  tipo_tarjeta: string;
  fecha_emision: string;
  fecha_vencimiento: string;
  cvv: string;
  limite_credito: number | null;
  estado: string;
}

@Component({
  selector: 'app-tarjetas',
  imports: [FormsModule],
  templateUrl: './tarjeta.html',
  styleUrl: './tarjeta.css',
})
export class Tarjetas implements OnInit {
  private readonly tarjetaService = inject(TarjetaService);

  readonly filas = signal<Tarjeta[]>([]);
  readonly mensaje = signal('');
  readonly esError = signal(false);
  readonly cargando = signal(false);
  readonly popupAbierto = signal(false);
  readonly modo = signal<ModoPopup>('crear');

  idFiltro = '';
  // UUID del usuario que crea o edita (id_usuario_creacion / id_usuario_edicion)
  idUsuario = '';
  formulario: TarjetaForm = this.formularioVacio();
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
    this.idUsuario = '';
    this.formulario = this.formularioVacio();
    this.popupAbierto.set(true);
  }

  abrirEditar(fila: Tarjeta): void {
    this.modo.set('editar');
    this.idEditando = fila.id_tarjeta;
    this.idUsuario = '';
    this.formulario = {
      id_cuenta: fila.id_cuenta,
      numero_tarjeta: fila.numero_tarjeta,
      tipo_tarjeta: fila.tipo_tarjeta,
      fecha_emision: fila.fecha_emision,
      fecha_vencimiento: fila.fecha_vencimiento,
      cvv: fila.cvv,
      limite_credito: fila.limite_credito,
      estado: fila.estado,
    };
    this.popupAbierto.set(true);
  }

  cerrarPopup(): void {
    this.popupAbierto.set(false);
  }

  guardar(): void {
    if (!this.formularioValido()) {
      this.avisar('Completa cuenta, numero, tipo, fechas, CVV, limite, estado y, al crear, el UUID del usuario.', true);
      return;
    }

    this.cargando.set(true);
    if (this.modo() === 'crear') {
      this.tarjetaService.crear(this.datosCreacion()).subscribe({
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

  eliminar(fila: Tarjeta): void {
    const confirmar = confirm(`Eliminar la tarjeta ${fila.numero_tarjeta}?`);
    if (!confirmar) {
      return;
    }

    this.cargando.set(true);
    this.tarjetaService.eliminar(fila.id_tarjeta).subscribe({
      next: () => {
        this.avisar('Tarjeta eliminada');
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
    this.tarjetaService.listar().subscribe({
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
      datos.id_cuenta.trim() &&
      datos.numero_tarjeta.trim() &&
      datos.tipo_tarjeta.trim() &&
      datos.fecha_emision &&
      datos.fecha_vencimiento &&
      datos.cvv.trim() &&
      datos.estado.trim() &&
      datos.limite_credito !== null;
    if (this.modo() === 'crear') {
      return Boolean(base && this.idUsuario.trim());
    }
    return Boolean(base);
  }

  private datosCreacion(): TarjetaCreate {
    return {
      id_cuenta: this.formulario.id_cuenta.trim(),
      numero_tarjeta: this.formulario.numero_tarjeta.trim(),
      tipo_tarjeta: this.formulario.tipo_tarjeta.trim(),
      fecha_emision: this.formulario.fecha_emision,
      fecha_vencimiento: this.formulario.fecha_vencimiento,
      cvv: this.formulario.cvv.trim(),
      limite_credito: Number(this.formulario.limite_credito),
      estado: this.formulario.estado.trim(),
      id_usuario_creacion: this.idUsuario.trim(),
    };
  }

  // TarjetaUpdate no incluye fecha_emision: no se modifica al editar
  private datosEdicion(): TarjetaUpdate {
    const datos: TarjetaUpdate = {
      id_cuenta: this.formulario.id_cuenta.trim(),
      numero_tarjeta: this.formulario.numero_tarjeta.trim(),
      tipo_tarjeta: this.formulario.tipo_tarjeta.trim(),
      fecha_vencimiento: this.formulario.fecha_vencimiento,
      cvv: this.formulario.cvv.trim(),
      limite_credito: Number(this.formulario.limite_credito),
      estado: this.formulario.estado.trim(),
    };
    if (this.idUsuario.trim()) {
      datos.id_usuario_edicion = this.idUsuario.trim();
    }
    return datos;
  }

  private formularioVacio(): TarjetaForm {
    return {
      id_cuenta: '',
      numero_tarjeta: '',
      tipo_tarjeta: '',
      fecha_emision: '',
      fecha_vencimiento: '',
      cvv: '',
      limite_credito: null,
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
      return alListar ? 'No hay registros' : 'No encontrado';
    }
    if (error.status === 409) {
      return 'Ya existe una tarjeta con ese numero';
    }
    if (error.status === 422) {
      return 'Revisa los datos. Los IDs tienen que ser UUID y las fechas AAAA-MM-DD.';
    }
    const detail = error.error?.detail;
    if (typeof detail === 'string') {
      return detail;
    }
    return 'No se pudo completar la operacion';
  }
}

