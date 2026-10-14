import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { Usuario, UsuarioCreate, UsuarioUpdate } from '../../models/usuario.model';
import { UsuarioService } from '../../services/usuario.service';

type ModoPopup = 'crear' | 'editar';

@Component({
  selector: 'app-usuarios',
  imports: [FormsModule],
  templateUrl: './usuarios.html',
  styleUrl: './usuarios.css',
})
export class Usuarios implements OnInit {
  private readonly usuarioService = inject(UsuarioService);

  readonly filas = signal<Usuario[]>([]);
  readonly mensaje = signal('');
  readonly esError = signal(false);
  readonly cargando = signal(false);
  readonly popupAbierto = signal(false);
  readonly modo = signal<ModoPopup>('crear');

  idFiltro = '';
  formulario: UsuarioCreate = this.formularioVacio();
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
    this.usuarioService.obtener(id).subscribe({
      next: (usuario) => {
        this.filas.set([usuario]);
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

  abrirEditar(fila: Usuario): void {
    this.modo.set('editar');
    this.idEditando = fila.id_usuario;
    this.formulario = {
      primer_nombre: fila.primer_nombre,
      segundo_nombre: fila.segundo_nombre,
      primer_apellido: fila.primer_apellido,
      segundo_apellido: fila.segundo_apellido,
      nombre_usuario: fila.nombre_usuario,
      clave: '',
    };
    this.popupAbierto.set(true);
  }

  cerrarPopup(): void {
    this.popupAbierto.set(false);
  }

  guardar(): void {
    if (!this.formularioValido()) {
      this.avisar('Completa nombre, apellido, usuario y, al crear, la clave.', true);
      return;
    }

    this.cargando.set(true);
    if (this.modo() === 'crear') {
      this.usuarioService.crear(this.formulario).subscribe({
        next: () => this.despuesDeGuardar('Usuario creado'),
        error: (error: HttpErrorResponse) => this.falloGuardar(error),
      });
      return;
    }

    this.usuarioService.actualizar(this.idEditando, this.datosEdicion()).subscribe({
      next: () => this.despuesDeGuardar('Usuario actualizado'),
      error: (error: HttpErrorResponse) => this.falloGuardar(error),
    });
  }

  eliminar(fila: Usuario): void {
    const confirmar = confirm(`Eliminar a ${fila.nombre_usuario}?`);
    if (!confirmar) {
      return;
    }

    this.cargando.set(true);
    this.usuarioService.eliminar(fila.id_usuario).subscribe({
      next: () => {
        this.avisar('Usuario eliminado');
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
    this.usuarioService.listar().subscribe({
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
      datos.primer_nombre.trim() &&
      datos.primer_apellido.trim() &&
      datos.nombre_usuario.trim();
    if (this.modo() === 'crear') {
      return Boolean(base && datos.clave.trim());
    }
    return Boolean(base);
  }

  private datosEdicion(): UsuarioUpdate {
    const datos: UsuarioUpdate = {
      primer_nombre: this.formulario.primer_nombre.trim(),
      segundo_nombre: this.formulario.segundo_nombre.trim(),
      primer_apellido: this.formulario.primer_apellido.trim(),
      segundo_apellido: this.formulario.segundo_apellido.trim(),
      nombre_usuario: this.formulario.nombre_usuario.trim(),
    };
    if (this.formulario.clave.trim()) {
      datos.clave = this.formulario.clave;
    }
    return datos;
  }

  private formularioVacio(): UsuarioCreate {
    return {
      primer_nombre: '',
      segundo_nombre: '',
      primer_apellido: '',
      segundo_apellido: '',
      nombre_usuario: '',
      clave: '',
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
      return 'Ese nombre de usuario ya existe';
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
