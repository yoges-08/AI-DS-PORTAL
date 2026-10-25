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
    <div className="glass-card-l2 rounded-2xl border border-white/80 p-3 sm:p-4 mb-6 shadow-xs no-print overflow-hidden">
      {/* Mobile Current Step Context Header */}
      <div className="sm:hidden flex items-center justify-between pb-2 mb-2 border-b border-outline-variant/20 text-xs">
        <span className="font-bold text-primary">
          Step {currentStep} of {STEPS.length}
        </span>
        <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary font-bold text-[11px]">
          {STEPS[currentStep - 1]?.label}
        </span>
      </div>

      <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5 sm:gap-2">
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
              title={isLocked ? 'Locked: Complete previous steps to unlock' : `Go to Step ${step.number}: ${step.label}`}
              className={`flex flex-col items-center justify-center text-center p-1.5 sm:p-2 min-h-[48px] sm:min-h-0 rounded-xl transition-all active:scale-[0.98] ${
                isCurrent
                  ? 'bg-white border border-primary/20 text-primary shadow-sm font-bold'
                  : isCompleted
                  ? 'text-on-surface hover:bg-white/60 cursor-pointer'
                  : 'text-outline-variant bg-surface-container/30 cursor-not-allowed opacity-50'
              }`}
            >
              <div
                className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-[11px] sm:text-xs font-bold mb-0.5 sm:mb-1 transition-transform ${
                  isCurrent
                    ? 'bg-primary text-white ring-2 sm:ring-4 ring-primary/20 scale-105 shadow-sm'
                    : isCompleted
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-surface-variant text-outline'
                }`}
              >
                {isCompleted ? (
                  <Check className="w-3 h-3 sm:w-3.5 sm:h-3.5 stroke-[3]" />
                ) : isLocked ? (
                  <Lock className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-outline/70" />
                ) : (
                  step.number
                )}
              </div>
              <span className={`text-[10px] sm:text-[11px] truncate max-w-full font-medium ${isCurrent ? 'text-primary font-bold' : ''}`}>
                {step.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
