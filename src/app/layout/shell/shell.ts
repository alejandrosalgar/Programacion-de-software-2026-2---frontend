import { Component, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-shell',
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './shell.html',
  styleUrl: './shell.css',
})
export class Shell {
  readonly menu = [
    { ruta: '/usuarios', etiqueta: 'Usuarios', icono: 'usuarios' },
    { ruta: '/cuenta', etiqueta: 'Cuentas', icono: 'cuentas' },
    { ruta: '/tarjetas', etiqueta: 'Tarjetas', icono: 'tarjetas' },
    { ruta: '/tipocuenta', etiqueta: 'Tipos de cuenta', icono: 'tipos' },
    { ruta: '/sedes', etiqueta: 'Sedes', icono: 'sedes' },
    { ruta: '/sucursales', etiqueta: 'Sucursales', icono: 'sucursales' },
    { ruta: '/empleados', etiqueta: 'Empleados', icono: 'empleados' },
    { ruta: '/cuotas', etiqueta: 'Cuotas', icono: 'cuotas' },
    { ruta: '/acciones', etiqueta: 'Acciones', icono: 'acciones' },
  ] as const;

  readonly contraido = signal(this.leerEstadoInicial());
  readonly drawerAbierto = signal(false);
  readonly avisoSesion = signal('');
  private avisoTimeout?: number;

  alternarSidebar(): void {
    this.contraido.update((contraido) => !contraido);
    try {
      localStorage.setItem('banco-itm-sidebar', this.contraido() ? 'contraido' : 'expandido');
    } catch {
      // El estado sigue funcionando aunque el navegador bloquee localStorage.
    }
  }

  alternarDrawer(): void {
    this.drawerAbierto.update((abierto) => !abierto);
  }

  cerrarDrawer(): void {
    this.drawerAbierto.set(false);
  }

  mostrarAvisoSesion(): void {
    this.avisoSesion.set('La autenticación todavía no está configurada en este proyecto.');
    window.clearTimeout(this.avisoTimeout);
    this.avisoTimeout = window.setTimeout(() => this.avisoSesion.set(''), 3500);
  }

  private leerEstadoInicial(): boolean {
    try {
      return typeof localStorage !== 'undefined' && localStorage.getItem('banco-itm-sidebar') === 'contraido';
    } catch {
      return false;
    }
  }
}

