export interface ApiLista<T> {
  data: T[];
  status: number;
  message: string;
}

export interface ApiUno<T> {
  data: T;
  status: number;
  message: string;
}
