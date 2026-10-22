import { Routes } from '@angular/router';

import { Shell } from './layout/shell/shell';
import { Cuentas } from './pages/cuenta/cuentas';
import { Cuotas } from './pages/cuotas/cuotas';
import { Empleados } from './pages/empleados/empleados';
import { Sucursales } from './pages/sucursales/sucursales';
import { Usuarios } from './pages/usuarios/usuarios';
export const routes: Routes = [
  {
    path: '',
    component: Shell,
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'usuarios' },
      { path: 'usuarios', component: Usuarios },
      { path: 'cuenta', component: Cuentas },
      { path: 'cuotas', component: Cuotas },
      { path: 'sucursales', component: Sucursales },
      { path: 'empleados', component: Empleados },
    ],
  },
  { path: '**', redirectTo: 'usuarios' },
];
