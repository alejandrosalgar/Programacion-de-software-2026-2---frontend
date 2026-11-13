import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { Tarjeta, TarjetaCreate, TarjetaUpdate } from '../../models/tarjeta.model';
import { GenericService } from '../../services/generic.service';

type ModoPopup = 'crear' | 'editar';

@Component({
  selector: 'app-tarjetas',
  imports: [FormsModule],
  templateUrl: './tarjetas.html',
  styleUrl: './tarjetas.css',
})
export class Tarjetas implements OnInit {
  private readonly tarjetaService = new GenericService<Tarjeta, TarjetaCreate, TarjetaUpdate>(
    inject(HttpClient),
    'tarjetas',
  );

  readonly filas = signal<Tarjeta[]>([]);
  readonly mensaje = signal('');
  readonly esError = signal(false);
  readonly cargando = signal(false);
  readonly popupAbierto = signal(false);
  readonly modo = signal<ModoPopup>('crear');

  idFiltro = '';
  idUsuarioEdicion = '';
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
    this.idUsuarioEdicion = '';
    this.formulario = this.formularioVacio();
    this.popupAbierto.set(true);
  }

  abrirEditar(fila: Tarjeta): void {
    this.modo.set('editar');
    this.idEditando = fila.id_tarjeta;
    this.idUsuarioEdicion = '';
    this.formulario = {
      id_cuenta: fila.id_cuenta,
      numero_tarjeta: fila.numero_tarjeta,
      tipo_tarjeta: fila.tipo_tarjeta,
      fecha_emision: fila.fecha_emision.slice(0, 10),
      fecha_vencimiento: fila.fecha_vencimiento.slice(0, 10),
      cvv: fila.cvv,
      limite_credito: fila.limite_credito,
      estado: fila.estado,
      id_usuario_creacion: fila.id_usuario_creacion,
    };
    this.popupAbierto.set(true);
  }

  cerrarPopup(): void {
    this.popupAbierto.set(false);
  }

  guardar(): void {
    if (!this.formularioValido()) {
      this.avisar(
        'Completa cuenta, numero, tipo, fechas, CVV, limite, estado y, al crear, el usuario de creacion.',
        true,
      );
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
    const limite = Number(datos.limite_credito);
    const base =
      datos.id_cuenta.trim() &&
      datos.numero_tarjeta.trim() &&
      datos.tipo_tarjeta.trim() &&
      datos.fecha_emision &&
      datos.fecha_vencimiento &&
      datos.cvv.trim() &&
      datos.estado.trim() &&
      !Number.isNaN(limite);
    if (this.modo() === 'crear') {
      return Boolean(base && datos.id_usuario_creacion.trim());
    }
    return Boolean(base);
  }

  private datosCreacion(): TarjetaCreate {
    const datos = this.formulario;
    return {
      id_cuenta: datos.id_cuenta.trim(),
      numero_tarjeta: datos.numero_tarjeta.trim(),
      tipo_tarjeta: datos.tipo_tarjeta.trim(),
      fecha_emision: datos.fecha_emision,
      fecha_vencimiento: datos.fecha_vencimiento,
      cvv: datos.cvv.trim(),
      limite_credito: Number(datos.limite_credito),
      estado: datos.estado.trim(),
      id_usuario_creacion: datos.id_usuario_creacion.trim(),
    };
  }

  private datosEdicion(): TarjetaUpdate {
    const datos = this.formulario;
    const cambios: TarjetaUpdate = {
      id_cuenta: datos.id_cuenta.trim(),
      numero_tarjeta: datos.numero_tarjeta.trim(),
      tipo_tarjeta: datos.tipo_tarjeta.trim(),
      fecha_emision: datos.fecha_emision,
      fecha_vencimiento: datos.fecha_vencimiento,
      cvv: datos.cvv.trim(),
      limite_credito: Number(datos.limite_credito),
      estado: datos.estado.trim(),
    };
    if (this.idUsuarioEdicion.trim()) {
      cambios.id_usuario_edicion = this.idUsuarioEdicion.trim();
    }
    return cambios;
  }

  private formularioVacio(): TarjetaCreate {
    return {
      id_cuenta: '',
      numero_tarjeta: '',
      tipo_tarjeta: '',
      fecha_emision: '',
      fecha_vencimiento: '',
      cvv: '',
      limite_credito: 0,
      estado: '',
      id_usuario_creacion: '',
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
      return 'Ese numero de tarjeta ya existe';
    }
    if (error.status === 422) {
      return 'Revisa los datos. El filtro por ID tiene que ser un UUID.';
    }
    const detail = error.error?.detail;
    if (typeof detail === 'string') {
      return detail;
    }
    return 'No se pudo completar la operacion';
  }
}
