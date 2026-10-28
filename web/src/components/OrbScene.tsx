"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useMemo, useRef, type MutableRefObject } from "react";
import { Color, MathUtils, type Mesh, type MeshStandardMaterial } from "three";

type Props = {
  stateRef: MutableRefObject<string>;
  levelRef: MutableRefObject<number>;
};

function Orb({ stateRef, levelRef }: Props) {
  const mesh = useRef<Mesh>(null);
  const level = useRef(0);
  const drag = useRef({ active: false, x: 0 });

  const colors = useMemo(
    () => ({
      listening: new Color("#3b82f6"),
      thinking: new Color("#f59e0b"),
      speaking: new Color("#22c55e"),
      idle: new Color("#6b7280"),
    }),
    []
  );

  useFrame((frame, dt) => {
    const m = mesh.current;
    if (!m) return;
    const state = stateRef.current;
    const target =
      state === "listening" || state === "thinking" || state === "speaking"
        ? colors[state]
        : colors.idle;

    (m.material as MeshStandardMaterial).color.lerp(target, 0.1);

    level.current = MathUtils.lerp(level.current, levelRef.current, 0.2);
    const t = frame.clock.elapsedTime;
    let scale = 1;
    if (state === "speaking") scale = 1 + Math.min(level.current, 1) * 0.5;
    else if (state === "listening") scale = 1 + Math.sin(t * 2) * 0.03;
    else if (state === "thinking") scale = 1 + Math.sin(t * 6) * 0.05;
    m.scale.setScalar(scale);

    if (!drag.current.active) m.rotation.y += dt * (state === "thinking" ? 1.5 : 0.3);
  });

  return (
    <mesh
      ref={mesh}
      onPointerDown={(e) => {
        drag.current.active = true;
        drag.current.x = e.clientX;
      }}
      onPointerMove={(e) => {
        if (!drag.current.active || !mesh.current) return;
        mesh.current.rotation.y += (e.clientX - drag.current.x) * 0.01;
        drag.current.x = e.clientX;
      }}
      onPointerUp={() => (drag.current.active = false)}
      onPointerLeave={() => (drag.current.active = false)}
    >
      <icosahedronGeometry args={[1, 3]} />
      <meshStandardMaterial flatShading />
    </mesh>
  );
}

export default function OrbScene(props: Props) {
  return (
    <Canvas dpr={[1, 1.5]} camera={{ position: [0, 0, 3.2], fov: 45 }}>
      <ambientLight intensity={0.7} />
      <directionalLight position={[3, 3, 3]} intensity={1.5} />
      <Orb {...props} />
    </Canvas>
  );
}