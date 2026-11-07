import { Routes } from '@angular/router';

import { Shell } from './layout/shell/shell';
import { Usuarios } from './pages/usuarios/usuarios';
import { TiposCuenta } from './pages/tipocuenta/tipocuenta';
import { Acciones } from './pages/accion/accion';
import { Tarjetas } from './pages/tarjeta/tarjeta';
import { Cuentas } from './pages/cuenta/cuentas'; 
import { Sucursales } from './pages/sucursales/sucursales';
import { Empleados } from './pages/empleados/empleados';
import { Cuotas } from './pages/cuotas/cuotas';
import { Sedes } from './pages/sedes/sedes';

export const routes: Routes = [
  {
    path: '',
    component: Shell,
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'usuarios' },
      { path: 'usuarios', component: Usuarios },
      { path: 'cuentas', component: Cuentas },
      { path: 'tipocuenta', component: TiposCuenta},
      { path: 'acciones', component: Acciones },
      { path: 'tarjetas', component: Tarjetas },
      { path: 'sucursales', component: Sucursales },
      { path: 'empleados', component: Empleados },
      { path: 'cuotas', component: Cuotas },
       { path: 'sedes', component: Sedes },
    ],
  },
  { path: '**', redirectTo: 'usuarios' },
];

