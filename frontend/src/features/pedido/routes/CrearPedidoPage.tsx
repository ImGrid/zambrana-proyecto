import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, ShoppingCart, MapPin, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Stepper } from '@/components/ui/Stepper';
import { useCartStore } from '../stores/cart.store';
import { StepCart } from '../components/StepCart';
import { StepDireccion } from '../components/StepDireccion';
import { StepResumen } from '../components/StepResumen';

const steps = [
  { id: 1, label: 'Carrito', icon: ShoppingCart },
  { id: 2, label: 'Dirección', icon: MapPin },
  { id: 3, label: 'Resumen', icon: CheckCircle },
];

export function CrearPedidoPage() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const items = useCartStore((state) => state.items);

  const [direccionData, setDireccionData] = useState({
    direccion_entrega: '',
    latitud_entrega: -17.3935,
    longitud_entrega: -66.1570,
    referencia_ubicacion: '',
    fecha_entrega_solicitada: '',
    observaciones: '',
  });

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      navigate('/cliente/catalogo');
    }
  };

  const canProceed = () => {
    if (currentStep === 1) {
      return items.length > 0;
    }
    if (currentStep === 2) {
      return direccionData.direccion_entrega.length >= 10;
    }
    return false;
  };

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate('/cliente/catalogo')}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Volver al catálogo
        </button>
        <h1 className="text-3xl font-bold text-gray-900">Crear Pedido</h1>
        <p className="text-gray-600 mt-1">
          Completa los siguientes pasos para realizar tu pedido
        </p>
      </div>

      {/* Stepper */}
      <div className="mb-8">
        <Stepper
          steps={steps.map((step) => ({
            id: step.id.toString(),
            label: step.label,
            icon: step.icon,
          }))}
          currentStep={(currentStep - 1).toString()}
          orientation="horizontal"
        />
      </div>

      {/* Step Content */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-6">
        {currentStep === 1 && <StepCart />}
        {currentStep === 2 && (
          <StepDireccion data={direccionData} onChange={setDireccionData} />
        )}
        {currentStep === 3 && <StepResumen direccionData={direccionData} />}
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={handleBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          {currentStep === 1 ? 'Cancelar' : 'Anterior'}
        </Button>

        {currentStep < 3 ? (
          <Button
            variant="primary"
            onClick={handleNext}
            disabled={!canProceed()}
          >
            Siguiente
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        ) : null}
      </div>
    </div>
  );
}
