import React from 'react';

/**
 * GlassScene Component (White Theme Edition)
 * Luminous frosted ambient background with floating glass bubbles,
 * providing subtle depth behind the white glass card.
 */
export const GlassScene = () => {
  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none select-none">
      {/* 1. Translucent Light Mesh Gradient */}
      <div
        className="absolute inset-0 w-full h-full"
        style={{
          background: 'radial-gradient(110% 90% at 15% 15%, rgba(235, 244, 255, 0.45) 0%, rgba(248, 250, 252, 0.3) 45%, rgba(237, 242, 247, 0.35) 100%)'
        }}
      />

      {/* 2. Soft Ambient Blue & Cyan Glow Spheres */}
      <div
        className="absolute -top-[15%] -left-[10%] w-[55vw] h-[55vw] rounded-full blur-[90px] opacity-60 pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(191, 219, 254, 0.5) 0%, rgba(224, 231, 255, 0.2) 60%, transparent 100%)'
        }}
      />
      <div
        className="absolute -bottom-[15%] -right-[10%] w-[50vw] h-[50vw] rounded-full blur-[90px] opacity-50 pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(186, 230, 253, 0.45) 0%, rgba(219, 234, 254, 0.2) 60%, transparent 100%)'
        }}
      />

      {/* 3. Floating Luminous Glass Bubbles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Bubble 1: Top-Left */}
        <div
          className="glass-floating-bubble"
          style={{
            width: '68px',
            height: '68px',
            top: '16%',
            left: '12%',
            animationDelay: '0s',
            animationDuration: '9s'
          }}
        />

        {/* Bubble 2: Bottom-Right */}
        <div
          className="glass-floating-bubble"
          style={{
            width: '88px',
            height: '88px',
            bottom: '15%',
            right: '12%',
            animationDelay: '2s',
            animationDuration: '11s'
          }}
        />

        {/* Bubble 3: Mid-Right Small */}
        <div
          className="glass-floating-bubble"
          style={{
            width: '44px',
            height: '44px',
            top: '40%',
            right: '22%',
            animationDelay: '4s',
            animationDuration: '8s'
          }}
        />

        {/* Bubble 4: Mid-Left Small */}
        <div
          className="glass-floating-bubble"
          style={{
            width: '50px',
            height: '50px',
            bottom: '32%',
            left: '18%',
            animationDelay: '1.5s',
            animationDuration: '10s'
          }}
        />

        {/* Bubble 5: Top-Right Tiny */}
        <div
          className="glass-floating-bubble"
          style={{
            width: '34px',
            height: '34px',
            top: '22%',
            right: '32%',
            animationDelay: '3s',
            animationDuration: '7s'
          }}
        />
      </div>
    </div>
  );
};

export default GlassScene;
