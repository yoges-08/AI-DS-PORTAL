import React from 'react';
import { Check, Lock } from 'lucide-react';

const STEPS = [
  { number: 1, label: 'Personal' },
  { number: 2, label: 'Contact' },
  { number: 3, label: 'Family' },
  { number: 4, label: 'Academic' },
  { number: 5, label: 'Scholarship' },
  { number: 6, label: 'Bank' },
  { number: 7, label: 'Documents' },
  { number: 8, label: 'Review' },
];

export const ProgressBar = ({ currentStep, onSelectStep }) => {
  return (
    <div className="bg-white border border-gov-border rounded p-3 mb-6 shadow-sm no-print">
      <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
        {STEPS.map((step) => {
          const isCurrent = step.number === currentStep;
          const isCompleted = step.number < currentStep;
          const isLocked = step.number > currentStep;

          return (
            <button
              key={step.number}
              type="button"
              disabled={isLocked}
              onClick={() => onSelectStep && onSelectStep(step.number)}
              title={isLocked ? 'Locked: Complete current step details to unlock' : `Go to Step ${step.number}: ${step.label}`}
              className={`flex flex-col items-center text-center p-1.5 rounded transition-colors ${
                isCurrent
                  ? 'bg-blue-50 border border-gov-navy text-gov-navy shadow-sm'
                  : isCompleted
                  ? 'text-gray-700 hover:bg-gray-50 cursor-pointer'
                  : 'text-gray-400 bg-gray-50/50 cursor-not-allowed opacity-60'
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold mb-1 ${
                  isCurrent
                    ? 'bg-gov-navy text-white ring-2 ring-blue-300'
                    : isCompleted
                    ? 'bg-green-700 text-white'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                {isCompleted ? (
                  <Check className="w-3.5 h-3.5" />
                ) : isLocked ? (
                  <Lock className="w-3 h-3 text-gray-400" />
                ) : (
                  step.number
                )}
              </div>
              <span className={`text-[11px] leading-tight font-medium ${isCurrent ? 'font-bold text-gov-navy' : ''}`}>
                {step.label}
              </span>
            </button>
          );
        })}
      </div>
      
      {/* Progress percentage bar */}
      <div className="w-full bg-gray-200 h-1.5 rounded mt-2.5 overflow-hidden">
        <div 
          className="bg-gov-navy h-full transition-all duration-300"
          style={{ width: `${((currentStep - 1) / 7) * 100}%` }}
        ></div>
      </div>
    </div>
  );
};
