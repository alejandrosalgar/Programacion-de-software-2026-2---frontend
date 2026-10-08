# Sistema de informacion Angular — paso a paso

Guia para **crear y armar** el frontend en este repositorio.

Node.js y Angular CLI ya estan instalados. Esta guia no cubre esa instalacion. Empieza en `ng new` y llega hasta un sistema con **sidebar**: una opcion por entidad del backend, y al hacer clic se abre el **CRUD** de esa entidad.

El codigo se escribe despues, siguiendo estos pasos. Este archivo es el mapa.

Backend (otro repo, tiene que estar corriendo):

```bash
uvicorn src.main:app --reload
```

API: [http://127.0.0.1:8000](http://127.0.0.1:8000)  
Docs: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

---

## 0. Que vamos a construir

Una aplicacion de una sola pagina (SPA) con este layout:

```
+------------------+----------------------------------------------+
|  BANCO ITM       |  Usuarios                                    |
|                  |                                              |
|  Usuarios     <--+-- opcion activa                              |
|  Cuentas         |  [ Filtrar por ID........ ] [ Buscar ]       |
|  Tarjetas        |                         [ + Crear ]          |
|  Tipos de cuenta |  ------------------------------------------  |
|  Sedes           |  | id | campos... | Editar | Eliminar |      |
|  Sucursales      |  | .. | ........  |  [ ]   |   [x]    |      |
|  Empleados       |  | .. | ........  |  [ ]   |   [x]    |      |
|  Beneficiarios   |  ------------------------------------------  |
|  Cuotas          |                                              |
|  Acciones        |  (popup Crear / Editar se abre encima)       |
+------------------+----------------------------------------------+
```

Reglas de la pantalla CRUD (iguales en todas las entidades):

| Pieza | Que hace |
| --- | --- |
| Grid | Lista **todos** los registros (`GET /recurso/`) |
| Filtro por ID | Caja de texto + boton. Llama `GET /recurso/{id}`. Si hay match, la tabla muestra ese registro. Si se vacia el filtro, vuelve la lista completa |
| Boton Crear | Abre un **popup** con el formulario vacio. Al guardar: `POST /recurso/` y se cierra el popup. La tabla se recarga |
| Editar (por fila) | Abre el **mismo popup** con los datos de esa fila. Al guardar: `PUT /recurso/{id}` |
| Eliminar (por fila) | Pide confirmacion. Si acepta: `DELETE /recurso/{id}` y la fila desaparece |

El sidebar **no** es un menu de paginas distintas en diseno. Es el mismo tipo de pantalla, una vez por entidad. Lo que cambia es el recurso HTTP, los campos del formulario y las columnas de la tabla.

---

## 1. Entidades = opciones del sidebar

El backend declara estas entidades en `src/entities/`. Cada una es una fila del menu y una ruta del enrutador de Angular.

| # | Entidad | Ruta Angular | Recurso HTTP | Estado de la API hoy |
| --- | --- | --- | --- | --- |
| 1 | Usuario | `/usuarios` | `/usuarios` | CRUD completo + login |
| 2 | Cuenta | `/cuentas` | `/cuentas` | CRUD en Python; ruta HTTP pendiente |
| 3 | Tarjeta | `/tarjetas` | `/tarjetas` | Solo `GET /tarjetas/` |
| 4 | TipoCuenta | `/tipos-cuenta` | `/tipos-cuenta` | CRUD en Python; ruta HTTP pendiente |
| 5 | Sede | `/sedes` | `/sedes` | CRUD en Python; ruta HTTP pendiente |
| 6 | Sucursal | `/sucursales` | `/sucursales` | Entidad lista; ruta HTTP pendiente |
| 7 | Empleado | `/empleados` | `/empleados` | Entidad lista; ruta HTTP pendiente |
| 8 | Beneficiario | `/beneficiarios` | `/beneficiarios` | Entidad lista; ruta HTTP pendiente |
| 9 | Cuota | `/cuotas` | `/cuotas` | Entidad lista; ruta HTTP pendiente |
| 10 | Accion | `/acciones` | `/acciones` | CRUD en Python; ruta HTTP pendiente |

El frontend se construye **completo** (sidebar + 10 pantallas). Si un endpoint todavia no existe, la pantalla muestra el error de red o el `404` de FastAPI. Cuando el backend publique el router, esa pantalla empieza a funcionar sin cambiar el layout.

Orden de implementacion recomendado: primero **Usuarios** (API lista), luego **Tarjetas** (al menos el grid), despues el resto copiando el mismo patron.

Contrato HTTP que cada pantalla espera (igual que usuarios):

| Accion en pantalla | Metodo | URL |
| --- | --- | --- |
| Grid (todos) | `GET` | `/recurso/` |
| Filtro por ID | `GET` | `/recurso/{id}` |
| Crear (popup) | `POST` | `/recurso/` |
| Editar (popup) | `PUT` | `/recurso/{id}` |
| Eliminar | `DELETE` | `/recurso/{id}` |

Las rutas del backend llevan **barra final** en las colecciones (`/usuarios/`, `/tarjetas/`). Llamarlas asi.

Listar suele devolver un sobre `{ "data": [], "status": 200, "message": "..." }`. Obtener uno por ID, en usuarios, devuelve el objeto **directo**. El servicio tiene que contemplar las dos formas.

---

## 2. Crear el proyecto Angular (en este repo)

Este repositorio ya existe y ya tiene git. El proyecto **no** se crea en una carpeta hermana. Se crea **aqui**, en la raiz de `Programacion-de-software-2026-2---frontend`.

Comprobar que el CLI responde (una sola vez):

```bash
node -v
ng version
```

En PowerShell, desde **esta** carpeta (donde esta este `paso_a_paso.md`):

```bash
ng new nombre-carpeta --directory=. --routing --style=css --ssr=false --skip-git
npm install --legacy-peer-deps
 ```

| Flag | Por que |
| --- | --- |
| `.` | Usa la carpeta actual. No crea `frontend-banco/` extra |
| `--routing` | Genera `app.routes.ts`. Sin esto no hay sidebar con URLs |
| `--style=css` | CSS normal |
| `--ssr=false` | Solo navegador. No hace falta render en servidor |
| `--skip-git` | Este repo **ya** es un git. Sin el flag, `ng new` intenta otro `git init` |

Si el CLI pregunta:

- stylesheet: **CSS** (si no se paso `--style`)
- SSR / server routing: **No**
- zoneless / AI: dejar el valor por defecto del curso

Al terminar tiene que existir `angular.json` al lado de este markdown.

Arrancar:

```bash
ng serve
```

Abrir [http://localhost:4200](http://localhost:4200). Tiene que verse la pagina de bienvenida de Angular. Dejar `ng serve` corriendo: al guardar, el navegador se actualiza.

---

## 3. Archivos que crea el CLI (y para que sirven)

Despues de `ng new .` la raiz se parece a esto. Los nombres pueden variar un poco segun la version del CLI (`app.ts` o `app.component.ts`). La idea no cambia.

```text
Programacion-de-software-2026-2---frontend/
  angular.json              # configuracion del CLI (puerto, build)
  package.json              # dependencias npm
  tsconfig.json             # TypeScript
  src/
    index.html              # unico HTML que el navegador pide
    main.ts                 # arranque: bootstrapApplication(...)
    styles.css              # CSS global (sidebar, tabla, popup)
    app/
      app.config.ts         # providers: router + HttpClient
      app.routes.ts         # tabla de rutas (el enrutador)
      app.ts                # componente raiz
      app.html              # template raiz (aqui ira el layout)
      app.css               # estilos del raiz
```

Piezas que **no** hay que inventar a mano: el CLI ya las dejo. Lo que sigue es **editarlas** y **generar** carpetas nuevas.

### Quien hace que

```
index.html
    |
    |  carga el bundle
    v
main.ts  -->  lee app.config.ts
                |
                |  provideRouter(routes)
                |  provideHttpClient()     <-- hay que agregarlo (paso 5)
                v
              app.ts / app.html            <-- layout: sidebar + router-outlet
                |
                |  <router-outlet>
                v
              pagina CRUD de la ruta activa
```

`app.routes.ts` es el **enrutador del frontend**. No se confunde con FastAPI:

| | Angular (`app.routes.ts`) | FastAPI (`main.py`) |
| --- | --- | --- |
| Corre en | el navegador, puerto 4200 | Python, puerto 8000 |
| Ejemplo | `/usuarios` muestra el componente | `GET /usuarios/` devuelve JSON |
| Quien lo usa | la persona (clic en el sidebar) | el servicio `HttpClient` |

---

## 4. Estructura que vamos a agregar

Encima de lo que creo el CLI, la app queda asi:

```text
src/
  environments/
    environment.ts                 # apiUrl = http://127.0.0.1:8000
  app/
    app.config.ts                  # provideRouter + provideHttpClient
    app.routes.ts                  # 10 rutas + redirect
    app.ts
    app.html                       # <app-shell> o el layout directo
    layout/
      shell/
        shell.ts
        shell.html                 # sidebar + <router-outlet>
        shell.css
    models/
      usuario.model.ts
      cuenta.model.ts
      tarjeta.model.ts
      tipo-cuenta.model.ts
      sede.model.ts
      sucursal.model.ts
      empleado.model.ts
      beneficiario.model.ts
      cuota.model.ts
      accion.model.ts
      api-respuesta.model.ts       # { data, status, message }
    services/
      usuario.service.ts
      cuenta.service.ts
      tarjeta.service.ts
      tipo-cuenta.service.ts
      sede.service.ts
      sucursal.service.ts
      empleado.service.ts
      beneficiario.service.ts
      cuota.service.ts
      accion.service.ts
    pages/
      usuarios/
      cuentas/
      tarjetas/
      tipos-cuenta/
      sedes/
      sucursales/
      empleados/
      beneficiarios/
      cuotas/
      acciones/
    shared/
      confirmacion (opcional)
```

Cada carpeta de `pages/` es **un CRUD**: tabla + filtro + boton crear + popup + editar/eliminar por fila.

Un componente **no** arma URLs ni conoce el puerto `8000`. Eso es del **servicio**. El componente pide `listar()`, `obtener(id)`, `crear()`, `actualizar()`, `eliminar()`.

```
clic en sidebar
    v
enrutador (app.routes.ts)          URL del navegador
    v
pagina CRUD (pages/usuarios/...)   pinta tabla y popup
    v
servicio (usuario.service.ts)      HttpClient
    v
FastAPI  http://127.0.0.1:8000/usuarios/
```

---

## 5. HttpClient y URL de la API

Angular no activa `HttpClient` solo. En `src/app/app.config.ts`:

```typescript
import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(),
  ],
};
```

Sin `provideHttpClient()`, el servicio compila y en el navegador falla al inyectar `HttpClient`.

Crear `src/environments/environment.ts`:

```typescript
export const environment = {
  apiUrl: 'http://127.0.0.1:8000',
};
```

Los servicios concatenan el recurso: `${environment.apiUrl}/usuarios/`. Si la API cambia de puerto, se toca un archivo, no diez pantallas.

El backend ya tiene CORS abierto en desarrollo (`allow_origins=["*"]`). No hace falta proxy.

---

## 6. El enrutador (`app.routes.ts`)

Una ruta por entidad. La URL vacia manda a la primera pantalla. El layout (`shell`) envuelve todas: el sidebar se queda, solo cambia el recuadro derecho (`router-outlet`).

```typescript
import { Routes } from '@angular/router';
import { Shell } from './layout/shell/shell';
import { Usuarios } from './pages/usuarios/usuarios';
import { Cuentas } from './pages/cuentas/cuentas';
import { Tarjetas } from './pages/tarjetas/tarjetas';
import { TiposCuenta } from './pages/tipos-cuenta/tipos-cuenta';
import { Sedes } from './pages/sedes/sedes';
import { Sucursales } from './pages/sucursales/sucursales';
import { Empleados } from './pages/empleados/empleados';
import { Beneficiarios } from './pages/beneficiarios/beneficiarios';
import { Cuotas } from './pages/cuotas/cuotas';
import { Acciones } from './pages/acciones/acciones';

export const routes: Routes = [
  {
    path: '',
    component: Shell,
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'usuarios' },
      { path: 'usuarios', component: Usuarios },
      { path: 'cuentas', component: Cuentas },
      { path: 'tarjetas', component: Tarjetas },
      { path: 'tipos-cuenta', component: TiposCuenta },
      { path: 'sedes', component: Sedes },
      { path: 'sucursales', component: Sucursales },
      { path: 'empleados', component: Empleados },
      { path: 'beneficiarios', component: Beneficiarios },
      { path: 'cuotas', component: Cuotas },
      { path: 'acciones', component: Acciones },
    ],
  },
  { path: '**', redirectTo: 'usuarios' },
];
```

Los nombres de clase (`Usuarios`, `Shell`, ...) salen de `ng generate`. Si el CLI genera `UsuariosComponent`, los imports se ajustan a eso.

`path: '**'` es la ruta comodin: cualquier URL que no exista vuelve a usuarios.

Navegar **no** recarga la pagina. El shell sigue montado. Solo se destruye y crea el hijo (el CRUD).

---

## 7. Layout: sidebar + area de trabajo

Generar el shell:

```bash
ng generate component layout/shell
```

### `shell.ts` — items del menu

Una lista fija. Cada item es una entidad. `routerLink` cambia la URL. `routerLinkActive` marca la opcion actual.

```typescript
menu = [
  { ruta: '/usuarios', etiqueta: 'Usuarios' },
  { ruta: '/cuentas', etiqueta: 'Cuentas' },
  { ruta: '/tarjetas', etiqueta: 'Tarjetas' },
  { ruta: '/tipos-cuenta', etiqueta: 'Tipos de cuenta' },
  { ruta: '/sedes', etiqueta: 'Sedes' },
  { ruta: '/sucursales', etiqueta: 'Sucursales' },
  { ruta: '/empleados', etiqueta: 'Empleados' },
  { ruta: '/beneficiarios', etiqueta: 'Beneficiarios' },
  { ruta: '/cuotas', etiqueta: 'Cuotas' },
  { ruta: '/acciones', etiqueta: 'Acciones' },
];
```

### `shell.html` — esqueleto

```html
<div class="layout">
  <aside class="sidebar">
    <h1>Banco ITM</h1>
    <nav>
      @for (item of menu; track item.ruta) {
        <a [routerLink]="item.ruta" routerLinkActive="activo">
          {{ item.etiqueta }}
        </a>
      }
    </nav>
  </aside>

  <main class="contenido">
    <router-outlet />
  </main>
</div>
```

`router-outlet` es el hueco donde Angular pinta el CRUD de la ruta activa.

El componente raiz (`app.html`) solo hospeda el shell:

```html
<app-shell />
```

Si las rutas hijas ya montan `Shell`, entonces `app.html` queda en:

```html
<router-outlet />
```

No hay que poner el sidebar dos veces. Una sola vez: o en `app.html` o como componente padre de las rutas, como en el ejemplo del paso 6.

### `shell.css` — idea minima

- `.layout`: flex, alto 100vh
- `.sidebar`: ancho fijo (~240px), fondo oscuro, links en columna
- `.contenido`: el resto, padding, scroll
- `a.activo`: resalte (fondo o borde izquierdo)

---

## 8. Modelos (la forma del JSON)

Una `interface` por entidad, alineada con el backend. Los UUID viajan como `string`. La clave de usuario **no** se muestra en lecturas; si se envia, solo en el body de crear/editar.

`src/app/models/api-respuesta.model.ts`:

```typescript
export interface ApiLista<T> {
  data: T[];
  status: number;
  message: string;
}

export interface ApiUno<T> {
  data: T;
  status: number;
  message: string;
}
```

Campos que cada pantalla usa en tabla y popup (nombres igual que el JSON):

### Usuario — `/usuarios`

| Campo | Tabla | Crear | Editar | Notas |
| --- | --- | --- | --- | --- |
| `id_usuario` | si | no | no (solo URL) | filtro por ID |
| `primer_nombre` | si | si | si | |
| `segundo_nombre` | si | si | si | puede ir vacio |
| `primer_apellido` | si | si | si | |
| `segundo_apellido` | si | si | si | puede ir vacio |
| `nombre_usuario` | si | si | si | unico; `409` si se repite |
| `clave` | no | si | opcional | nunca se lista |

### Cuenta — `/cuentas`

`id_cuenta`, `numero_cuenta`, `id_tipo_cuenta`, `id_usuario`, `saldo`, `estado`, `fecha_apertura` (auditoria: `id_usuario_creacion`, fechas).

### Tarjeta — `/tarjetas`

`id_tarjeta`, `id_cuenta`, `numero_tarjeta`, `tipo_tarjeta`, `fecha_emision`, `fecha_vencimiento`, `cvv`, `limite_credito`, `estado`.

### TipoCuenta — `/tipos-cuenta`

`id_tipo_cuenta`, `nombre`, `descripcion`, `tasa_interes`, `monto_minimo_apertura`, `requiere_mantenimiento`, `estado`.

### Sede — `/sedes`

`id_sede`, `nombre`, `direccion`, `ciudad`, `telefono`.

### Sucursal — `/sucursales`

`id_sucursal`, `nombre`, `direccion`, `ciudad`, `telefono`.

### Empleado — `/empleados`

`id_empleado`, `id_usuario`, `id_sucursal`, `cargo`, `activo`.

### Beneficiario — `/beneficiarios`

`id_beneficiario`, `id_cliente`, `nombre_completo`, `parentesco`, `telefono`.

### Cuota — `/cuotas`

`id_cuota`, `id_prestamo`, `valor`, `numero_cuota`, `fecha_vencimiento`, `estado`.

### Accion — `/acciones`

`id_accion`, `id_usuario`, `tipo_accion`, `descripcion`, `ip_origen`, `resultado`, `fecha_accion`.

Auditoria (`id_usuario_creacion`, `id_usuario_edicion`, `fecha_creacion`, `fecha_edicion`): se puede mostrar en la tabla como columnas extra o omitirla en el popup de alta. No es el foco del primer CRUD.

---

## 9. Servicios HTTP

Generar, por ejemplo:

```bash
ng generate service services/usuario
```

Repetir para cada entidad. El esqueleto es siempre el mismo. Solo cambian `base` y los tipos.

Patron (`usuario.service.ts`):

```typescript
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiLista } from '../models/api-respuesta.model';
import { Usuario, UsuarioCreate, UsuarioUpdate } from '../models/usuario.model';

@Injectable({ providedIn: 'root' })
export class UsuarioService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/usuarios`;

  listar(): Observable<ApiLista<Usuario>> {
    return this.http.get<ApiLista<Usuario>>(`${this.base}/`);
  }

  obtener(id: string): Observable<Usuario> {
    return this.http.get<Usuario>(`${this.base}/${id}`);
  }

  crear(datos: UsuarioCreate): Observable<unknown> {
    return this.http.post(`${this.base}/`, datos);
  }

  actualizar(id: string, datos: UsuarioUpdate): Observable<unknown> {
    return this.http.put(`${this.base}/${id}`, datos);
  }

  eliminar(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
```

`Observable` es "la respuesta todavia no llega". El componente se suscribe; cuando FastAPI contesta, se pinta la tabla.

El componente de usuarios **solo** llama estos cinco metodos. No concatena la URL.

---

## 10. Pantalla CRUD (el patron que se copia 10 veces)

Generar la primera pagina:

```bash
ng generate component pages/usuarios
```

Cuando Usuarios funcione de punta a punta, se copia el mismo componente para las otras entidades (`ng generate component pages/cuentas`, etc.) y se cambia:

1. el servicio inyectado
2. las columnas de la tabla
3. los campos del formulario del popup
4. el nombre del id (`id_usuario`, `id_cuenta`, ...)

### Comportamiento

Al entrar a `/usuarios`:

1. El enrutador muestra `Usuarios` dentro del shell.
2. `ngOnInit` llama `usuarioService.listar()`.
3. Se recorre `respuesta.data` y se llena la tabla.
4. Si la API esta apagada o responde `404` (lista vacia en el backend actual), se muestra un mensaje en la pantalla, no una pagina en blanco.

**Filtro por ID**

- Input + boton "Buscar".
- Si el texto esta vacio: otra vez `listar()`.
- Si hay valor: `obtener(id)`. Exito → `filas = [ese registro]`. `404` → tabla vacia y mensaje "no encontrado".

**Boton Crear**

- `popupAbierto = true`, `modo = 'crear'`, formulario vacio.
- Guardar → `crear(formulario)` → cerrar popup → `listar()` de nuevo.

**Editar en la fila**

- `popupAbierto = true`, `modo = 'editar'`, formulario = copia de la fila (sin `clave` visible salvo campo opcional).
- Guardar → `actualizar(id, formulario)` → cerrar → `listar()` o volver a aplicar el filtro.

**Eliminar en la fila**

- `confirm('Eliminar este registro?')` (o un popup propio).
- Si acepta → `eliminar(id)` (`204`, sin JSON) → quitar la fila o recargar.

### HTML de la pagina (idea)

```html
<header class="crud-barra">
  <h2>Usuarios</h2>

  <form (submit)="$event.preventDefault(); buscarPorId()">
    <input
      [(ngModel)]="idFiltro"
      name="idFiltro"
      placeholder="Filtrar por ID"
    />
    <button type="submit">Buscar</button>
    <button type="button" (click)="limpiarFiltro()">Todos</button>
  </form>

  <button type="button" (click)="abrirCrear()">+ Crear</button>
</header>

<p class="mensaje" *ngIf="mensaje">{{ mensaje }}</p>

<table>
  <thead>
    <tr>
      <th>ID</th>
      <th>Nombre</th>
      <th>Usuario</th>
      <th></th>
    </tr>
  </thead>
  <tbody>
    @for (fila of filas; track fila.id_usuario) {
      <tr>
        <td>{{ fila.id_usuario }}</td>
        <td>{{ fila.primer_nombre }} {{ fila.primer_apellido }}</td>
        <td>{{ fila.nombre_usuario }}</td>
        <td>
          <button type="button" (click)="abrirEditar(fila)">Editar</button>
          <button type="button" (click)="eliminar(fila)">Eliminar</button>
        </td>
      </tr>
    }
  </tbody>
</table>

@if (popupAbierto) {
  <div class="fondo-popup" (click)="cerrarPopup()">
    <div class="popup" (click)="$event.stopPropagation()">
      <h3>{{ modo === 'crear' ? 'Crear' : 'Editar' }} usuario</h3>
      <!-- campos del formulario -->
      <button type="button" (click)="guardar()">Guardar</button>
      <button type="button" (click)="cerrarPopup()">Cancelar</button>
    </div>
  </div>
}
```

Para `[(ngModel)]` hay que importar `FormsModule` en el componente (standalone).

### CSS del popup (idea)

- `.fondo-popup`: posicion fija, toda la pantalla, fondo semitransparente, flex centrado
- `.popup`: caja blanca, padding, ancho maximo (~480px), scroll si el formulario es largo

Clic en el fondo cierra. Clic dentro del popup no se propaga (`stopPropagation`).

---

## 11. Orden de trabajo con el CLI

Hacerlo en este orden. Cada paso se prueba en el navegador antes del siguiente.

### Paso A — Proyecto y HTTP

1. `ng new . --routing --style=css --ssr=false --skip-git`
2. `ng serve` → [http://localhost:4200](http://localhost:4200)
3. Editar `app.config.ts`: `provideHttpClient()`
4. Crear `src/environments/environment.ts`

### Paso B — Layout y rutas vacias

1. `ng generate component layout/shell`
2. Armar sidebar + `router-outlet`
3. Generar las 10 paginas (aunque todavia digan "Usuarios" / "Cuentas" en un `<h2>`)
4. Llenar `app.routes.ts`
5. Clic en cada opcion del menu: cambia la URL y el titulo. Todavia sin API.

```bash
ng generate component pages/usuarios
ng generate component pages/cuentas
ng generate component pages/tarjetas
ng generate component pages/tipos-cuenta
ng generate component pages/sedes
ng generate component pages/sucursales
ng generate component pages/empleados
ng generate component pages/beneficiarios
ng generate component pages/cuotas
ng generate component pages/acciones
```

### Paso C — Primera entidad de verdad: Usuarios

1. Modelo `usuario.model.ts`
2. `ng generate service services/usuario`
3. En la pagina: grid, filtro ID, popup crear, editar, eliminar
4. Backend encendido. Probar en [http://localhost:4200/usuarios](http://localhost:4200/usuarios)

Flujo completo de una pantalla:

1. La persona entra a `http://localhost:4200/usuarios`
2. El enrutador muestra el CRUD dentro del shell
3. El componente llama `UsuarioService.listar()`
4. `HttpClient` hace `GET http://127.0.0.1:8000/usuarios/`
5. El navegador pregunta CORS. FastAPI autoriza
6. Vuelve `{ data, status, message }`
7. La tabla dibuja una fila por cada elemento de `data`

### Paso D — Copiar el patron

Misma receta para Tarjetas (grid ya posible) y el resto. No reinventar el layout. Cambiar servicio, columnas y formulario.

---

## 12. Codigos HTTP que la pantalla debe mostrar

No dejar la tabla muda. Convertir el error en un mensaje.

| Codigo | Cuando | Que ve la persona |
| --- | --- | --- |
| `200` / `201` | Listo, creado o editado | Tabla actualizada; popup cerrado |
| `204` | `DELETE` ok | La fila desaparece. No hay JSON |
| `404` | Lista vacia o ID inexistente | "No hay registros" / "No encontrado" |
| `409` | Dato unico repetido (`nombre_usuario`) | "Ese valor ya existe" |
| `422` | Falta un campo o el tipo no coincide | Revisar el formulario |
| Red / API apagada | Uvicorn no esta corriendo | "No se pudo conectar con la API" |

Hoy el login **no** entrega token. Las rutas no piden `Authorization`. Esta guia **no** incluye login: el sistema se abre directo en el CRUD. Login puede ir despues, como ruta fuera del shell.

---

## 13. Como correr los dos proyectos a la vez

Dos terminales:

| Proceso | Carpeta | Comando | URL |
| --- | --- | --- | --- |
| API | repo Backend | `uvicorn src.main:app --reload` | [http://127.0.0.1:8000](http://127.0.0.1:8000) |
| Angular | este repo | `ng serve` | [http://localhost:4200](http://localhost:4200) |

Si Angular esta solo, el grid de usuarios falla por red. Si el backend esta solo, no hay pantalla.

Comprobar la API antes de culpar al frontend: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs).

---

## 14. Checklist

Proyecto

- [ ] `angular.json` en la raiz de este repo
- [ ] `ng serve` abre la bienvenida
- [ ] `provideHttpClient()` en `app.config.ts`
- [ ] `environment.apiUrl` apunta a `http://127.0.0.1:8000`

Layout

- [ ] Sidebar con **10** opciones (una por entidad)
- [ ] Clic cambia la URL (`/usuarios`, `/cuentas`, ...)
- [ ] La opcion activa se ve marcada
- [ ] El area derecha es el CRUD, no otra pagina completa

Cada CRUD

- [ ] Al entrar, carga **todos** los registros en una tabla
- [ ] Filtro por ID (buscar / volver a todos)
- [ ] Boton **Crear** abre popup
- [ ] Guardar en crear llama `POST` y recarga
- [ ] **Editar** en la fila abre el mismo popup con datos
- [ ] **Eliminar** pide confirmacion y llama `DELETE`
- [ ] Mensajes de vacio, 404, 409 y API apagada

Usuarios es el primero que tiene que cumplir el checklist entero: la API ya esta. El resto replica el mismo checklist cuando su router exista en FastAPI.
