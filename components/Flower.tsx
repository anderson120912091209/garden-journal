import React, { useMemo, useRef, useState, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Instances, Instance } from '@react-three/drei';
import { PlantInstance, GardenConfig } from '../types';

interface FlowerProps {
  data: PlantInstance;
  config: GardenConfig;
}

// Ease out elastic function for the "Pop" effect
function easeOutElastic(x: number): number {
  const c4 = (2 * Math.PI) / 3;
  return x === 0
    ? 0
    : x === 1
    ? 1
    : Math.pow(2, -10 * x) * Math.sin((x * 10 - 0.75) * c4) + 1;
}

const Flower: React.FC<FlowerProps> = ({ data, config }) => {
  const groupRef = useRef<THREE.Group>(null);
  
  // High-Res Voxel Art style
  const vSize = 0.05; 

  // Determine current stage index based on growthProgress
  // 0 -> Stage 0, 0.33 -> Stage 1, 0.66 -> Stage 2, 1.0 -> Stage 3
  const totalStages = data.stages.length;
  const stageIndex = Math.min(totalStages - 1, Math.floor(data.growthProgress * totalStages));
  const currentVoxels = data.stages[stageIndex];

  // Animation trigger for stage change
  const [displayedStage, setDisplayedStage] = useState(stageIndex);
  const [popTime, setPopTime] = useState(0);

  // Sync displayed stage with animation trigger
  useEffect(() => {
    if (stageIndex !== displayedStage) {
      setDisplayedStage(stageIndex);
      setPopTime(Date.now()); // Trigger pop animation
    }
  }, [stageIndex, displayedStage]);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;

    const time = clock.getElapsedTime();
    
    // Pop Animation on Stage Change or Initial Load
    const msSincePop = Date.now() - (popTime || data.plantedAt);
    const popDuration = 1000;
    let growthScale = 1;
    
    if (msSincePop < popDuration) {
       growthScale = easeOutElastic(Math.min(1, msSincePop / popDuration));
    }
    
    // Wind Sway
    const windOffset = (data.x * 0.5) + (data.z * 0.3);
    const swayX = Math.sin(time * config.swaySpeed + data.rotationOffset + windOffset) * 0.05 * config.windStrength;
    const swayZ = Math.cos(time * config.swaySpeed * 0.8 + data.rotationOffset) * 0.05 * config.windStrength;

    groupRef.current.rotation.set(swayX, data.rotationOffset + swayZ, 0); 
    
    // Scale Logic: Base Scale * Global Config * Pop Animation
    // We can also make early stages smaller
    const stageScaleMult = 0.5 + (stageIndex / (totalStages-1)) * 0.5; // Starts at 50% size, grows to 100%
    
    const finalScale = data.scale * config.globalScale * growthScale * stageScaleMult;
    groupRef.current.scale.setScalar(finalScale);
  });

  return (
    <group 
      ref={groupRef} 
      position={[data.x, 0, data.z]} 
    >
      <Instances range={currentVoxels.length}>
        <boxGeometry args={[vSize, vSize, vSize]} />
        <meshStandardMaterial roughness={0.8} />

        {currentVoxels.map((voxel, i) => (
          <Instance
            key={`${displayedStage}-${i}`} // Remount instances on stage change
            color={voxel.color}
            position={[
              voxel.x * vSize, 
              voxel.y * vSize + (vSize/2), 
              voxel.z * vSize
            ]}
          />
        ))}
      </Instances>
    </group>
  );
};

export default React.memo(Flower);