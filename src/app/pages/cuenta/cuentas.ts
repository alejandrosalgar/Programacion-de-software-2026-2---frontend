import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { Cuenta, CuentaCreate, CuentaUpdate } from '../../models/cuenta.model';
import { CuentaService } from '../../services/cuenta.service';

type ModoPopup = 'crear' | 'editar';

interface CuentaForm {
  numero_cuenta: string;
  id_tipo_cuenta: string;
  id_usuario: string;
  saldo: number | null;
  estado: string;
  fecha_apertura: string;
}

@Component({
  selector: 'app-cuentas',
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
  // UUID del usuario que crea o edita (id_usuario_creacion / id_usuario_edicion)
  idUsuarioAccion = '';
  formulario: CuentaForm = this.formularioVacio();
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
    this.idUsuarioAccion = '';
    this.formulario = this.formularioVacio();
    this.popupAbierto.set(true);
  }

  abrirEditar(fila: Cuenta): void {
    this.modo.set('editar');
    this.idEditando = fila.id_cuenta;
    this.idUsuarioAccion = '';
    this.formulario = {
      numero_cuenta: fila.numero_cuenta,
      id_tipo_cuenta: fila.id_tipo_cuenta ?? '',
      id_usuario: fila.id_usuario,
      saldo: fila.saldo,
      estado: fila.estado,
      fecha_apertura: fila.fecha_apertura,
    };
    this.popupAbierto.set(true);
  }

  cerrarPopup(): void {
    this.popupAbierto.set(false);
  }

  guardar(): void {
    if (!this.formularioValido()) {
      this.avisar(
        'Completa saldo, estado y, al crear, el titular y el UUID del usuario que crea.',
        true,
      );
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

  eliminar(fila: Cuenta): void {
    const confirmar = confirm(`Eliminar la cuenta ${fila.numero_cuenta}?`);
    if (!confirmar) {
      return;
    }

    this.cargando.set(true);
    this.cuentaService.eliminar(fila.id_cuenta).subscribe({
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
    const base = datos.estado.trim() && datos.saldo !== null;
    if (this.modo() === 'crear') {
      return Boolean(base && datos.id_usuario.trim() && this.idUsuarioAccion.trim());
    }
    return Boolean(base && datos.numero_cuenta.trim());
  }

  private datosCreacion(): CuentaCreate {
    const datos: CuentaCreate = {
      id_tipo_cuenta: this.formulario.id_tipo_cuenta.trim() || null,
      id_usuario: this.formulario.id_usuario.trim(),
      saldo: Number(this.formulario.saldo),
      estado: this.formulario.estado.trim(),
      id_usuario_creacion: this.idUsuarioAccion.trim(),
    };
    const numero = this.formulario.numero_cuenta.trim();
    if (numero) {
      datos.numero_cuenta = numero;
    }
    if (this.formulario.fecha_apertura) {
      datos.fecha_apertura = this.formulario.fecha_apertura;
    }
    return datos;
  }

  // CuentaUpdate no incluye id_usuario ni fecha_apertura: no se modifican al editar
  private datosEdicion(): CuentaUpdate {
    const datos: CuentaUpdate = {
      numero_cuenta: this.formulario.numero_cuenta.trim(),
      id_tipo_cuenta: this.formulario.id_tipo_cuenta.trim() || null,
      saldo: Number(this.formulario.saldo),
      estado: this.formulario.estado.trim(),
    };
    if (this.idUsuarioAccion.trim()) {
      datos.id_usuario_edicion = this.idUsuarioAccion.trim();
    }
    return datos;
  }

  private formularioVacio(): CuentaForm {
    return {
      numero_cuenta: '',
      id_tipo_cuenta: '',
      id_usuario: '',
      saldo: 0,
      estado: 'Activa',
      fecha_apertura: '',
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

