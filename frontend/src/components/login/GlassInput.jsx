import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

/**
 * GlassInput Component
 * Consistent glass styling with label above, left icon, and optional eye toggle for passwords or right custom action.
 */
export const GlassInput = ({
  id,
  label,
  type = 'text',
  value,
  onChange,
  onFocus,
  onBlur,
  placeholder = '',
  icon: Icon,
  required = false,
  autoComplete,
  className = '',
  disabled = false,
  error = '',
  hint = '',
  maxLength,
  rightElement,
  inputRef
}) => {
  const isPassword = type === 'password';
  const [showPassword, setShowPassword] = useState(false);

  const effectiveType = isPassword ? (showPassword ? 'text' : 'password') : type;

  return (
    <div className={`glass-field-group ${className}`}>
      {label && (
        <label htmlFor={id} className="glass-field-label">
          {label} {required && <span className="text-sky-400">*</span>}
        </label>
      )}

      <div className="glass-input-wrapper relative">
        <input
          ref={inputRef}
          id={id}
          type={effectiveType}
          value={value}
          onChange={onChange}
          onFocus={onFocus}
          onBlur={onBlur}
          placeholder={placeholder}
          required={required}
          autoComplete={autoComplete}
          disabled={disabled}
          maxLength={maxLength}
          className={`glass-input ${rightElement ? 'pr-11' : ''}`}
        />

        {Icon && <Icon className="glass-input-icon" />}

        {isPassword ? (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="glass-input-toggle"
            title={showPassword ? 'Hide password' : 'Show password'}
            tabIndex={-1}
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        ) : rightElement ? (
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center z-10">
            {rightElement}
          </div>
        ) : null}
      </div>

      {error ? (
        <span className="text-[11px] text-rose-400 mt-0.5">{error}</span>
      ) : hint ? (
        <span className="text-[11px] text-slate-400 mt-0.5">{hint}</span>
      ) : null}
    </div>
  );
};
