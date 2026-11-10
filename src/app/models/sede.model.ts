export interface Sede {
  id_sede: string;
  nombre: string;
  direccion: string;
  ciudad: string;
  telefono: string;
  id_usuario_creacion: string;
  id_usuario_edicion: string | null;
  fecha_creacion: string;
  fecha_edicion: string | null;
}

export interface SedeCreate {
  nombre: string;
  direccion: string;
  ciudad: string;
  telefono: string;
  id_usuario_creacion: string;
}

export interface SedeUpdate {
  nombre?: string;
  direccion?: string;
  ciudad?: string;
  telefono?: string;
  id_usuario_edicion?: string;
}

