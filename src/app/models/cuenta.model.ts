export interface Cuenta {
  id_cuenta: string;
  numero_cuenta: string;
  id_tipo_cuenta: string | null;
  id_usuario: string;
  saldo: number;
  estado: string;
  fecha_apertura: string;
  id_usuario_creacion: string;
  id_usuario_edicion: string | null;
  fecha_creacion: string;
  fecha_edicion: string | null;
}

export interface CuentaCreate {
  numero_cuenta: string;
  id_usuario: string;
  id_usuario_creacion: string;
  id_tipo_cuenta?: string | null;
  saldo?: number;
  estado?: string;
}

export interface CuentaUpdate {
  id_usuario_edicion: string;
  numero_cuenta?: string;
  id_tipo_cuenta?: string | null;
  id_usuario?: string;
  saldo?: number;
  estado?: string;
}