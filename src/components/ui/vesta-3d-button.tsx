"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

interface Vesta3DButtonProps {
  text?: string;
  onClick?: () => void;
  className?: string;
  variant?: "primary" | "secondary" | "glass";
}

export function Vesta3DButton({
  text = "Vesta Image Studio",
  onClick,
  className = "",
  variant = "primary",
}: Vesta3DButtonProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    buttonMesh: THREE.Mesh;
    particleLight: THREE.PointLight;
    ambientLight: THREE.AmbientLight;
    frameId: number | null;
  } | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      50,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000,
    );
    camera.position.z = 5;

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
    });
    renderer.setSize(
      containerRef.current.clientWidth,
      containerRef.current.clientHeight,
    );
    renderer.setPixelRatio(window.devicePixelRatio);
    containerRef.current.appendChild(renderer.domElement);

    // Lighting setup - sophisticated multi-light system
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
    scene.add(ambientLight);

    // Main point light with animated position
    const particleLight = new THREE.PointLight(0x4f46e5, 2, 100);
    particleLight.position.set(0, 2, 3);
    scene.add(particleLight);

    // Secondary accent lights
    const accentLight1 = new THREE.PointLight(0x8b5cf6, 1.5, 50);
    accentLight1.position.set(-3, 0, 2);
    scene.add(accentLight1);

    const accentLight2 = new THREE.PointLight(0x06b6d4, 1.5, 50);
    accentLight2.position.set(3, 0, 2);
    scene.add(accentLight2);

    // Create button geometry - rounded box
    const geometry = new THREE.BoxGeometry(4, 1.2, 0.6, 32, 32, 32);

    // Apply smooth edge effect
    const positionAttribute = geometry.attributes.position;
    for (let i = 0; i < positionAttribute?.count; i++) {
      const x = positionAttribute.getX(i);
      const y = positionAttribute.getY(i);
      const z = positionAttribute.getZ(i);

      // Smooth edges
      const edgeFactor = 0.15;
      if (Math.abs(x) > 1.8) {
        positionAttribute.setY(
          i,
          y * (1 - Math.abs(x - Math.sign(x) * 2) * edgeFactor),
        );
      }
      if (Math.abs(y) > 0.5) {
        positionAttribute.setX(
          i,
          x * (1 - Math.abs(y - Math.sign(y) * 0.6) * edgeFactor),
        );
      }
    }
    geometry.computeVertexNormals();

    // Material with variant support
    const getVariantColor = () => {
      switch (variant) {
        case "primary":
          return 0x6366f1; // Indigo
        case "secondary":
          return 0x8b5cf6; // Purple
        case "glass":
          return 0x0ea5e9; // Sky blue
        default:
          return 0x6366f1;
      }
    };

    const material = new THREE.MeshStandardMaterial({
      color: getVariantColor(),
      metalness: variant === "glass" ? 0.1 : 0.7,
      roughness: variant === "glass" ? 0.1 : 0.3,
      transparent: variant === "glass",
      opacity: variant === "glass" ? 0.6 : 1,
      emissive: getVariantColor(),
      emissiveIntensity: 0.2,
    });

    const buttonMesh = new THREE.Mesh(geometry, material);
    scene.add(buttonMesh);

    // Add edge glow effect
    const edgeGeometry = new THREE.EdgesGeometry(geometry);
    const edgeMaterial = new THREE.LineBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.3,
    });
    const edges = new THREE.LineSegments(edgeGeometry, edgeMaterial);
    buttonMesh.add(edges);

    sceneRef.current = {
      scene,
      camera,
      renderer,
      buttonMesh,
      particleLight,
      ambientLight,
      frameId: null,
    };

    // Animation loop
    const animate = () => {
      if (!sceneRef.current) return;

      const time = Date.now() * 0.001;

      // Animate main light in circular pattern
      sceneRef.current.particleLight.position.x = Math.sin(time * 0.7) * 2;
      sceneRef.current.particleLight.position.y =
        Math.cos(time * 0.5) * 1.5 + 1;
      sceneRef.current.particleLight.position.z = Math.cos(time * 0.3) * 2 + 2;

      // Gentle rotation
      sceneRef.current.buttonMesh.rotation.x = Math.sin(time * 0.3) * 0.1;
      sceneRef.current.buttonMesh.rotation.y = time * 0.2;

      // Hover effects
      if (isHovered) {
        sceneRef.current.buttonMesh.scale.lerp(
          new THREE.Vector3(1.05, 1.05, 1.05),
          0.1,
        );
        (sceneRef.current.buttonMesh.material as THREE.MeshStandardMaterial)
          .emissiveIntensity = 0.4;
      } else {
        sceneRef.current.buttonMesh.scale.lerp(
          new THREE.Vector3(1, 1, 1),
          0.1,
        );
        (sceneRef.current.buttonMesh.material as THREE.MeshStandardMaterial)
          .emissiveIntensity = 0.2;
      }

      // Press effect
      if (isPressed) {
        sceneRef.current.buttonMesh.scale.lerp(
          new THREE.Vector3(0.95, 0.95, 0.95),
          0.3,
        );
      }

      sceneRef.current.renderer.render(
        sceneRef.current.scene,
        sceneRef.current.camera,
      );
      sceneRef.current.frameId = requestAnimationFrame(animate);
    };

    animate();

    // Handle window resize
    const handleResize = () => {
      if (!containerRef.current ?? !sceneRef.current) return;

      const width = containerRef.current!.clientWidth;
      const height = containerRef.current!.clientHeight;

      sceneRef.current!.camera.aspect = width / height;
      sceneRef.current!.camera.updateProjectionMatrix();
      sceneRef.current!.renderer.setSize(width, height);
    };

    window.addEventListener("resize", handleResize);

    // Cleanup
    return () => {
      window.removeEventListener("resize", handleResize);
      if (sceneRef.current?.frameId) {
        cancelAnimationFrame(sceneRef.current.frameId);
      }
      if (sceneRef.current?.renderer) {
        sceneRef.current.renderer.dispose();
        containerRef.current?.removeChild(sceneRef.current.renderer.domElement);
      }
    };
  }, [isHovered, isPressed, variant]);

  const handleClick = () => {
    setIsPressed(true);
    setTimeout(() => setIsPressed(false), 150);
    onClick?.();
  };

  return (
    <div className={`relative ${className}`}>
      <div
        ref={containerRef}
        className="relative h-48 w-full cursor-pointer overflow-hidden rounded-2xl"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={handleClick}
        style={{
          background:
            variant === "glass"
              ? "rgba(15, 23, 42, 0.5)"
              : "linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)",
          backdropFilter: variant === "glass" ? "blur(10px)" : "none",
        }}
      />
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <h3
            className={`text-2xl font-bold tracking-tight transition-all duration-300 ${
              isHovered ? "scale-110" : "scale-100"
            }`}
            style={{
              background:
                "linear-gradient(135deg, #fff 0%, #a78bfa 50%, #06b6d4 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              textShadow: isHovered
                ? "0 0 30px rgba(167, 139, 250, 0.5)"
                : "0 0 20px rgba(167, 139, 250, 0.3)",
            }}
          >
            {text}
          </h3>
          <p className="mt-2 text-sm text-white/60">Click to explore</p>
        </div>
      </div>
    </div>
  );
}
