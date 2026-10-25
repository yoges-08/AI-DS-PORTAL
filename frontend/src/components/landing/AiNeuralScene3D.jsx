import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Zap, Sparkles, Orbit, Compass, RotateCcw, Cpu, Eye, Radio } from 'lucide-react';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export const AiNeuralScene3D = ({ className = '', interactive = true }) => {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const engineRef = useRef(null);

  const [fps, setFps] = useState(60);
  const [activeShape, setActiveShape] = useState('sphere'); // 'sphere' | 'vortex' | 'helix'
  const [pulseActive, setPulseActive] = useState(false);
  const [autoRotate, setAutoRotate] = useState(true);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    let animationFrameId;
    let isDisposed = false;

    // Viewport dimensions
    const width = container.clientWidth || 600;
    const height = container.clientHeight || 520;

    // 1. Scene, Camera, Renderer with High Performance & Color Space
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(48, width / height, 0.1, 100);
    camera.position.set(0, 0, 8.4);

    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Master World Group
    const worldGroup = new THREE.Group();
    scene.add(worldGroup);

    // 2. High-Tech Color Palette for AI & Data Science
    const palette = [
      new THREE.Color('#00F2FE'), // Electric Cyan
      new THREE.Color('#38BDF8'), // Cyber Sky
      new THREE.Color('#2563EB'), // Royal AI Blue
      new THREE.Color('#818CF8'), // Indigo Neon
      new THREE.Color('#C084FC'), // Quantum Purple
      new THREE.Color('#34D399')  // Emerald Tensor
    ];

    // 3. 1,200 Interactive Morphing Quantum Particles
    const PARTICLE_COUNT = 1200;
    const particleGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(PARTICLE_COUNT * 3);
    const targetPositions = new Float32Array(PARTICLE_COUNT * 3);
    const originalPositions = new Float32Array(PARTICLE_COUNT * 3);
    const colors = new Float32Array(PARTICLE_COUNT * 3);
    const scales = new Float32Array(PARTICLE_COUNT);

    // Generate Shape 1: Quantum Sphere with Fibonacci distribution
    const generateSpherePositions = (arr) => {
      const RADIUS = 3.2;
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const phi = Math.acos(1 - (2 * (i + 0.5)) / PARTICLE_COUNT);
        const theta = Math.PI * (1 + Math.sqrt(5)) * (i + 0.5);

        const r = RADIUS * (0.84 + Math.sin(i * 0.15) * 0.2);
        arr[i * 3] = r * Math.sin(phi) * Math.cos(theta);
        arr[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
        arr[i * 3 + 2] = r * Math.cos(phi);
      }
    };

    // Generate Shape 2: Cosmic Torus Vortex
    const generateVortexPositions = (arr) => {
      const R = 3.0;
      const r = 1.1;
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const u = (i / PARTICLE_COUNT) * Math.PI * 4;
        const v = (i / PARTICLE_COUNT) * Math.PI * 2 * 9;

        arr[i * 3] = (R + r * Math.cos(v)) * Math.cos(u);
        arr[i * 3 + 1] = (R + r * Math.cos(v)) * Math.sin(u) * 0.6;
        arr[i * 3 + 2] = r * Math.sin(v) + Math.sin(u * 2) * 0.4;
      }
    };

    // Generate Shape 3: Neural DNA Double-Helix
    const generateHelixPositions = (arr) => {
      const turns = 4;
      const length = 5.6;
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const strand = i % 2 === 0 ? 0 : Math.PI;
        const progress = i / PARTICLE_COUNT;
        const angle = progress * Math.PI * 2 * turns + strand;
        const radius = 1.8;

        arr[i * 3] = Math.cos(angle) * radius;
        arr[i * 3 + 1] = (progress - 0.5) * length;
        arr[i * 3 + 2] = Math.sin(angle) * radius;
      }
    };

    // Initial shape
    generateSpherePositions(positions);
    generateSpherePositions(targetPositions);
    generateSpherePositions(originalPositions);

    // Particle Colors & Scales
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const c = palette[i % palette.length];
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
      scales[i] = 1.0;
    }

    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    // Custom circular soft glow texture for particles
    const createParticleTexture = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 64;
      canvas.height = 64;
      const ctx = canvas.getContext('2d');
      const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
      gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
      gradient.addColorStop(0.2, 'rgba(56, 189, 248, 0.9)');
      gradient.addColorStop(0.55, 'rgba(37, 99, 235, 0.4)');
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 64, 64);
      const texture = new THREE.Texture(canvas);
      texture.needsUpdate = true;
      return texture;
    };

    const particleMaterial = new THREE.PointsMaterial({
      size: 0.14,
      map: createParticleTexture(),
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    const particleSystem = new THREE.Points(particleGeometry, particleMaterial);
    worldGroup.add(particleSystem);

    // 4. Central Holographic Gemstone (Quantum AI Core)
    const crystalGeo = new THREE.OctahedronGeometry(1.2, 2);
    const crystalMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      wireframe: true,
      transparent: true,
      opacity: 0.5
    });
    const crystalMesh = new THREE.Mesh(crystalGeo, crystalMat);
    worldGroup.add(crystalMesh);

    // Glowing Inner Plasma Orb
    const innerPlasmaGeo = new THREE.SphereGeometry(0.7, 24, 24);
    const innerPlasmaMat = new THREE.MeshBasicMaterial({
      color: 0x00f2fe,
      wireframe: true,
      transparent: true,
      opacity: 0.35
    });
    const innerPlasmaMesh = new THREE.Mesh(innerPlasmaGeo, innerPlasmaMat);
    worldGroup.add(innerPlasmaMesh);

    // Point Light emitting from crystal core
    const coreLight = new THREE.PointLight(0x38bdf8, 2.5, 12);
    scene.add(coreLight);

    // 5. Triple Concentric Gyroscopic Cyber Rings
    // Ring 1 (Inner Glowing Dashed Ring)
    const ring1Geo = new THREE.TorusGeometry(2.3, 0.018, 12, 100);
    const ring1Mat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.5,
      wireframe: true
    });
    const ring1 = new THREE.Mesh(ring1Geo, ring1Mat);
    ring1.rotation.x = Math.PI / 3;
    worldGroup.add(ring1);

    // Ring 2 (Middle Orbit with 4 Orbiting Data Crystal Satellites)
    const ring2Geo = new THREE.TorusGeometry(3.3, 0.015, 12, 120);
    const ring2Mat = new THREE.MeshBasicMaterial({
      color: 0x818cf8,
      transparent: true,
      opacity: 0.4
    });
    const ring2 = new THREE.Mesh(ring2Geo, ring2Mat);
    ring2.rotation.y = Math.PI / 4;
    ring2.rotation.x = -Math.PI / 6;
    worldGroup.add(ring2);

    // 4 Orbiting Mini Data Crystals
    const satelliteCount = 4;
    const satellites = [];
    const satGeo = new THREE.BoxGeometry(0.12, 0.12, 0.12);
    const satMat = new THREE.MeshBasicMaterial({
      color: 0x00f2fe,
      wireframe: true
    });

    for (let s = 0; s < satelliteCount; s++) {
      const sat = new THREE.Mesh(satGeo, satMat);
      worldGroup.add(sat);
      satellites.push({
        mesh: sat,
        offset: (s / satelliteCount) * Math.PI * 2,
        radius: 3.3,
        speed: 0.8
      });
    }

    // Ring 3 (Outer Horizon Ring)
    const ring3Geo = new THREE.TorusGeometry(4.2, 0.012, 12, 140);
    const ring3Mat = new THREE.MeshBasicMaterial({
      color: 0x2563eb,
      transparent: true,
      opacity: 0.35
    });
    const ring3 = new THREE.Mesh(ring3Geo, ring3Mat);
    ring3.rotation.z = Math.PI / 5;
    ring3.rotation.y = -Math.PI / 3;
    worldGroup.add(ring3);

    // 6. Connecting Synaptic Energy Arcs (High-voltage lines)
    const ARC_COUNT = 60;
    const arcGeo = new THREE.BufferGeometry();
    const arcPos = new Float32Array(ARC_COUNT * 6);
    arcGeo.setAttribute('position', new THREE.BufferAttribute(arcPos, 3).setUsage(THREE.DynamicDrawUsage));
    const arcMat = new THREE.LineBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.4,
      blending: THREE.AdditiveBlending
    });
    const arcMesh = new THREE.LineSegments(arcGeo, arcMat);
    worldGroup.add(arcMesh);

    // 7. Shockwave Impulse System
    let shockwave = {
      active: false,
      radius: 0,
      maxRadius: 6.5,
      speed: 0.18,
      strength: 1.0
    };

    const triggerBurst = () => {
      shockwave.active = true;
      shockwave.radius = 0;
      setPulseActive(true);
      setTimeout(() => setPulseActive(false), 900);
    };

    // Shape morphing controller
    const setShapeMode = (mode) => {
      setActiveShape(mode);
      if (mode === 'sphere') {
        generateSpherePositions(targetPositions);
      } else if (mode === 'vortex') {
        generateVortexPositions(targetPositions);
      } else if (mode === 'helix') {
        generateHelixPositions(targetPositions);
      }
      triggerBurst();
    };

    // Reset Camera / Rotation
    const resetView = () => {
      gsap.to(worldGroup.rotation, { x: 0, y: 0, z: 0, duration: 1.2, ease: 'power2.out' });
      targetRotX = 0;
      targetRotY = 0;
    };

    engineRef.current = { triggerBurst, setShapeMode, resetView };

    // 8. Interactive Mouse Physics & 3D Tilt Drag
    let isDragging = false;
    let previousPointer = { x: 0, y: 0 };
    let targetRotX = 0;
    let targetRotY = 0;
    let mouseWorld = new THREE.Vector3(999, 999, 999);
    const raycaster = new THREE.Raycaster();
    const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);

    const onPointerDown = (e) => {
      isDragging = true;
      previousPointer = { x: e.clientX, y: e.clientY };
    };

    const onPointerMove = (e) => {
      const rect = container.getBoundingClientRect();
      const normX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const normY = -(((e.clientY - rect.top) / rect.height) * 2 - 1);

      // Raycast mouse position onto 3D plane
      raycaster.setFromCamera(new THREE.Vector2(normX, normY), camera);
      raycaster.ray.intersectPlane(plane, mouseWorld);

      if (isDragging) {
        const deltaX = e.clientX - previousPointer.x;
        const deltaY = e.clientY - previousPointer.y;
        targetRotY += deltaX * 0.009;
        targetRotX += deltaY * 0.009;
        previousPointer = { x: e.clientX, y: e.clientY };
      } else {
        // Subtle magnetic perspective tilt
        targetRotY += (normX * 0.65 - targetRotY) * 0.03;
        targetRotX += (-normY * 0.45 - targetRotX) * 0.03;
      }
    };

    const onPointerUp = () => {
      isDragging = false;
    };

    canvas.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('pointerup', onPointerUp);
    canvas.addEventListener('click', triggerBurst);

    // 9. GSAP ScrollTrigger Integration
    const scrollTriggerInstance = ScrollTrigger.create({
      trigger: container,
      start: 'top top',
      end: 'bottom top',
      scrub: 1.2,
      onUpdate: (self) => {
        const progress = self.progress;
        // Deep cinematic camera dolly & 3D galaxy swirl
        worldGroup.rotation.z = progress * Math.PI * 0.65;
        worldGroup.position.y = -progress * 2.8;
        worldGroup.position.z = -progress * 2.2;
        camera.position.z = 8.4 - progress * 1.5;
      }
    });

    // 10. Resize Observer
    const handleResize = () => {
      if (!container || isDisposed) return;
      const newWidth = container.clientWidth;
      const newHeight = container.clientHeight;
      if (newWidth === 0 || newHeight === 0) return;

      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    // 11. 60 FPS Render Loop with Fluid Wave Harmonics
    let clock = new THREE.Clock();
    let frameCount = 0;
    let lastFpsUpdate = performance.now();

    const animate = () => {
      if (isDisposed) return;
      animationFrameId = requestAnimationFrame(animate);

      const elapsedTime = clock.getElapsedTime();

      // FPS Calculation
      frameCount++;
      const now = performance.now();
      if (now - lastFpsUpdate >= 1000) {
        setFps(Math.round((frameCount * 1000) / (now - lastFpsUpdate)));
        frameCount = 0;
        lastFpsUpdate = now;
      }

      // Continuous Orbital Spin
      if (autoRotate && !isDragging) {
        targetRotY += 0.0022;
      }

      // LERP Damping on World Rotation
      worldGroup.rotation.y += (targetRotY - worldGroup.rotation.y) * 0.055;
      worldGroup.rotation.x += (targetRotX - worldGroup.rotation.x) * 0.055;

      // Rotate Crystal Core
      crystalMesh.rotation.y = elapsedTime * 0.38;
      crystalMesh.rotation.x = elapsedTime * 0.24;
      const breathScale = 1 + 0.08 * Math.sin(elapsedTime * 2.8);
      crystalMesh.scale.set(breathScale, breathScale, breathScale);

      innerPlasmaMesh.rotation.y = -elapsedTime * 0.6;
      innerPlasmaMesh.rotation.z = elapsedTime * 0.35;

      // Gyro Rings Rotation
      ring1.rotation.z = elapsedTime * 0.22;
      ring2.rotation.z = -elapsedTime * 0.18;
      ring3.rotation.z = elapsedTime * 0.12;

      // Orbiting Satellites on Ring 2
      for (let s = 0; s < satelliteCount; s++) {
        const sat = satellites[s];
        const angle = elapsedTime * sat.speed + sat.offset;
        sat.mesh.position.x = Math.cos(angle) * sat.radius;
        sat.mesh.position.y = Math.sin(angle) * sat.radius * 0.7;
        sat.mesh.position.z = Math.sin(angle) * sat.radius * 0.7;
        sat.mesh.rotation.x = elapsedTime * 2;
        sat.mesh.rotation.y = elapsedTime * 3;
      }

      // Shockwave Progress
      if (shockwave.active) {
        shockwave.radius += shockwave.speed;
        if (shockwave.radius > shockwave.maxRadius) {
          shockwave.active = false;
        }
      }

      // Particle Position Animation & Fluid Wave Harmonics
      const posAttr = particleGeometry.attributes.position;
      const posArray = posAttr.array;

      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const idx = i * 3;

        // Smooth transition to target shape
        posArray[idx] += (targetPositions[idx] - posArray[idx]) * 0.04;
        posArray[idx + 1] += (targetPositions[idx + 1] - posArray[idx + 1]) * 0.04;
        posArray[idx + 2] += (targetPositions[idx + 2] - posArray[idx + 2]) * 0.04;

        // Harmonic organic sine breathing
        const wave = Math.sin(elapsedTime * 1.8 + i * 0.05) * 0.004;
        posArray[idx] += wave;
        posArray[idx + 1] += wave;
        posArray[idx + 2] += wave;

        // Interactive Mouse Attraction (Magnetic Gravitational Field)
        const dx = mouseWorld.x - posArray[idx];
        const dy = mouseWorld.y - posArray[idx + 1];
        const dz = mouseWorld.z - posArray[idx + 2];
        const distToMouse = Math.sqrt(dx * dx + dy * dy + dz * dz);

        if (distToMouse < 2.2) {
          const force = (1 - distToMouse / 2.2) * 0.035;
          posArray[idx] += dx * force;
          posArray[idx + 1] += dy * force;
          posArray[idx + 2] += dz * force;
        }

        // Shockwave ripple displacement
        if (shockwave.active) {
          const distToOrigin = Math.sqrt(
            posArray[idx] ** 2 + posArray[idx + 1] ** 2 + posArray[idx + 2] ** 2
          );
          const waveDelta = Math.abs(distToOrigin - shockwave.radius);
          if (waveDelta < 0.75) {
            const push = (1 - waveDelta / 0.75) * 0.09;
            const normX = posArray[idx] / (distToOrigin || 1);
            const normY = posArray[idx + 1] / (distToOrigin || 1);
            const normZ = posArray[idx + 2] / (distToOrigin || 1);
            posArray[idx] += normX * push;
            posArray[idx + 1] += normY * push;
            posArray[idx + 2] += normZ * push;
          }
        }
      }
      posAttr.needsUpdate = true;

      // Update Synaptic Arcs between nearest node clusters
      const arcPosArr = arcGeo.attributes.position.array;
      let arcIdx = 0;
      for (let a = 0; a < ARC_COUNT; a++) {
        const p1 = (a * 19) % PARTICLE_COUNT;
        const p2 = (p1 + 17) % PARTICLE_COUNT;

        arcPosArr[arcIdx++] = posArray[p1 * 3];
        arcPosArr[arcIdx++] = posArray[p1 * 3 + 1];
        arcPosArr[arcIdx++] = posArray[p1 * 3 + 2];

        arcPosArr[arcIdx++] = posArray[p2 * 3];
        arcPosArr[arcIdx++] = posArray[p2 * 3 + 1];
        arcPosArr[arcIdx++] = posArray[p2 * 3 + 2];
      }
      arcGeo.attributes.position.needsUpdate = true;

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      isDisposed = true;
      cancelAnimationFrame(animationFrameId);
      canvas.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      canvas.removeEventListener('click', triggerBurst);
      resizeObserver.disconnect();
      scrollTriggerInstance.kill();

      particleGeometry.dispose();
      particleMaterial.dispose();
      crystalGeo.dispose();
      crystalMat.dispose();
      innerPlasmaGeo.dispose();
      innerPlasmaMat.dispose();
      ring1Geo.dispose();
      ring1Mat.dispose();
      ring2Geo.dispose();
      ring2Mat.dispose();
      ring3Geo.dispose();
      ring3Mat.dispose();
      arcGeo.dispose();
      arcMat.dispose();
      satGeo.dispose();
      satMat.dispose();
      renderer.dispose();
    };
  }, [autoRotate]);

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full select-none ${className}`}
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full block cursor-grab active:cursor-grabbing outline-none"
      />

      {/* Cyberpunk Holographic HUD Header */}
      <div className="absolute top-3 left-4 right-4 pointer-events-none flex items-center justify-between text-xs z-10">
        <div className="flex items-center gap-2 bg-slate-900/90 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-cyan-500/30 text-slate-200 font-mono text-[11px] shadow-lg shadow-cyan-500/10">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          <span className="font-bold text-cyan-300">QUANTUM AI TENSOR FIELD</span>
          <span className="text-white/20 hidden sm:inline">&bull;</span>
          <span className="text-slate-400 hidden sm:inline">{fps} FPS</span>
        </div>

        <div className="flex items-center gap-1.5 bg-blue-600/20 px-3 py-1.5 rounded-full border border-blue-400/30 text-cyan-200 text-[10.5px] font-mono shadow-md backdrop-blur-md">
          <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
          <span className="hidden sm:inline">MAGNETIC CURSOR &bull; CLICK TO BURST</span>
          <span className="sm:hidden">INTERACTIVE 3D</span>
        </div>
      </div>

      {/* Futuristic 3D Controls Bar */}
      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between pointer-events-auto z-10 gap-2 flex-wrap">
        
        {/* Morphing Presets */}
        <div className="flex items-center p-1 bg-slate-900/90 backdrop-blur-md rounded-2xl border border-slate-700/80 shadow-md">
          <button
            type="button"
            onClick={() => engineRef.current?.setShapeMode('sphere')}
            className={`px-2.5 sm:px-3 py-1 rounded-xl text-[10.5px] sm:text-[11px] font-mono font-semibold transition-all cursor-pointer ${
              activeShape === 'sphere'
                ? 'bg-cyan-500 text-slate-950 font-bold shadow-xs'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            Sphere
          </button>
          <button
            type="button"
            onClick={() => engineRef.current?.setShapeMode('vortex')}
            className={`px-2.5 sm:px-3 py-1 rounded-xl text-[10.5px] sm:text-[11px] font-mono font-semibold transition-all cursor-pointer ${
              activeShape === 'vortex'
                ? 'bg-cyan-500 text-slate-950 font-bold shadow-xs'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            Vortex
          </button>
          <button
            type="button"
            onClick={() => engineRef.current?.setShapeMode('helix')}
            className={`px-2.5 sm:px-3 py-1 rounded-xl text-[10.5px] sm:text-[11px] font-mono font-semibold transition-all cursor-pointer ${
              activeShape === 'helix'
                ? 'bg-cyan-500 text-slate-950 font-bold shadow-xs'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            DNA Helix
          </button>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => engineRef.current?.triggerBurst()}
            className={`px-3 py-1.5 rounded-xl text-[11px] font-bold font-mono border backdrop-blur-md transition-all flex items-center gap-1 cursor-pointer active:scale-95 shadow-xs ${
              pulseActive
                ? 'bg-cyan-400 text-slate-900 border-cyan-300 shadow-cyan-400/50 shadow-md'
                : 'bg-white/10 hover:bg-white/20 text-white border-white/20'
            }`}
            title="Fire shockwave pulse"
          >
            <Zap className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Pulse</span>
          </button>

          <button
            type="button"
            onClick={() => setAutoRotate((prev) => !prev)}
            className={`px-2.5 py-1.5 rounded-xl text-[11px] font-mono border backdrop-blur-md transition-all flex items-center gap-1 cursor-pointer active:scale-95 shadow-xs ${
              autoRotate
                ? 'bg-blue-600/60 text-cyan-200 border-blue-400/40'
                : 'bg-white/10 hover:bg-white/20 text-white/70 border-white/20'
            }`}
            title="Toggle orbit rotation"
          >
            <Orbit className={`w-3.5 h-3.5 ${autoRotate ? 'animate-spin' : ''}`} style={{ animationDuration: '6s' }} />
          </button>

          <button
            type="button"
            onClick={() => engineRef.current?.resetView()}
            className="px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 border border-white/20 text-[11px] font-mono backdrop-blur-md transition-all active:scale-95 shadow-xs cursor-pointer"
            title="Reset perspective"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>

    </div>
  );
};
