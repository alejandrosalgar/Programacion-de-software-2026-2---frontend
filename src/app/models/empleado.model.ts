export interface Empleado {
  id_empleado: string;
  id_usuario: string;
  id_sucursal: string;
  cargo: string;
  activo: boolean;
  id_usuario_creacion: string | null;
  fecha_creacion: string | null;
  id_usuario_edicion: string | null;
  fecha_edicion: string | null;
}

export interface EmpleadoCreate {
  id_usuario: string;
  id_sucursal: string;
  cargo: string;
  activo?: boolean;
  id_usuario_creacion?: string | null;
}

export interface EmpleadoUpdate {
  id_usuario?: string;
  id_sucursal?: string;
  cargo?: string;
  activo?: boolean;
  id_usuario_creacion?: string | null;
}