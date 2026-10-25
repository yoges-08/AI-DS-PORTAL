import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Zap, RotateCcw, Compass, Sparkles, Activity } from 'lucide-react';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export const AiNeuralScene3D = ({ className = '', interactive = true }) => {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const sceneMethodsRef = useRef(null);

  const [fps, setFps] = useState(60);
  const [activeConnections, setActiveConnections] = useState(384);
  const [autoRotate, setAutoRotate] = useState(true);
  const [burstActive, setBurstActive] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    let animationFrameId;
    let isDisposed = false;

    // Dimensions
    const width = container.clientWidth || 600;
    const height = container.clientHeight || 500;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(46, width / height, 0.1, 100);
    camera.position.set(0, 0, 8.2);

    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Neural Galaxy master group
    const neuralGroup = new THREE.Group();
    scene.add(neuralGroup);

    // 2. High-Class Colors
    const colors = [
      new THREE.Color('#3B82F6'), // Cyber Royal Blue
      new THREE.Color('#38BDF8'), // Electric Cyan
      new THREE.Color('#6366F1'), // Synapse Indigo
      new THREE.Color('#10B981'), // Tensor Emerald
      new THREE.Color('#8B5CF6')  // Quantum Violet
    ];

    // 3. Ambient Starfield / Deep Space Data Dust
    const STAR_COUNT = 240;
    const starGeo = new THREE.BufferGeometry();
    const starPos = new Float32Array(STAR_COUNT * 3);
    const starColors = new Float32Array(STAR_COUNT * 3);

    for (let i = 0; i < STAR_COUNT; i++) {
      starPos[i * 3] = (Math.random() - 0.5) * 22;
      starPos[i * 3 + 1] = (Math.random() - 0.5) * 22;
      starPos[i * 3 + 2] = (Math.random() - 0.5) * 18;

      const c = colors[i % colors.length];
      starColors[i * 3] = c.r;
      starColors[i * 3 + 1] = c.g;
      starColors[i * 3 + 2] = c.b;
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    starGeo.setAttribute('color', new THREE.BufferAttribute(starColors, 3));

    const starMat = new THREE.PointsMaterial({
      size: 0.05,
      vertexColors: true,
      transparent: true,
      opacity: 0.45,
      blending: THREE.AdditiveBlending
    });
    const starfield = new THREE.Points(starGeo, starMat);
    scene.add(starfield);

    // 4. Neural Nodes (Fibonacci sphere distribution)
    const NODE_COUNT = 150;
    const SPHERE_RADIUS = 3.1;
    const nodePositions = [];
    const basePositions = [];
    const nodeVelocities = [];
    const nodeMeshes = [];

    const nodeGeometry = new THREE.SphereGeometry(0.065, 12, 12);
    const clusterGeometry = new THREE.SphereGeometry(0.13, 16, 16);

    for (let i = 0; i < NODE_COUNT; i++) {
      const phi = Math.acos(1 - (2 * (i + 0.5)) / NODE_COUNT);
      const theta = Math.PI * (1 + Math.sqrt(5)) * (i + 0.5);

      const r = SPHERE_RADIUS * (0.86 + Math.random() * 0.28);
      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.sin(phi) * Math.sin(theta);
      const z = r * Math.cos(phi);

      const pos = new THREE.Vector3(x, y, z);
      nodePositions.push(pos.clone());
      basePositions.push(pos.clone());

      nodeVelocities.push(
        new THREE.Vector3(
          (Math.random() - 0.5) * 0.0035,
          (Math.random() - 0.5) * 0.0035,
          (Math.random() - 0.5) * 0.0035
        )
      );

      const color = colors[i % colors.length];
      const isClusterHead = i % 12 === 0;

      const mat = new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: isClusterHead ? 0.95 : 0.75
      });

      const mesh = new THREE.Mesh(isClusterHead ? clusterGeometry : nodeGeometry, mat);
      mesh.position.copy(pos);
      neuralGroup.add(mesh);
      nodeMeshes.push(mesh);
    }

    // 5. Dynamic Synaptic Lines
    const CONNECTION_DIST = 1.4;
    const maxLineSegments = (NODE_COUNT * (NODE_COUNT - 1)) / 2;
    const linePositions = new Float32Array(maxLineSegments * 6);
    const lineColors = new Float32Array(maxLineSegments * 6);

    const lineGeometry = new THREE.BufferGeometry();
    lineGeometry.setAttribute('position', new THREE.BufferAttribute(linePositions, 3).setUsage(THREE.DynamicDrawUsage));
    lineGeometry.setAttribute('color', new THREE.BufferAttribute(lineColors, 3).setUsage(THREE.DynamicDrawUsage));

    const lineMaterial = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.45,
      blending: THREE.AdditiveBlending
    });

    const linesMesh = new THREE.LineSegments(lineGeometry, lineMaterial);
    neuralGroup.add(linesMesh);

    // 6. Active Data Packets (Tensor Stream)
    const PULSE_COUNT = 28;
    const pulses = [];
    const pulseGeometry = new THREE.SphereGeometry(0.048, 8, 8);
    const pulseMaterial = new THREE.MeshBasicMaterial({
      color: 0x67e8f9,
      transparent: true,
      opacity: 0.95
    });

    for (let p = 0; p < PULSE_COUNT; p++) {
      const fromIdx = Math.floor(Math.random() * NODE_COUNT);
      let toIdx = (fromIdx + 1 + Math.floor(Math.random() * 8)) % NODE_COUNT;
      const mesh = new THREE.Mesh(pulseGeometry, pulseMaterial.clone());
      neuralGroup.add(mesh);
      pulses.push({
        mesh,
        fromIdx,
        toIdx,
        progress: Math.random(),
        speed: 0.009 + Math.random() * 0.014
      });
    }

    // 7. Central Quantum Core (Multi-Faceted Icosahedron)
    const coreGeo = new THREE.IcosahedronGeometry(1.3, 1);
    const coreMat = new THREE.MeshBasicMaterial({
      color: 0x3b82f6,
      wireframe: true,
      transparent: true,
      opacity: 0.38
    });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    neuralGroup.add(coreMesh);

    // Inner Glowing Orb
    const innerOrbGeo = new THREE.SphereGeometry(0.68, 16, 16);
    const innerOrbMat = new THREE.MeshBasicMaterial({
      color: 0x0284c7,
      wireframe: true,
      transparent: true,
      opacity: 0.28
    });
    const innerOrbMesh = new THREE.Mesh(innerOrbGeo, innerOrbMat);
    neuralGroup.add(innerOrbMesh);

    // Gyroscopic Rings with Dual Orbit Angles
    const ringMat1 = new THREE.MeshBasicMaterial({
      color: 0x60a5fa,
      wireframe: true,
      transparent: true,
      opacity: 0.3
    });
    const ring1 = new THREE.Mesh(new THREE.TorusGeometry(3.5, 0.014, 8, 80), ringMat1);
    ring1.rotation.x = Math.PI / 4;
    neuralGroup.add(ring1);

    const ringMat2 = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      wireframe: true,
      transparent: true,
      opacity: 0.24
    });
    const ring2 = new THREE.Mesh(new THREE.TorusGeometry(3.8, 0.012, 8, 80), ringMat2);
    ring2.rotation.y = Math.PI / 3;
    ring2.rotation.x = -Math.PI / 6;
    neuralGroup.add(ring2);

    // 8. Shockwave Ripple System
    let shockwave = { active: false, radius: 0, maxRadius: 5.5, speed: 0.14 };

    const triggerBurst = () => {
      shockwave.active = true;
      shockwave.radius = 0;
      setBurstActive(true);
      setTimeout(() => setBurstActive(false), 900);
    };

    // Reset rotation
    const resetRotation = () => {
      gsap.to(neuralGroup.rotation, { x: 0, y: 0, z: 0, duration: 1, ease: 'power2.out' });
      targetRotationX = 0;
      targetRotationY = 0;
    };

    sceneMethodsRef.current = { triggerBurst, resetRotation };

    // 9. Interactive Drag & Mouse Tracking
    let isDragging = false;
    let previousPointerPosition = { x: 0, y: 0 };
    let targetRotationX = 0;
    let targetRotationY = 0;
    let mouseNormX = 0;
    let mouseNormY = 0;

    const onPointerDown = (e) => {
      isDragging = true;
      previousPointerPosition = { x: e.clientX, y: e.clientY };
    };

    const onPointerMove = (e) => {
      const rect = container.getBoundingClientRect();
      mouseNormX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouseNormY = -(((e.clientY - rect.top) / rect.height) * 2 - 1);

      if (isDragging) {
        const deltaX = e.clientX - previousPointerPosition.x;
        const deltaY = e.clientY - previousPointerPosition.y;

        targetRotationY += deltaX * 0.008;
        targetRotationX += deltaY * 0.008;

        previousPointerPosition = { x: e.clientX, y: e.clientY };
      } else {
        // Subtle proximity target
        targetRotationY += (mouseNormX * 0.5 - targetRotationY) * 0.02;
        targetRotationX += (-mouseNormY * 0.4 - targetRotationX) * 0.02;
      }
    };

    const onPointerUp = () => {
      isDragging = false;
    };

    canvas.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('pointerup', onPointerUp);

    // Click canvas to trigger neural shockwave
    canvas.addEventListener('click', () => {
      triggerBurst();
    });

    // 10. GSAP ScrollTrigger Integration
    const scrollTriggerInstance = ScrollTrigger.create({
      trigger: container,
      start: 'top top',
      end: 'bottom top',
      scrub: 1.2,
      onUpdate: (self) => {
        const progress = self.progress;
        neuralGroup.rotation.z = progress * Math.PI * 0.45;
        neuralGroup.position.y = -progress * 2.5;
        neuralGroup.position.z = -progress * 1.8;
      }
    });

    // 11. Resize Observer
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

    // 12. Animation Loop
    let clock = new THREE.Clock();
    let frameCount = 0;
    let lastFpsUpdate = performance.now();

    const animate = () => {
      if (isDisposed) return;
      animationFrameId = requestAnimationFrame(animate);

      const elapsedTime = clock.getElapsedTime();

      // FPS calculation
      frameCount++;
      const now = performance.now();
      if (now - lastFpsUpdate >= 1000) {
        setFps(Math.round((frameCount * 1000) / (now - lastFpsUpdate)));
        frameCount = 0;
        lastFpsUpdate = now;
      }

      // Continuous slow rotation if autoRotate
      if (autoRotate && !isDragging) {
        targetRotationY += 0.0018;
      }

      // Smooth damping (LERP)
      neuralGroup.rotation.y += (targetRotationY - neuralGroup.rotation.y) * 0.06;
      neuralGroup.rotation.x += (targetRotationX - neuralGroup.rotation.x) * 0.06;

      // Ambient starfield slow drift
      starfield.rotation.y = elapsedTime * 0.015;
      starfield.rotation.x = elapsedTime * 0.008;

      // Rotate quantum core & gyro rings
      coreMesh.rotation.y = elapsedTime * 0.32;
      coreMesh.rotation.x = elapsedTime * 0.2;
      const pulseScale = 1 + 0.07 * Math.sin(elapsedTime * 2.5);
      coreMesh.scale.set(pulseScale, pulseScale, pulseScale);

      innerOrbMesh.rotation.y = -elapsedTime * 0.45;
      ring1.rotation.z = elapsedTime * 0.16;
      ring2.rotation.z = -elapsedTime * 0.14;

      // Shockwave update
      if (shockwave.active) {
        shockwave.radius += shockwave.speed;
        if (shockwave.radius > shockwave.maxRadius) {
          shockwave.active = false;
        }
      }

      // Update Node positions & shockwave displacement
      for (let i = 0; i < NODE_COUNT; i++) {
        const pos = nodePositions[i];
        const vel = nodeVelocities[i];
        pos.add(vel);

        // Shockwave impulse calculation
        if (shockwave.active) {
          const distToCenter = pos.length();
          const waveDelta = Math.abs(distToCenter - shockwave.radius);
          if (waveDelta < 0.6) {
            const pushFactor = (1 - waveDelta / 0.6) * 0.08;
            pos.addScaledVector(pos.clone().normalize(), pushFactor);
            nodeMeshes[i].scale.setScalar(1.6);
          } else {
            nodeMeshes[i].scale.setScalar(1);
          }
        }

        // Bound to radius envelope
        const d = pos.length();
        if (d > SPHERE_RADIUS * 1.3 || d < SPHERE_RADIUS * 0.72) {
          vel.negate();
        }

        nodeMeshes[i].position.copy(pos);
      }

      // Synaptic Lines calculation
      let vertexIndex = 0;
      let colorIndex = 0;
      let connectionsCount = 0;

      for (let i = 0; i < NODE_COUNT; i++) {
        for (let j = i + 1; j < NODE_COUNT; j++) {
          const dist = nodePositions[i].distanceTo(nodePositions[j]);
          if (dist < CONNECTION_DIST) {
            connectionsCount++;
            const alpha = 1 - dist / CONNECTION_DIST;
            const c1 = colors[i % colors.length];
            const c2 = colors[j % colors.length];

            // Point 1
            linePositions[vertexIndex++] = nodePositions[i].x;
            linePositions[vertexIndex++] = nodePositions[i].y;
            linePositions[vertexIndex++] = nodePositions[i].z;
            lineColors[colorIndex++] = c1.r * alpha;
            lineColors[colorIndex++] = c1.g * alpha;
            lineColors[colorIndex++] = c1.b * alpha;

            // Point 2
            linePositions[vertexIndex++] = nodePositions[j].x;
            linePositions[vertexIndex++] = nodePositions[j].y;
            linePositions[vertexIndex++] = nodePositions[j].z;
            lineColors[colorIndex++] = c2.r * alpha;
            lineColors[colorIndex++] = c2.g * alpha;
            lineColors[colorIndex++] = c2.b * alpha;
          }
        }
      }

      if (Math.random() < 0.05) {
        setActiveConnections(connectionsCount);
      }

      lineGeometry.setDrawRange(0, vertexIndex / 3);
      lineGeometry.attributes.position.needsUpdate = true;
      lineGeometry.attributes.color.needsUpdate = true;

      // Update Data Pulses
      for (let p = 0; p < PULSE_COUNT; p++) {
        const pulse = pulses[p];
        pulse.progress += pulse.speed;
        if (pulse.progress >= 1) {
          pulse.progress = 0;
          pulse.fromIdx = pulse.toIdx;
          pulse.toIdx = Math.floor(Math.random() * NODE_COUNT);
        }

        const fromPos = nodePositions[pulse.fromIdx];
        const toPos = nodePositions[pulse.toIdx];
        pulse.mesh.position.lerpVectors(fromPos, toPos, pulse.progress);
      }

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      isDisposed = true;
      cancelAnimationFrame(animationFrameId);
      canvas.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      resizeObserver.disconnect();
      scrollTriggerInstance.kill();

      nodeGeometry.dispose();
      clusterGeometry.dispose();
      lineGeometry.dispose();
      lineMaterial.dispose();
      coreGeo.dispose();
      coreMat.dispose();
      innerOrbGeo.dispose();
      innerOrbMat.dispose();
      starGeo.dispose();
      starMat.dispose();
      renderer.dispose();
    };
  }, [autoRotate]);

  const handleTriggerBurst = () => {
    sceneMethodsRef.current?.triggerBurst();
  };

  const handleReset = () => {
    sceneMethodsRef.current?.resetRotation();
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full select-none ${className}`}
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full block cursor-grab active:cursor-grabbing outline-none"
      />

      {/* High-Class Cyber HUD Header Pill */}
      <div className="absolute top-3 left-4 right-4 pointer-events-none flex items-center justify-between text-xs z-10">
        <div className="flex items-center gap-2 bg-slate-900/80 backdrop-blur-md px-3 py-1 rounded-full border border-slate-700/60 text-slate-300 font-mono text-[11px] shadow-sm">
          <Activity className="w-3 h-3 text-cyan-400 animate-pulse" />
          <span>QUANTUM NEURAL MESH</span>
          <span className="text-white/30 hidden sm:inline">&bull;</span>
          <span className="text-cyan-400 font-bold hidden sm:inline">LIVE 3D</span>
        </div>

        <div className="flex items-center gap-1.5 bg-blue-500/10 px-2.5 py-1 rounded-full border border-blue-400/25 text-cyan-300 text-[10px] font-mono shadow-xs backdrop-blur-md">
          <Sparkles className="w-3 h-3 text-cyan-400" />
          <span className="hidden sm:inline">DRAG TO ORBIT &bull; CLICK TO PULSE</span>
          <span className="sm:hidden">INTERACTIVE 3D</span>
        </div>
      </div>

      {/* Interactive Controls Overlay Bar */}
      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between pointer-events-auto z-10 gap-2 flex-wrap">
        
        {/* Telemetry info */}
        <div className="flex items-center gap-2 bg-slate-900/85 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 text-[10px] text-cyan-300 font-mono tracking-wider shadow-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
          <span>{fps} FPS</span>
          <span className="text-white/30">&bull;</span>
          <span>150 NODES</span>
          <span className="text-white/30 hidden sm:inline">&bull;</span>
          <span className="text-white/70 hidden sm:inline">{activeConnections} SYNAPSES</span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleTriggerBurst}
            className={`px-3 py-1.5 rounded-xl text-[11px] font-bold font-mono border backdrop-blur-md transition-all flex items-center gap-1 cursor-pointer active:scale-95 shadow-xs ${
              burstActive
                ? 'bg-cyan-400 text-slate-900 border-cyan-300 shadow-cyan-400/40 shadow-md'
                : 'bg-white/10 hover:bg-white/20 text-white border-white/20'
            }`}
            title="Trigger neural shockwave"
          >
            <Zap className="w-3 h-3 text-cyan-400" />
            <span className="hidden sm:inline">Pulse Synapse</span>
          </button>

          <button
            type="button"
            onClick={() => setAutoRotate((prev) => !prev)}
            className={`px-2.5 py-1.5 rounded-xl text-[11px] font-mono border backdrop-blur-md transition-all flex items-center gap-1 cursor-pointer active:scale-95 shadow-xs ${
              autoRotate
                ? 'bg-blue-600/60 text-cyan-200 border-blue-400/40'
                : 'bg-white/10 hover:bg-white/20 text-white/70 border-white/20'
            }`}
            title="Toggle continuous auto-orbit"
          >
            <Compass className={`w-3 h-3 ${autoRotate ? 'animate-spin' : ''}`} style={{ animationDuration: '6s' }} />
            <span className="hidden sm:inline">{autoRotate ? 'Orbit On' : 'Paused'}</span>
          </button>

          <button
            type="button"
            onClick={handleReset}
            className="px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 border border-white/20 text-[11px] font-mono backdrop-blur-md transition-all active:scale-95 shadow-xs"
            title="Reset camera rotation"
          >
            <RotateCcw className="w-3 h-3" />
          </button>
        </div>

      </div>

    </div>
  );
};
