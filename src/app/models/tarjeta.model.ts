export interface Tarjeta {
  id_tarjeta: string;
  id_cuenta: string;
  numero_tarjeta: string;
  tipo_tarjeta: string;
  fecha_emision: string;
  fecha_vencimiento: string;
  cvv: string;
  limite_credito: number;
  estado: string;
  id_usuario_creacion: string;
  id_usuario_edicion: string | null;
  fecha_creacion: string;
  fecha_edicion: string | null;
}

export interface TarjetaCreate {
  id_cuenta: string;
  numero_tarjeta: string;
  tipo_tarjeta: string;
  fecha_emision: string;
  fecha_vencimiento: string;
  cvv: string;
  limite_credito: number;
  estado: string;
  id_usuario_creacion: string;
}

export interface TarjetaUpdate {
  numero_tarjeta?: string;
  tipo_tarjeta?: string;
  fecha_vencimiento?: string;
  cvv?: string;
  limite_credito?: number;
  estado?: string;
  id_cuenta?: string;
  id_usuario_edicion?: string;
}

