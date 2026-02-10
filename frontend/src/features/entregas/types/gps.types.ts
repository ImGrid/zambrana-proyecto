// TIPOS DE GPS - COINCIDEN EXACTAMENTE CON BACKEND

// Posición GPS del camión durante la entrega
// backend/src/modules/entregas/gps.repository.ts líneas 6-20
export interface PosicionGPS {
  id: number;
  entrega_id: number;
  conductor_id: number;
  camion_id: number;
  latitud: number;
  longitud: number;
  velocidad_kmh: number | null;
  direccion_grados: number | null;
  precision_metros: number | null;
  timestamp: Date;
}
