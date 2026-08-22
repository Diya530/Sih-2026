import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF, Environment } from '@react-three/drei';
import { Suspense, useRef } from 'react';

function HelmetModel() {
  const helmetRef = useRef();
  const { scene } = useGLTF('/resq-helm.glb');

  useFrame(() => {
    if (helmetRef.current) {
      helmetRef.current.rotation.y += 0.003;
    }
  });

  return (
    <primitive
      ref={helmetRef}
      object={scene}
      scale={2.2}
      position={[0, -1, 0]}
    />
  );
}

export default function Helmet3D() {
  return (
    <div className="w-full h-130">
      <Canvas
        camera={{ position: [0, 0.5, 5], fov: 45 }}
      >
        <Suspense fallback={null}>
          <ambientLight intensity={1.5} />

          <directionalLight
            position={[5, 5, 5]}
            intensity={2}
          />

          <Environment preset="studio" />

          <HelmetModel />

          <OrbitControls
            enableZoom={false}
            enablePan={false}
            autoRotate={false}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}

useGLTF.preload('/resq-helm.glb');