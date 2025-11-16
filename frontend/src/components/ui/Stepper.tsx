import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

export interface Step {
  label: string;
  description?: string;
}

export interface StepperProps {
  steps: Step[];
  currentStep: number;
  orientation?: 'horizontal' | 'vertical';
  className?: string;
}

export function Stepper({
  steps,
  currentStep,
  orientation = 'horizontal',
  className,
}: StepperProps) {
  return (
    <div
      className={cn(
        'flex',
        orientation === 'horizontal' ? 'flex-row items-center' : 'flex-col',
        className
      )}
    >
      {steps.map((step, index) => {
        const stepNumber = index + 1;
        const isCompleted = stepNumber < currentStep;
        const isCurrent = stepNumber === currentStep;
        const isUpcoming = stepNumber > currentStep;

        return (
          <div
            key={index}
            className={cn(
              'flex',
              orientation === 'horizontal'
                ? 'flex-1 items-center'
                : 'flex-row items-start'
            )}
          >
            <div
              className={cn(
                'flex items-start',
                orientation === 'horizontal' ? 'flex-col items-center' : 'flex-row'
              )}
            >
              <div
                className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-full border-2 font-semibold text-sm transition-colors',
                  {
                    'border-success-600 bg-success-600 text-white': isCompleted,
                    'border-coral-600 bg-coral-600 text-white': isCurrent,
                    'border-piedra-300 bg-white text-cemento-500': isUpcoming,
                  }
                )}
              >
                {isCompleted ? (
                  <Check className="h-5 w-5" />
                ) : (
                  <span>{stepNumber}</span>
                )}
              </div>

              <div
                className={cn(
                  orientation === 'horizontal'
                    ? 'mt-2 text-center'
                    : 'ml-4 flex-1'
                )}
              >
                <div
                  className={cn(
                    'text-sm font-medium',
                    {
                      'text-success-600': isCompleted,
                      'text-coral-600': isCurrent,
                      'text-cemento-500': isUpcoming,
                    }
                  )}
                >
                  {step.label}
                </div>
                {step.description && (
                  <div className="text-xs text-cemento-500 mt-1">
                    {step.description}
                  </div>
                )}
              </div>
            </div>

            {index < steps.length - 1 && (
              <div
                className={cn(
                  'transition-colors',
                  {
                    'border-success-600': stepNumber < currentStep,
                    'border-piedra-300': stepNumber >= currentStep,
                  },
                  orientation === 'horizontal'
                    ? 'flex-1 border-t-2 mx-2 mt-[-40px]'
                    : 'border-l-2 ml-5 h-12 my-2'
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
