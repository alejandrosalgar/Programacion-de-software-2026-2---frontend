export interface Accion {
  id_accion: string;
  id_usuario: string;
  tipo_accion: string;
  descripcion: string;
  ip_origen: string | null;
  resultado: string;
  fecha_accion: string;
}

export interface AccionCreate {
  id_usuario: string;
  tipo_accion: string;
  descripcion: string;
  ip_origen: string | null;
  resultado: string;
}

export interface AccionUpdate {
  tipo_accion?: string;
  descripcion?: string;
  ip_origen?: string | null;
  resultado?: string;
}

