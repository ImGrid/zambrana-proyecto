import { MapPin } from 'lucide-react';
import { Input } from '@/components/ui/Input';

interface DireccionData {
  direccion_entrega: string;
  latitud_entrega: number;
  longitud_entrega: number;
  referencia_ubicacion: string;
  fecha_entrega_solicitada: string;
  observaciones: string;
}

interface StepDireccionProps {
  data: DireccionData;
  onChange: (data: DireccionData) => void;
}

export function StepDireccion({ data, onChange }: StepDireccionProps) {
  const handleChange = (field: keyof DireccionData, value: string | number) => {
    onChange({ ...data, [field]: value });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Dirección de entrega
        </h2>
        <p className="text-sm text-gray-600 mb-4">
          Proporciona la dirección donde deseas recibir los materiales
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Dirección */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Dirección completa <span className="text-red-500">*</span>
          </label>
          <Input
            type="text"
            placeholder="Av. Ejemplo #123, Zona Norte"
            value={data.direccion_entrega}
            onChange={(e) => handleChange('direccion_entrega', e.target.value)}
            className="w-full"
          />
          <p className="text-xs text-gray-500 mt-1">Mínimo 10 caracteres</p>
        </div>

        {/* Referencia */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Referencia de ubicación
          </label>
          <Input
            type="text"
            placeholder="Cerca del mercado principal, edificio azul"
            value={data.referencia_ubicacion}
            onChange={(e) => handleChange('referencia_ubicacion', e.target.value)}
            className="w-full"
          />
        </div>

        {/* Coordenadas */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <MapPin className="h-4 w-4 inline mr-1" />
            Coordenadas GPS
          </label>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-600 mb-1">
                Latitud <span className="text-red-500">*</span>
              </label>
              <Input
                type="number"
                step="0.0001"
                placeholder="-17.3935"
                value={data.latitud_entrega}
                onChange={(e) => handleChange('latitud_entrega', Number(e.target.value))}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">
                Longitud <span className="text-red-500">*</span>
              </label>
              <Input
                type="number"
                step="0.0001"
                placeholder="-66.1570"
                value={data.longitud_entrega}
                onChange={(e) => handleChange('longitud_entrega', Number(e.target.value))}
                className="w-full"
              />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Puedes obtener las coordenadas desde Google Maps
          </p>
        </div>

        {/* Fecha solicitada */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Fecha de entrega solicitada
          </label>
          <Input
            type="date"
            value={data.fecha_entrega_solicitada}
            onChange={(e) => handleChange('fecha_entrega_solicitada', e.target.value)}
            className="w-full"
            min={new Date().toISOString().split('T')[0]}
          />
          <p className="text-xs text-gray-500 mt-1">Opcional - Fecha preferida para la entrega</p>
        </div>

        {/* Observaciones */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Observaciones adicionales
          </label>
          <textarea
            placeholder="Instrucciones especiales, horarios preferidos, etc."
            value={data.observaciones}
            onChange={(e) => handleChange('observaciones', e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />
        </div>
      </div>
    </div>
  );
}
