# Usuarios de punta a punta

Este archivo cuenta **qué se hizo** para dejar la entidad Usuario funcionando entre Angular y FastAPI. El sidebar tiene una sola opción: **Usuarios**. El resto de entidades queda para copiar este mismo patrón.

No incluye login. La app abre directo en el CRUD.

---

## Qué tiene que estar corriendo

Dos terminales:

| Proceso | Carpeta | Comando | URL |
| --- | --- | --- | --- |
| API | repo Backend | `uvicorn src.main:app --reload` | http://127.0.0.1:8000 |
| Angular | este repo | `ng serve` | http://localhost:4200 |

Abrir http://localhost:4200. La ruta vacía redirige a `/usuarios`.

Comprobar la API sola: http://127.0.0.1:8000/docs.

---

## 1. Contrato que usa la pantalla

La página no arma URLs. Llama a `UsuarioService`. El servicio habla con FastAPI.

| Acción en pantalla | Método | URL | Qué vuelve |
| --- | --- | --- | --- |
| Grid (todos) | `GET` | `/usuarios/` | `{ "data": [], "status": 200, "message": "..." }` |
| Filtro por ID | `GET` | `/usuarios/{id}` | el usuario **directo**, sin sobre |
| Crear | `POST` | `/usuarios/` | `{ "data": {...}, "status": 201, "message": "..." }` |
| Editar | `PUT` | `/usuarios/{id}` | `{ "data": {...}, "status": 200, "message": "..." }` |
| Eliminar | `DELETE` | `/usuarios/{id}` | `204`, sin JSON |

La barra final de la colección importa: `/usuarios/`, no `/usuarios`.

Campos:

| Campo | Tabla | Crear | Editar |
| --- | --- | --- | --- |
| `id_usuario` | sí | no | no (va en la URL) |
| `primer_nombre` | sí | sí | sí |
| `segundo_nombre` | sí | sí, puede ir vacío | sí |
| `primer_apellido` | sí | sí | sí |
| `segundo_apellido` | sí | sí, puede ir vacío | sí |
| `nombre_usuario` | sí | sí, único | sí |
| `clave` | no | sí | opcional. Si el campo queda vacío, no se envía y la clave no cambia |

`clave` no viene en las lecturas. El backend no la devuelve en `UsuarioRead`.

Códigos que la pantalla convierte en texto:

| Código | Qué ve la persona |
| --- | --- |
| `200` / `201` | Tabla actualizada. El popup se cierra |
| `204` | La fila desaparece |
| `404` en el listado | "No hay registros". El backend responde 404 cuando la tabla está vacía |
| `404` al buscar un ID | "No encontrado" |
| `409` | "Ese nombre de usuario ya existe" |
| `422` | "Revisa los datos. El filtro por ID tiene que ser un UUID." |
| Sin red (status `0`) | "No se pudo conectar con la API..." |

---

## 2. Ajustes en el backend

Sin estos tres cambios el frontend no puede completar el CRUD, aunque la pantalla esté bien.

### Listar todos

`GET /usuarios/` llama `usuario_crud.listar()` sin argumentos. La función pedía `offset` y cortaba en 20 filas, así que la ruta reventaba antes de responder.

Quedó así, alineada con el resto de entidades:

```python
def listar() -> list[Usuario]:
    session = get_session()
    try:
        return session.query(Usuario).all()
    finally:
        session.close()
```

Archivo: `src/crud/usuario.py`.

### Guardar el nombre de usuario al editar

`actualizar` recibía `nombre_usuario` como parámetro aparte y el `for` solo recorría `kwargs`. El nombre se validaba (único) pero **no se escribía** en la fila.

Ahora todo llega en `**kwargs`. Si el nombre nuevo ya lo tiene otro usuario, sigue devolviendo `None` y la API responde `409`. Si es el mismo usuario, se actualiza.

### Respuesta JSON desde SQLAlchemy

`UsuarioRead` no podía leer un objeto de SQLAlchemy. Se agregó:

```python
model_config = ConfigDict(from_attributes=True)
```

Sin eso, FastAPI no arma el JSON de la lista, del alta ni de la edición. Archivo: `src/api/schemas.py`.

CORS ya estaba abierto (`allow_origins=["*"]`). No hizo falta proxy en Angular.

---

## 3. HttpClient y la URL de la API

Angular no trae `HttpClient` activo. En `src/app/app.config.ts` se agregó `provideHttpClient()` junto al router.

`src/environments/environment.ts`:

```typescript
export const environment = {
  apiUrl: 'http://127.0.0.1:8000',
};
```

Si la API cambia de puerto, se toca este archivo. Las pantallas no conocen el `8000`.

---

## 4. Modelos

`src/app/models/api-respuesta.model.ts` describe los dos sobres:

- `ApiLista<T>`: listado (`data` es un arreglo).
- `ApiUno<T>`: alta y edición (`data` es un objeto).

`src/app/models/usuario.model.ts` tiene tres formas:

- `Usuario`: lo que devuelve un GET. Sin `clave`.
- `UsuarioCreate`: body del POST. Con `clave`.
- `UsuarioUpdate`: body del PUT. Todo opcional. `clave` solo si la persona escribió una nueva.

Los UUID viajan como `string`.

---

## 5. Servicio

`src/app/services/usuario.service.ts`.

Cinco métodos y nada más: `listar`, `obtener`, `crear`, `actualizar`, `eliminar`.

La base es `` `${environment.apiUrl}/usuarios` ``.

- `listar` y `crear` pegan a `` `${base}/` `` (barra final).
- `obtener`, `actualizar` y `eliminar` pegan a `` `${base}/${id}` ``.

El componente de la página no concatena esa URL.

---

## 6. Layout: sidebar con una sola opción

`src/app/layout/shell/` es el marco. A la izquierda el menú, a la derecha el hueco `<router-outlet>`.

El menú hoy es una lista de un elemento:

```typescript
readonly menu = [{ ruta: '/usuarios', etiqueta: 'Usuarios' }];
```

`routerLink` cambia la URL. `routerLinkActive="activo"` marca la opción actual.

Para sumar otra entidad más adelante se agrega otra fila a `menu` y otra ruta hija. El marco no se vuelve a armar.

`src/app/app.html` solo tiene `<router-outlet />`. El shell es el componente de la ruta `''`, así el sidebar no se pinta dos veces.

---

## 7. Enrutador

`src/app/app.routes.ts`:

```typescript
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
```

- `/` entra al shell y redirige a `/usuarios`.
- Cualquier URL desconocida también cae en usuarios.
- Navegar no recarga la página. El shell sigue montado. Solo se crea de nuevo la página de la derecha.

---

## 8. Pantalla CRUD

`src/app/pages/usuarios/`.

Al entrar, `ngOnInit` llama `listar()`. Si `data` trae filas, se pintan. Si el backend responde `404` porque no hay usuarios, la tabla queda vacía y el mensaje es "No hay registros".

**Filtro por ID.** Caja + Buscar. Vacío: otra vez `listar()`. Con texto: `obtener(id)`. Si existe, la tabla muestra solo esa fila. Si no, tabla vacía y "No encontrado". Todos limpia la caja y vuelve al listado.

**Crear.** Abre el popup con el formulario vacío. Guardar hace `POST /usuarios/` y cierra. La tabla se recarga.

**Editar.** El mismo popup, con los datos de la fila. La clave queda en blanco. Si la persona no escribe clave, el PUT no manda `clave`. Si escribe, se actualiza. El `id_usuario` va en la URL, no en el body.

**Eliminar.** `confirm(...)`. Si acepta, `DELETE`. El backend responde `204`. Se vuelve a cargar la tabla (o el filtro, si estaba activo).

El popup cierra al hacer clic en el fondo. Un clic dentro no se propaga (`stopPropagation`), así que no se cierra solo.

Los campos usan `[(ngModel)]`. Por eso el componente importa `FormsModule`.

Los estilos del sidebar, la tabla y el popup están en `src/styles.css`, para que la próxima entidad los reutilice sin copiarlos.

---

## 9. Archivos que quedaron

```text
src/
  environments/environment.ts
  styles.css
  index.html                          # titulo Banco ITM
  app/
    app.config.ts                     # provideRouter + provideHttpClient
    app.routes.ts                     # shell + /usuarios
    app.html                          # <router-outlet />
    models/
      api-respuesta.model.ts
      usuario.model.ts
    services/
      usuario.service.ts
    layout/shell/
      shell.ts
      shell.html
      shell.css
    pages/usuarios/
      usuarios.ts
      usuarios.html
      usuarios.css
```

Backend tocado solo en:

- `src/crud/usuario.py` (`listar` y `actualizar`)
- `src/api/schemas.py` (`UsuarioRead.from_attributes`)

---

## 10. Cómo probarlo

1. Backend arriba en el puerto 8000.
2. `ng serve` y abrir http://localhost:4200/usuarios.
3. Si no hay filas, el mensaje es "No hay registros". Crear uno. Tiene que aparecer en la tabla, sin columna de clave.
4. Buscar por el UUID de esa fila. La tabla queda en una sola fila. Todos vuelve a mostrar el listado.
5. Editar el nombre de usuario. Tiene que persistir. Dejar la clave vacía y comprobar que el login viejo sigue valiendo, si se prueba por `/docs`.
6. Crear otro con el mismo `nombre_usuario`. Tiene que decir que ya existe y el popup no se cierra.
7. Eliminar, confirmar, y la fila desaparece.
8. Apagar uvicorn. Recargar. Tiene que decir que no se pudo conectar con la API.

La siguiente entidad repite los pasos 4 a 8: modelo, servicio, página, una línea en `menu` y una ruta hija. El shell no se reescribe.
