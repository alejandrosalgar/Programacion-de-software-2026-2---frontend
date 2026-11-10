export interface Beneficiario {
  id_beneficiario: string;
  id_cliente: string;
  nombre_completo: string;
  parentesco: string;
  telefono: string;
  id_usuario_creacion: string;
  id_usuario_edicion: string | null;
  fecha_creacion: string;
  fecha_edicion: string | null;
}

export interface BeneficiarioCreate {
  id_cliente: string;
  nombre_completo: string;
  parentesco: string;
  telefono: string;
  id_usuario_creacion: string;
}

export interface BeneficiarioUpdate {
  nombre_completo?: string;
  parentesco?: string;
  telefono?: string;
  id_usuario_edicion?: string;
}

