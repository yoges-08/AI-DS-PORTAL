import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export const AiNeuralScene3D = ({ className = '', interactive = true }) => {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const [isHovered, setIsHovered] = useState(false);
  const [fps, setFps] = useState(60);

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
    camera.position.set(0, 0, 7.8);

    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Group holding the entire neural galaxy
    const neuralGroup = new THREE.Group();
    scene.add(neuralGroup);

    // 2. Color Palette for AI & Data Science
    const colors = [
      new THREE.Color('#2563EB'), // Royal AI Blue
      new THREE.Color('#38BDF8'), // Cyber Sky Cyan
      new THREE.Color('#6366F1'), // Deep Synapse Indigo
      new THREE.Color('#0284C7'), // Azure Tensor
      new THREE.Color('#10B981')  // Emerald Gate
    ];

    // 3. Generate Neural Nodes (Spherical Distribution)
    const NODE_COUNT = 140;
    const SPHERE_RADIUS = 3.0;
    const nodePositions = [];
    const nodeVelocities = [];
    const nodeMeshes = [];

    const nodeGeometry = new THREE.SphereGeometry(0.065, 12, 12);
    const clusterGeometry = new THREE.SphereGeometry(0.12, 16, 16);

    for (let i = 0; i < NODE_COUNT; i++) {
      // Golden Spiral / Fibonacci sphere distribution
      const phi = Math.acos(1 - (2 * (i + 0.5)) / NODE_COUNT);
      const theta = Math.PI * (1 + Math.sqrt(5)) * (i + 0.5);

      const r = SPHERE_RADIUS * (0.85 + Math.random() * 0.3);
      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.sin(phi) * Math.sin(theta);
      const z = r * Math.cos(phi);

      const pos = new THREE.Vector3(x, y, z);
      nodePositions.push(pos);

      // Micro drift velocities for organic breathing movement
      nodeVelocities.push(
        new THREE.Vector3(
          (Math.random() - 0.5) * 0.003,
          (Math.random() - 0.5) * 0.003,
          (Math.random() - 0.5) * 0.003
        )
      );

      // Assign palette color
      const color = colors[i % colors.length];
      const isClusterHead = i % 14 === 0;

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

    // 4. Synaptic Lines (Connections between nearby nodes)
    const CONNECTION_DIST = 1.35;
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

    // 5. Active Signal Pulses (Data Packets traversing synapses)
    const PULSE_COUNT = 24;
    const pulses = [];
    const pulseGeometry = new THREE.SphereGeometry(0.045, 8, 8);
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
        speed: 0.008 + Math.random() * 0.012
      });
    }

    // 6. Central Holographic Quantum Core (Icosahedron Wireframe)
    const coreGeo = new THREE.IcosahedronGeometry(1.25, 1);
    const coreMat = new THREE.MeshBasicMaterial({
      color: 0x3b82f6,
      wireframe: true,
      transparent: true,
      opacity: 0.38
    });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    neuralGroup.add(coreMesh);

    // Glowing Inner Orb
    const innerOrbGeo = new THREE.SphereGeometry(0.65, 16, 16);
    const innerOrbMat = new THREE.MeshBasicMaterial({
      color: 0x0284c7,
      wireframe: true,
      transparent: true,
      opacity: 0.25
    });
    const innerOrbMesh = new THREE.Mesh(innerOrbGeo, innerOrbMat);
    neuralGroup.add(innerOrbMesh);

    // 7. Gyroscopic Orbit Rings
    const ringMat1 = new THREE.MeshBasicMaterial({
      color: 0x60a5fa,
      wireframe: true,
      transparent: true,
      opacity: 0.3
    });
    const ring1 = new THREE.Mesh(new THREE.TorusGeometry(3.4, 0.012, 8, 80), ringMat1);
    ring1.rotation.x = Math.PI / 4;
    neuralGroup.add(ring1);

    const ringMat2 = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      wireframe: true,
      transparent: true,
      opacity: 0.22
    });
    const ring2 = new THREE.Mesh(new THREE.TorusGeometry(3.7, 0.01, 8, 80), ringMat2);
    ring2.rotation.y = Math.PI / 3;
    ring2.rotation.x = -Math.PI / 6;
    neuralGroup.add(ring2);

    // 8. Mouse / Pointer tracking with smooth damping
    let mouseX = 0;
    let mouseY = 0;
    let targetRotationX = 0;
    let targetRotationY = 0;

    const handlePointerMove = (e) => {
      if (!interactive) return;
      const rect = container.getBoundingClientRect();
      const clientX = e.clientX ?? (e.touches && e.touches[0]?.clientX);
      const clientY = e.clientY ?? (e.touches && e.touches[0]?.clientY);
      if (clientX === undefined || clientY === undefined) return;

      mouseX = ((clientX - rect.left) / rect.width) * 2 - 1;
      mouseY = -(((clientY - rect.top) / rect.height) * 2 - 1);

      targetRotationY = mouseX * 0.75;
      targetRotationX = -mouseY * 0.55;
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });

    // 9. GSAP ScrollTrigger Integration
    const scrollTriggerInstance = ScrollTrigger.create({
      trigger: container,
      start: 'top top',
      end: 'bottom top',
      scrub: 1.2,
      onUpdate: (self) => {
        // Dynamic scroll reaction: as the user scrolls down, camera tilts and galaxy rotates
        const progress = self.progress;
        neuralGroup.rotation.z = progress * Math.PI * 0.5;
        neuralGroup.position.y = -progress * 2.2;
        neuralGroup.position.z = -progress * 1.5;
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

    // 11. Render Animation Loop
    let clock = new THREE.Clock();
    let frameCount = 0;
    let lastFpsUpdate = performance.now();

    const animate = () => {
      if (isDisposed) return;
      animationFrameId = requestAnimationFrame(animate);

      const elapsedTime = clock.getElapsedTime();

      // FPS counter (periodic sampling)
      frameCount++;
      const now = performance.now();
      if (now - lastFpsUpdate >= 1000) {
        setFps(Math.round((frameCount * 1000) / (now - lastFpsUpdate)));
        frameCount = 0;
        lastFpsUpdate = now;
      }

      // Smooth mouse rotation damping (LERP)
      neuralGroup.rotation.y += (targetRotationY - neuralGroup.rotation.y) * 0.045 + 0.0018;
      neuralGroup.rotation.x += (targetRotationX - neuralGroup.rotation.x) * 0.045;

      // Rotate central quantum core & gyro-rings
      coreMesh.rotation.y = elapsedTime * 0.28;
      coreMesh.rotation.x = elapsedTime * 0.18;
      const pulseScale = 1 + 0.06 * Math.sin(elapsedTime * 2.2);
      coreMesh.scale.set(pulseScale, pulseScale, pulseScale);

      innerOrbMesh.rotation.y = -elapsedTime * 0.4;
      ring1.rotation.z = elapsedTime * 0.15;
      ring2.rotation.z = -elapsedTime * 0.12;

      // Update Node positions (subtle organic breathing)
      for (let i = 0; i < NODE_COUNT; i++) {
        const pos = nodePositions[i];
        const vel = nodeVelocities[i];
        pos.add(vel);

        // Keep inside bounds
        const d = pos.length();
        if (d > SPHERE_RADIUS * 1.25 || d < SPHERE_RADIUS * 0.75) {
          vel.negate();
        }

        nodeMeshes[i].position.copy(pos);
      }

      // Update Synaptic Lines
      let vertexIndex = 0;
      let colorIndex = 0;

      for (let i = 0; i < NODE_COUNT; i++) {
        for (let j = i + 1; j < NODE_COUNT; j++) {
          const dist = nodePositions[i].distanceTo(nodePositions[j]);
          if (dist < CONNECTION_DIST) {
            // Normalized intensity based on proximity
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

    // 12. Cleanup
    return () => {
      isDisposed = true;
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('pointermove', handlePointerMove);
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
      renderer.dispose();
    };
  }, [interactive]);

  return (
    <div
      ref={containerRef}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`relative w-full h-full select-none ${className}`}
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full block cursor-grab active:cursor-grabbing outline-none"
      />

      {/* Futuristic Floating Telemetry HUD Pill */}
      <div className="absolute bottom-3 left-4 pointer-events-none flex items-center gap-2 bg-slate-900/60 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 text-[10px] text-cyan-300 font-mono tracking-wider shadow-sm">
        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
        <span>NEURAL CORE 3D</span>
        <span className="text-white/40">&bull;</span>
        <span className="text-white/70">{fps} FPS</span>
        <span className="text-white/40">&bull;</span>
        <span className="text-white/70">140 NODES</span>
      </div>
    </div>
  );
};
