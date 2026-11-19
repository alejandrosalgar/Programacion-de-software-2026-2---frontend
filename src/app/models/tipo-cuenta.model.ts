export interface TipoCuenta {
  id_tipo_cuenta: string;
  nombre: string;
  descripcion: string;
  tasa_interes: number;
  monto_minimo_apertura: number;
  requiere_mantenimiento: boolean;
  estado: string;
  id_usuario_creacion: string;
  id_usuario_edicion: string | null;
  fecha_creacion: string | null;
  fecha_edicion: string | null;
}

export interface TipoCuentaCreate {
  nombre: string;
  descripcion: string;
  tasa_interes: number;
  monto_minimo_apertura: number;
  requiere_mantenimiento: boolean;
  estado: string;
  id_usuario_creacion: string;
}

export interface TipoCuentaUpdate {
  nombre?: string;
  descripcion?: string;
  tasa_interes?: number;
  monto_minimo_apertura?: number;
  requiere_mantenimiento?: boolean;
  estado?: string;
  id_usuario_edicion?: string;
}