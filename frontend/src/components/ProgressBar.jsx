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
              title={isLocked ? 'Locked: Complete previous steps to unlock' : `Go to Step ${step.number}: ${step.label}`}
              className={`flex flex-col items-center text-center p-2 rounded-xl transition-all active:scale-[0.98] ${
                isCurrent
                  ? 'bg-white border border-primary/20 text-primary shadow-sm font-bold'
                  : isCompleted
                  ? 'text-on-surface hover:bg-white/60 cursor-pointer'
                  : 'text-outline-variant bg-surface-container/30 cursor-not-allowed opacity-50'
              }`}
            >
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold mb-1 transition-transform ${
                  isCurrent
                    ? 'bg-primary text-white ring-4 ring-primary/20 scale-105 shadow-sm'
                    : isCompleted
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-surface-variant text-outline'
                }`}
              >
                {isCompleted ? (
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                ) : isLocked ? (
                  <Lock className="w-3 h-3 text-outline/70" />
                ) : (
                  step.number
                )}
              </div>
              <span className={`text-[11px] truncate max-w-full font-medium ${isCurrent ? 'text-primary font-bold' : ''}`}>
                {step.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
