import { Routes } from '@angular/router';

import { Shell } from './layout/shell/shell';
import { Cuentas } from './pages/cuenta/cuentas';
import { Cuotas } from './pages/cuotas/cuotas';
import { Empleados } from './pages/empleados/empleados';
import { Acciones } from './pages/acciones/acciones';
import { Tarjetas } from './pages/tarjetas/tarjetas';
import { TiposCuenta } from './pages/tipos-cuenta/tipos-cuenta';
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
      { path: 'tarjetas', component: Tarjetas },
      { path: 'tipos-cuenta', component: TiposCuenta },
      { path: 'acciones', component: Acciones },
    ],
  },
  { path: '**', redirectTo: 'usuarios' },
];
