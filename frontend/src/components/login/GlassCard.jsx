import React from 'react';

/**
 * GlassCard Component
 * Manages the chamfered geometric clip-path, signature corner wedges,
 * center morph logo merge, shockwave ripple ring, and frosted glass backing.
 */
export const GlassCard = ({ phase = 'idle', children }) => {
  return (
    <div className="glass-card-wrapper">
      <section
        className="glass-card"
        data-phase={phase}
        aria-busy={phase !== 'idle'}
      >
        {/* Top-Left Signature Wedge */}
        <span className="glass-wedge glass-wedge--tl" aria-hidden="true" />

        {/* Bottom-Right Signature Wedge */}
        <span className="glass-wedge glass-wedge--br" aria-hidden="true" />

        {/* Center Morph Reveal: Department Logo & Glowing Shockwave Ring */}
        <div className="glass-morph-center" aria-hidden={phase !== 'morph'}>
          <div className="glass-morph-ring" />
          <div className="glass-morph-logo">
            <img
              src="/aids-logo.jpg"
              alt="AI&DS Department Logo"
              onError={(e) => {
                // Graceful fallback to college logo if aids-logo isn't loaded
                e.currentTarget.src = '/college-logo.webp';
              }}
            />
          </div>
        </div>

        {/* Card Content Wrapper */}
        <div className="glass-card-content">
          {children}
        </div>
      </section>
    </div>
  );
};
