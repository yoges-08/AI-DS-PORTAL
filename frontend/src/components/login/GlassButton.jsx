import React from 'react';
import { ArrowRight, Loader2 } from 'lucide-react';

/**
 * GlassButton Component
 * Primary call-to-action button with royal blue gradient, soft glow, loading spinner, and sliding arrow.
 */
export const GlassButton = ({
  type = 'submit',
  disabled = false,
  loading = false,
  children,
  onClick,
  className = '',
  showArrow = true
}) => {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={`glass-button ${className}`}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin text-white" />
      ) : null}
      <span>{children}</span>
      {!loading && showArrow && (
        <ArrowRight className="w-4 h-4 glass-button-arrow text-white" />
      )}
    </button>
  );
};

export default GlassButton;
