import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Text, TrackballControls } from '@react-three/drei';
import * as THREE from 'three';

const Word = ({ children, position }: { children: string, position: THREE.Vector3 }) => {
  const ref = useRef<THREE.Mesh>(null);
  const color = new THREE.Color();
  const fontProps = {
    font: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hjp-Ek-_EeA.woff',
    fontSize: 2.2,
    letterSpacing: -0.05,
    lineHeight: 1,
    'material-toneMapped': false
  };

  useFrame(({ camera }) => {
    if (ref.current) {
      // Make text face the camera
      ref.current.quaternion.copy(camera.quaternion);
    }
  });

  return (
    <Text ref={ref} position={position} {...fontProps} color="#60a5fa">
      {children}
    </Text>
  );
};

const Cloud = ({ count = 4, radius = 20, words }: { count?: number, radius?: number, words: string[] }) => {
  // Create a spherical distribution of words
  const positions = useMemo(() => {
    const pos = [];
    const spherical = new THREE.Spherical();
    const phiSpan = Math.PI / (count + 1);
    const thetaSpan = (Math.PI * 2) / count;
    for (let i = 1; i < count + 1; i++) {
      for (let j = 0; j < count; j++) {
        spherical.set(radius, phiSpan * i, thetaSpan * j);
        pos.push(new THREE.Vector3().setFromSpherical(spherical));
      }
    }
    return pos;
  }, [count, radius]);

  const groupRef = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.1;
      groupRef.current.rotation.x += delta * 0.05;
    }
  });

  return (
    <group ref={groupRef}>
      {words.map((word, i) => (
        <Word key={i} position={positions[i % positions.length]}>
          {word}
        </Word>
      ))}
    </group>
  );
};

export const SkillSphere = ({ skills }: { skills: string[] }) => {
  // Duplicate skills if we don't have enough to fill the sphere (count * count = 16 positions)
  const displayWords = useMemo(() => {
    let words = [...skills];
    while (words.length < 25) {
      words = [...words, ...skills];
    }
    return words.slice(0, 25);
  }, [skills]);

  return (
    <div className="w-full h-[500px] cursor-grab active:cursor-grabbing">
      <Canvas camera={{ position: [0, 0, 36], fov: 90 }}>
        <fog attach="fog" args={['#000', 0, 45]} />
        <ambientLight intensity={0.5} />
        <Cloud count={5} radius={18} words={displayWords} />
        <TrackballControls noZoom={true} noPan={true} rotateSpeed={2.0} />
      </Canvas>
    </div>
  );
};
