export interface Sucursal {
  id_sucursal: string;
  nombre: string;
  direccion: string;
  ciudad: string;
  telefono: string;
  id_usuario_creacion: string | null;
  fecha_creacion: string | null;
  id_usuario_edicion: string | null;
  fecha_edicion: string | null;
}

export interface SucursalCreate {
  nombre: string;
  direccion: string;
  ciudad: string;
  telefono: string;
  id_usuario_creacion?: string | null;
}

export interface SucursalUpdate {
  nombre?: string;
  direccion?: string;
  ciudad?: string;
  telefono?: string;
  id_usuario_creacion?: string | null;
}