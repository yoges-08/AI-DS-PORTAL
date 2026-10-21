import React, { useRef } from 'react';

/**
 * Submit button that gently follows the mouse (desktop only) and shimmers on hover.
 * Automatically disabled on touch screens and for "reduce motion" users.
 */
export const MagneticButton = ({ children, className = '', ...props }) => {
  const ref = useRef(null);

  const canMove = () =>
    typeof window !== 'undefined' &&
    window.matchMedia('(hover: hover) and (prefers-reduced-motion: no-preference)').matches;

  const handleMove = (e) => {
    if (props.disabled || !canMove() || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    const x = e.clientX - r.left - r.width / 2;
    const y = e.clientY - r.top - r.height / 2;
    ref.current.style.transform = `translate(${x * 0.18}px, ${y * 0.25}px)`;
  };

  const handleLeave = () => {
    if (ref.current) ref.current.style.transform = '';
  };

  return (
    <button
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      className={`login-btn ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default MagneticButton;
