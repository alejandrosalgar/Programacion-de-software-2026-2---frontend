import { Component, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-shell',
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './shell.html',
  styleUrl: './shell.css',
})
export class Shell {
  readonly retraido = signal(false);

  readonly menu = [
    { ruta: '/usuarios', etiqueta: 'Usuarios', sigla: 'U' },
    { ruta: '/cuentas', etiqueta: 'Cuentas', sigla: 'C' },
    { ruta: '/tarjetas', etiqueta: 'Tarjetas', sigla: 'T' },
    { ruta: '/tipocuenta', etiqueta: 'Tipos de cuenta', sigla: 'TC' },
    { ruta: '/acciones', etiqueta: 'Acciones', sigla: 'A' },
  ];

  alternar(): void {
    this.retraido.update((valor) => !valor);
  }
}
