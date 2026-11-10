import { Routes } from '@angular/router';

import { Shell } from './layout/shell/shell';
import { Usuarios } from './pages/usuarios/usuarios';
import { Cuentas } from './pages/cuenta/cuentas';
import { Tarjetas } from './pages/tarjeta/tarjeta';
import { TiposCuenta } from './pages/tipocuenta/tipocuenta';
import { Sedes } from './pages/sedes/sedes';
import { Sucursales } from './pages/sucursales/sucursales';
import { Empleados } from './pages/empleados/empleados';
import { Cuotas } from './pages/cuotas/cuotas';
import { Acciones } from './pages/accion/accion';

export const routes: Routes = [
  {
    path: '',
    component: Shell,
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'usuarios' },
      { path: 'usuarios', component: Usuarios },
      { path: 'cuenta', component: Cuentas },
      { path: 'tarjetas', component: Tarjetas },
      { path: 'tipocuenta', component: TiposCuenta },
      { path: 'sedes', component: Sedes },
      { path: 'sucursales', component: Sucursales },
      { path: 'empleados', component: Empleados },
      { path: 'cuotas', component: Cuotas },
      { path: 'acciones', component: Acciones },
    ],
  },
  { path: '**', redirectTo: 'usuarios' },
];
