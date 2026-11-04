import React, { useEffect, useRef } from 'react';

/**
 * StudentNeuralBackground
 * Option 1: AI Neural Mesh & Connected Synaptic Nodes
 * High-performance, hardware-accelerated interactive canvas background
 * designed specifically for the AI & DS Student Information Portal.
 */
export const StudentNeuralBackground = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId;
    let particles = [];
    const mouse = { x: null, y: null, radius: 140 };

    // Handle high-DPI displays (Retina)
    const resizeCanvas = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = window.innerWidth;
      const height = window.innerHeight;

      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      ctx.scale(dpr, dpr);
      initParticles(width, height);
    };

    class NeuralNode {
      constructor(w, h) {
        this.x = Math.random() * w;
        this.y = Math.random() * h;
        this.w = w;
        this.h = h;
        this.vx = (Math.random() - 0.5) * 0.65;
        this.vy = (Math.random() - 0.5) * 0.65;
        this.size = Math.random() * 1.8 + 1.4;
        // Cyan (#0ea5e9) and Royal Indigo (#6366f1) palette
        this.color = Math.random() > 0.45 ? '14, 165, 233' : '99, 102, 241';
        this.alpha = Math.random() * 0.35 + 0.35;
      }

      update(width, height) {
        this.x += this.vx;
        this.y += this.vy;

        // Wrap around screen edges
        if (this.x < 0) this.x = width;
        else if (this.x > width) this.x = 0;
        if (this.y < 0) this.y = height;
        else if (this.y > height) this.y = 0;

        // Interactive mouse magnetic influence
        if (mouse.x !== null && mouse.y !== null) {
          const dx = mouse.x - this.x;
          const dy = mouse.y - this.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < mouse.radius && dist > 0) {
            const angle = Math.atan2(dy, dx);
            const force = (mouse.radius - dist) / mouse.radius;
            this.x -= Math.cos(angle) * force * 2.8;
            this.y -= Math.sin(angle) * force * 2.8;
          }
        }
      }

      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${this.color}, ${this.alpha})`;
        ctx.shadowBlur = 6;
        ctx.shadowColor = `rgba(${this.color}, 0.4)`;
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    }

    const initParticles = (width, height) => {
      particles = [];
      // Calculate node density clamped for optimal 60fps performance
      const count = Math.min(Math.max(Math.floor((width * height) / 15000), 35), 75);
      for (let i = 0; i < count; i++) {
        particles.push(new NeuralNode(width, height));
      }
    };

    const render = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;

      ctx.clearRect(0, 0, width, height);

      // Draw synaptic connection lines between neighboring nodes
      const pLen = particles.length;
      for (let i = 0; i < pLen; i++) {
        for (let j = i + 1; j < pLen; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 130) {
            const lineAlpha = (1 - dist / 130) * 0.24;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(14, 165, 233, ${lineAlpha})`;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
      }

      // Update and render nodes
      for (let i = 0; i < pLen; i++) {
        particles[i].update(width, height);
        particles[i].draw();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    // Event listeners
    const handleMouseMove = (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };

    const handleMouseLeave = () => {
      mouse.x = null;
      mouse.y = null;
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        cancelAnimationFrame(animationFrameId);
      } else {
        animationFrameId = requestAnimationFrame(render);
      }
    };

    window.addEventListener('resize', resizeCanvas, { passive: true });
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('mouseleave', handleMouseLeave, { passive: true });
    document.addEventListener('visibilitychange', handleVisibilityChange);

    resizeCanvas();
    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return (
    <div 
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden" 
      aria-hidden="true"
    >
      {/* Soft atmospheric glow accents in the corners */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-cyan-400/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute top-1/2 -right-32 w-96 h-96 bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-32 left-1/3 w-96 h-96 bg-sky-300/10 rounded-full blur-[110px] pointer-events-none" />

      {/* Interactive Neural Canvas */}
      <canvas 
        ref={canvasRef} 
        className="absolute inset-0 w-full h-full pointer-events-none" 
      />
    </div>
  );
};

export default StudentNeuralBackground;
