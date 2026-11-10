export interface Cuota {
  id_cuota: string;
  id_prestamo: string;
  valor: number;
  numero_cuota: number;
  fecha_vencimiento: string;
  estado: string;
  id_usuario_creacion: string | null;
  fecha_creacion: string | null;
  id_usuario_edicion: string | null;
  fecha_edicion: string | null;
}

export interface CuotaCreate {
  id_prestamo: string;
  valor: number;
  numero_cuota: number;
  fecha_vencimiento: string;
  estado?: string;
  id_usuario_creacion?: string | null;
}

export interface CuotaUpdate {
  id_prestamo?: string;
  valor?: number;
  numero_cuota?: number;
  fecha_vencimiento?: string;
  estado?: string;
  id_usuario_edicion?: string | null;
}