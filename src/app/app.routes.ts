import { Routes } from '@angular/router';

import { Shell } from './layout/shell/shell';
import { Usuarios } from './pages/usuarios/usuarios';

export const routes: Routes = [
  {
    path: '',
    component: Shell,
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'usuarios' },
      { path: 'usuarios', component: Usuarios },
    ],
  },
  { path: '**', redirectTo: 'usuarios' },
];
