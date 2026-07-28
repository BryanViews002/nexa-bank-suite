import { useLayoutEffect, useMemo, useRef } from "react";
import { Float, RoundedBox } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { cn } from "@/lib/utils";

type SceneVariant = "hero" | "auth";

export interface NexaSceneProps {
  className?: string;
  variant?: SceneVariant;
}

const damp = (current: number, target: number, smoothing = 0.06) =>
  THREE.MathUtils.lerp(current, target, smoothing);

function NexaMark() {
  const material = (
    <meshPhysicalMaterial
      color="#f8fbff"
      emissive="#1d7fff"
      emissiveIntensity={0.28}
      metalness={0.72}
      roughness={0.18}
      clearcoat={1}
      clearcoatRoughness={0.12}
    />
  );

  return (
    <group position={[0, 0.02, 0.16]}>
      <RoundedBox args={[0.18, 0.82, 0.08]} radius={0.05} smoothness={4} position={[-0.48, 0, 0]}>
        {material}
      </RoundedBox>
      <RoundedBox args={[0.18, 0.82, 0.08]} radius={0.05} smoothness={4} position={[0.48, 0, 0]}>
        {material}
      </RoundedBox>
      <RoundedBox
        args={[0.18, 1.23, 0.08]}
        radius={0.05}
        smoothness={4}
        position={[0, 0, 0]}
        rotation={[0, 0, -0.68]}
      >
        {material}
      </RoundedBox>
    </group>
  );
}

function CardChip() {
  return (
    <group position={[-1.04, 0.45, 0.16]}>
      <RoundedBox args={[0.48, 0.36, 0.055]} radius={0.055} smoothness={4}>
        <meshStandardMaterial color="#d6b564" metalness={0.82} roughness={0.24} />
      </RoundedBox>
      {[-0.12, 0.12].map((x) => (
        <mesh key={x} position={[x, 0, 0.031]}>
          <boxGeometry args={[0.012, 0.28, 0.008]} />
          <meshBasicMaterial color="#756030" />
        </mesh>
      ))}
      {[-0.1, 0.1].map((y) => (
        <mesh key={y} position={[0, y, 0.031]}>
          <boxGeometry args={[0.4, 0.012, 0.008]} />
          <meshBasicMaterial color="#756030" />
        </mesh>
      ))}
    </group>
  );
}

function BankingCard() {
  const card = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!card.current) return;
    const t = state.clock.getElapsedTime();
    card.current.position.y = Math.sin(t * 0.72) * 0.06;
  });

  return (
    <group ref={card} rotation={[-0.04, -0.18, -0.04]}>
      <RoundedBox
        args={[3.2, 1.92, 0.16]}
        radius={0.2}
        smoothness={8}
        position={[0.24, -0.2, -0.36]}
        rotation={[0.08, -0.02, -0.1]}
      >
        <meshPhysicalMaterial
          color="#11151d"
          metalness={0.78}
          roughness={0.28}
          clearcoat={1}
          clearcoatRoughness={0.2}
        />
      </RoundedBox>

      <RoundedBox args={[3.2, 1.92, 0.18]} radius={0.2} smoothness={8}>
        <meshPhysicalMaterial
          color="#101319"
          metalness={0.68}
          roughness={0.2}
          clearcoat={1}
          clearcoatRoughness={0.13}
          sheen={0.5}
          sheenColor="#2f8cff"
        />
      </RoundedBox>

      <mesh position={[0, 0, 0.105]}>
        <planeGeometry args={[2.76, 1.48]} />
        <meshBasicMaterial color="#090b0f" transparent opacity={0.38} />
      </mesh>

      <CardChip />
      <NexaMark />

      <group position={[-0.98, -0.55, 0.16]}>
        {[0.52, 0.34, 0.2].map((width, index) => (
          <mesh key={width} position={[index * 0.35, 0, 0]}>
            <boxGeometry args={[width, 0.04, 0.04]} />
            <meshBasicMaterial color={index === 0 ? "#f3f7ff" : "#6f7785"} />
          </mesh>
        ))}
      </group>

      <mesh position={[1.08, 0.6, 0.16]} rotation={[0, 0, -0.18]}>
        <ringGeometry args={[0.13, 0.17, 40, 1, 0, Math.PI * 1.45]} />
        <meshBasicMaterial color="#38d99b" side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[1.19, 0.6, 0.162]} rotation={[0, 0, -0.18]}>
        <ringGeometry args={[0.13, 0.17, 40, 1, 0, Math.PI * 1.45]} />
        <meshBasicMaterial color="#f4f7fb" side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

interface PacketProps {
  color: string;
  phase: number;
  radius: number;
  speed: number;
  tilt: number;
}

function TransactionPacket({ color, phase, radius, speed, tilt }: PacketProps) {
  const packet = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!packet.current) return;
    const t = state.clock.getElapsedTime() * speed + phase;
    packet.current.position.set(
      Math.cos(t) * radius,
      Math.sin(t) * radius * 0.5,
      Math.sin(t + tilt) * 0.72,
    );
    packet.current.rotation.x = t * 0.8;
    packet.current.rotation.y = t;
  });

  return (
    <mesh ref={packet}>
      <octahedronGeometry args={[0.075, 0]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.8} roughness={0.24} />
    </mesh>
  );
}

function OrbitSystem() {
  const rings = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    if (!rings.current) return;
    rings.current.rotation.z += delta * 0.025;
    rings.current.rotation.y = Math.sin(state.clock.getElapsedTime() * 0.16) * 0.08;
  });

  return (
    <group ref={rings}>
      <mesh rotation={[1.22, 0.18, 0.18]}>
        <torusGeometry args={[2.42, 0.012, 8, 220]} />
        <meshBasicMaterial color="#397dd1" transparent opacity={0.58} />
      </mesh>
      <mesh rotation={[0.32, 1.08, -0.36]}>
        <torusGeometry args={[2.92, 0.008, 8, 220]} />
        <meshBasicMaterial color="#d3ad5c" transparent opacity={0.42} />
      </mesh>
      <mesh rotation={[1.54, -0.24, 0.05]}>
        <torusGeometry args={[3.35, 0.006, 8, 220]} />
        <meshBasicMaterial color="#e5edf8" transparent opacity={0.2} />
      </mesh>

      <TransactionPacket color="#3b91ff" phase={0.2} radius={2.42} speed={0.42} tilt={0.3} />
      <TransactionPacket color="#38d99b" phase={2.3} radius={2.92} speed={-0.28} tilt={1.8} />
      <TransactionPacket color="#e0b75f" phase={4.1} radius={3.35} speed={0.2} tilt={2.4} />
    </group>
  );
}

function DataSlab({
  position,
  rotation,
  accent,
  scale = 1,
}: {
  position: [number, number, number];
  rotation: [number, number, number];
  accent: string;
  scale?: number;
}) {
  return (
    <Float speed={1.2} rotationIntensity={0.14} floatIntensity={0.22}>
      <group position={position} rotation={rotation} scale={scale}>
        <RoundedBox args={[0.92, 0.54, 0.06]} radius={0.075} smoothness={5}>
          <meshPhysicalMaterial
            color="#151a22"
            transparent
            opacity={0.9}
            metalness={0.55}
            roughness={0.24}
            clearcoat={1}
          />
        </RoundedBox>
        <mesh position={[-0.3, 0.14, 0.04]}>
          <boxGeometry args={[0.18, 0.045, 0.025]} />
          <meshBasicMaterial color={accent} />
        </mesh>
        {[0.46, 0.62, 0.34].map((width, index) => (
          <mesh key={width} position={[-0.04 + index * 0.03, 0.02 - index * 0.12, 0.04]}>
            <boxGeometry args={[width, 0.025, 0.02]} />
            <meshBasicMaterial color={index === 0 ? "#dbe4f0" : "#566071"} transparent opacity={0.85} />
          </mesh>
        ))}
      </group>
    </Float>
  );
}

function ShardField() {
  const count = 54;
  const mesh = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const transforms = useMemo(
    () =>
      Array.from({ length: count }, (_, index) => {
        const random = (salt: number) => {
          const value = Math.sin(index * 91.73 + salt * 47.11) * 43758.5453;
          return value - Math.floor(value);
        };

        return {
          position: new THREE.Vector3(
            (random(1) - 0.5) * 10,
            (random(2) - 0.5) * 6,
            -1.5 - random(3) * 6,
          ),
          rotation: new THREE.Euler(random(4) * Math.PI, random(5) * Math.PI, random(6) * Math.PI),
          scale: 0.35 + random(7) * 0.9,
        };
      }),
    [],
  );

  useLayoutEffect(() => {
    if (!mesh.current) return;

    transforms.forEach((transform, index) => {
      dummy.position.copy(transform.position);
      dummy.rotation.copy(transform.rotation);
      dummy.scale.setScalar(transform.scale);
      dummy.updateMatrix();
      mesh.current!.setMatrixAt(index, dummy.matrix);
    });
    mesh.current.instanceMatrix.needsUpdate = true;
  }, [dummy, transforms]);

  useFrame((_, delta) => {
    if (!mesh.current) return;
    mesh.current.rotation.y += delta * 0.006;
    mesh.current.rotation.z -= delta * 0.003;
  });

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, count]}>
      <boxGeometry args={[0.025, 0.025, 0.11]} />
      <meshBasicMaterial color="#8fbfff" transparent opacity={0.34} />
    </instancedMesh>
  );
}

function Scene({ variant }: { variant: SceneVariant }) {
  const world = useRef<THREE.Group>(null);
  const { viewport } = useThree();
  const compact = viewport.width < 7.2;

  useFrame((state) => {
    if (!world.current) return;
    const pointerScale = compact ? 0.08 : 0.16;
    world.current.rotation.x = damp(world.current.rotation.x, -0.08 - state.pointer.y * pointerScale);
    world.current.rotation.y = damp(world.current.rotation.y, -0.18 + state.pointer.x * pointerScale);
  });

  const scale = variant === "auth" ? (compact ? 0.72 : 0.86) : compact ? 0.68 : 1;
  const position: [number, number, number] =
    variant === "auth"
      ? [compact ? 0.8 : 0.3, 0.55, 0]
      : [compact ? 1.2 : 2.05, compact ? -0.82 : -0.05, 0];

  return (
    <>
      <ambientLight intensity={0.38} />
      <directionalLight position={[4, 5, 7]} intensity={3.2} color="#eaf3ff" />
      <pointLight position={[-4, 1, 3]} intensity={32} distance={9} color="#197cff" />
      <pointLight position={[3, -3, 3]} intensity={24} distance={8} color="#e0b054" />
      <spotLight position={[1, 5, 4]} angle={0.38} penumbra={1} intensity={42} color="#ffffff" />

      <ShardField />

      <group ref={world} position={position} scale={scale}>
        <OrbitSystem />
        <Float speed={1.05} rotationIntensity={0.07} floatIntensity={0.18}>
          <BankingCard />
        </Float>
        <DataSlab position={[-2.45, 1.38, 0.5]} rotation={[0.08, 0.35, 0.08]} accent="#38d99b" scale={0.9} />
        <DataSlab position={[2.62, -1.38, 0.2]} rotation={[-0.1, -0.42, -0.08]} accent="#e0b75f" scale={0.82} />
      </group>
    </>
  );
}

export function NexaScene({ className, variant = "hero" }: NexaSceneProps) {
  const reducedMotion = useReducedMotion();

  return (
    <div className={cn("nexa-scene", className)} aria-hidden="true">
      <Canvas
        camera={{ position: [0, 0, 9], fov: 38, near: 0.1, far: 60 }}
        dpr={[1, 1.75]}
        frameloop={reducedMotion ? "demand" : "always"}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        onCreated={({ gl }) => gl.setClearColor(0x000000, 0)}
        performance={{ min: 0.55 }}
        fallback={<div className="nexa-scene-fallback" />}
      >
        <Scene variant={variant} />
      </Canvas>
    </div>
  );
}

export default NexaScene;
