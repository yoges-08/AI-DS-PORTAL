/**
 * Sand & Air Disintegration Animation Engine
 * Creates a cinematic "Golden Sand Upward Draft" dissolve effect when an account is deleted.
 * Configured at 0.35x cinematic slow-motion speed.
 */

const GOLDEN_SAND_PALETTE = [
  '#F59E0B', // Amber 500
  '#D97706', // Amber 600
  '#B45309', // Amber 700
  '#FCD34D', // Amber 300
  '#FDE68A', // Amber 200
  '#FEF3C7', // Amber 100
  '#78350F', // Amber 900
  '#FBBF24'  // Amber 400
];

let canvas = null;
let ctx = null;
let particles = [];
let animationId = null;

function getOrCreateCanvas() {
  if (typeof document === 'undefined') return null;

  if (!canvas) {
    canvas = document.createElement('canvas');
    canvas.id = 'sand-disintegration-canvas';
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100vw';
    canvas.style.height = '100vh';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '99999';
    document.body.appendChild(canvas);

    ctx = canvas.getContext('2d');

    const handleResize = () => {
      if (canvas) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();
  }

  return { canvas, ctx };
}

class SandParticle {
  constructor(x, y, palette) {
    this.x = x;
    this.y = y;
    this.baseX = x;
    this.baseY = y;

    // Sand grain sizing (micro grains with varied granularity)
    this.size = Math.random() * 2.8 + 1.2;
    this.color = palette[Math.floor(Math.random() * palette.length)];
    this.alpha = 1;

    // Extended cinematic lifespan at 0.35x speed
    this.maxLife = Math.random() * 95 + 85;
    this.life = this.maxLife;

    // Upward draft physics (swirling up into the air with 0.35x speed scale)
    const speedScale = 0.35;
    this.vx = ((Math.random() - 0.5) * 4.4) * speedScale;
    this.vy = (Math.random() * -7.5 - 2.8) * speedScale;

    // Swirl and turbulence parameters (atmospheric breeze)
    this.swirlFactor = Math.random() * 0.16 + 0.05;
    this.swirlSpeed = Math.random() * 0.08 + 0.02;
    this.phase = Math.random() * Math.PI * 2;
    this.gravity = (Math.random() * 0.015 - 0.012) * speedScale;
    this.drag = 0.988;
  }

  update() {
    this.life--;
    this.alpha = Math.max(0, this.life / this.maxLife);

    // Turbulence drift
    this.phase += this.swirlSpeed;
    this.vx += Math.sin(this.phase) * this.swirlFactor;
    this.vy += this.gravity;

    this.vx *= this.drag;
    this.vy *= this.drag;

    this.x += this.vx;
    this.y += this.vy;

    // Shrink grain gradually as it dissipates into the air
    this.size = Math.max(0.4, this.size * 0.993);
  }

  draw(context) {
    context.save();
    context.globalAlpha = this.alpha;
    context.fillStyle = this.color;

    // Render smooth circular sand grain
    context.beginPath();
    context.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    context.fill();

    // Occasional subtle glint of sunlight on larger golden sand grains
    if (this.size > 2.0 && Math.random() > 0.88) {
      context.fillStyle = '#FFFFFF';
      context.fillRect(this.x - 0.5, this.y - 0.5, 1, 1);
    }

    context.restore();
  }
}

function animateParticles() {
  if (!ctx || !canvas) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.update();
    p.draw(ctx);

    if (p.life <= 0 || p.alpha <= 0) {
      particles.splice(i, 1);
    }
  }

  if (particles.length > 0) {
    animationId = requestAnimationFrame(animateParticles);
  } else {
    cancelAnimationFrame(animationId);
    animationId = null;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
}

/**
 * Triggers the golden sand upward draft disintegration on a target element.
 * 
 * @param {HTMLElement} element - The DOM element (table row or mobile card)
 * @param {Function} onComplete - Callback executed once disintegration and row collapse finish
 */
export function triggerSandDisintegration(element, onComplete) {
  if (!element) {
    if (onComplete) onComplete();
    return;
  }

  const { canvas: c, ctx: context } = getOrCreateCanvas();
  if (!c || !context) {
    if (onComplete) onComplete();
    return;
  }

  const rect = element.getBoundingClientRect();
  const particleCount = 1500; // Rich, high-density golden sand cloud

  // Phase 1: Apply CSS disintegration wave mask
  element.classList.add('sand-disintegrating');

  // Spawn sand particles across the bounding rectangle in a sweeping wave
  for (let i = 0; i < particleCount; i++) {
    const px = rect.left + Math.random() * rect.width;
    const py = rect.top + Math.random() * rect.height;

    // Stagger spawn along the row width for natural left-to-right sand breakoff
    const timeOffset = ((px - rect.left) / rect.width) * 550; // 0.35x staggered timing

    setTimeout(() => {
      particles.push(new SandParticle(px, py, GOLDEN_SAND_PALETTE));
      if (!animationId) {
        animationId = requestAnimationFrame(animateParticles);
      }
    }, timeOffset);
  }

  // Phase 2: After the sand wave dissolves the row, collapse height gracefully
  setTimeout(() => {
    element.classList.remove('sand-disintegrating');
    element.classList.add('sand-collapsing');

    // Phase 3: Finalize state removal once collapse completes
    setTimeout(() => {
      if (onComplete) {
        onComplete();
      }
    }, 550);
  }, 1200);
}
