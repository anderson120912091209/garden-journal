import React, { Suspense, useState, useMemo, useRef, useEffect } from 'react';
import { Canvas, ThreeEvent, useFrame } from '@react-three/fiber';
import { OrbitControls, Text, Environment, ContactShadows, RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import Flower from './Flower';
import { PlantInstance, GardenConfig, InteractionMode, CalendarDay, SoilMap, SoilType, ViewMode } from '../types';
import { CALENDAR_COLS, CALENDAR_ROWS, TILE_SIZE, TILE_GAP, TILE_HEIGHT, MONTH_GAP, SOIL_COLORS } from '../constants';

interface GardenSceneProps {
  plants: PlantInstance[];
  config: GardenConfig;
  mode: InteractionMode;
  viewMode: ViewMode;
  focusedMonth: number | null;
  onMonthSelect: (monthIndex: number) => void;
  fullYearCalendar: CalendarDay[][]; // Array of 12 arrays
  soilMap: SoilMap;
  onTileInteract: (monthIndex: number, dayIndex: number, point: THREE.Vector3) => void;
  waterParticles: { x: number, z: number, id: number }[];
}

// Calculate the center position of a specific month in the world
const getMonthWorldOrigin = (monthIndex: number): [number, number, number] => {
  const monthsPerRow = 4;
  const col = monthIndex % monthsPerRow;
  const row = Math.floor(monthIndex / monthsPerRow);
  
  const monthWidth = (CALENDAR_COLS * (TILE_SIZE + TILE_GAP)) + MONTH_GAP;
  const monthHeight = (CALENDAR_ROWS * (TILE_SIZE + TILE_GAP)) + MONTH_GAP;

  // Center the whole grid (4x3) around 0,0
  const totalW = monthWidth * 4;
  const totalH = monthHeight * 3;

  const x = (col * monthWidth) - totalW / 2 + monthWidth / 2;
  const z = (row * monthHeight) - totalH / 2 + monthHeight / 2;
  
  return [x, 0, z];
};

// Calculate local position of a tile within a month group
const getTileLocalPosition = (dayIndex: number): [number, number, number] => {
  const col = dayIndex % CALENDAR_COLS;
  const row = Math.floor(dayIndex / CALENDAR_COLS);
  
  const width = CALENDAR_COLS * (TILE_SIZE + TILE_GAP);
  const height = CALENDAR_ROWS * (TILE_SIZE + TILE_GAP);
  
  const x = (col * (TILE_SIZE + TILE_GAP)) - width / 2 + TILE_SIZE / 2;
  const z = (row * (TILE_SIZE + TILE_GAP)) - height / 2 + TILE_SIZE / 2;
  return [x, 0, z];
};

const MonthLabel: React.FC<{ label: string; position: [number, number, number] }> = ({ label, position }) => {
  return (
    <Text
      position={[position[0], position[1], position[2]]}
      rotation={[-Math.PI / 2, 0, 0]}
      fontSize={1.5}
      fontWeight={300}
      color="#9ca3af"
      anchorX="center"
      anchorY="middle"
      fillOpacity={0.8}
    >
      {label}
    </Text>
  );
};

const CalendarBlock: React.FC<{
  dayData: CalendarDay;
  monthIndex: number;
  soilType: SoilType;
  onClick: (e: ThreeEvent<MouseEvent>) => void;
  viewMode: ViewMode;
}> = ({ dayData, monthIndex, soilType, onClick, viewMode }) => {
  const [hovered, setHovered] = useState(false);

  // If it's not a valid day (just padding), don't render anything
  if (!dayData.isValidDay) return null;

  const pos = getTileLocalPosition(dayData.dayIndex);
  
  return (
    <group position={pos}>
      <RoundedBox
        args={[TILE_SIZE, TILE_HEIGHT, TILE_SIZE]} // Width, Height, Depth
        radius={0.1} // Smooth edges
        smoothness={4}
        position={[0, -TILE_HEIGHT / 2, 0]}
        onPointerOver={(e) => { 
          e.stopPropagation(); 
          setHovered(true); 
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          setHovered(false);
          document.body.style.cursor = 'auto';
        }}
        onClick={(e) => {
          e.stopPropagation();
          onClick(e);
        }}
        receiveShadow
        castShadow
      >
        <meshStandardMaterial 
          color={SOIL_COLORS[soilType]} 
          roughness={1} 
          metalness={0}
          emissive={hovered ? SOIL_COLORS[soilType] : '#000000'}
          emissiveIntensity={hovered ? 0.2 : 0}
        />
      </RoundedBox>
      
      {/* Day Number - Only show if zoomed in or if it's the 1st of the month */}
      {(viewMode === ViewMode.MONTH || dayData.dayOfMonth === 1) && (
        <Text
          position={[TILE_SIZE/2 - 0.4, 0.05, TILE_SIZE/2 - 0.4]}
          rotation={[-Math.PI / 2, 0, 0]}
          fontSize={0.4}
          fontWeight={600}
          color="#ffffff" 
          anchorX="center"
          anchorY="middle"
        >
          {dayData.dayOfMonth}
        </Text>
      )}
    </group>
  );
};

// Controls Camera Movement
const CameraController: React.FC<{ viewMode: ViewMode; focusedMonth: number | null }> = ({ viewMode, focusedMonth }) => {
  useFrame((state) => {
    const targetPos = new THREE.Vector3();
    const targetLookAt = new THREE.Vector3();

    if (viewMode === ViewMode.YEAR || focusedMonth === null) {
      // High altitude view of everything
      targetPos.set(0, 60, 40);
      targetLookAt.set(0, 0, 0);
    } else {
      // Zoomed into specific month
      const origin = getMonthWorldOrigin(focusedMonth);
      targetPos.set(origin[0], 25, origin[2] + 15);
      targetLookAt.set(origin[0], 0, origin[2]);
    }

    // Smooth lerp
    state.camera.position.lerp(targetPos, 0.05);
    // Use a dummy object to lerp quaternion if needed, but simple lookAt lerp is manual
    // Or just lookAt every frame after lerping position
    const currentLook = new THREE.Vector3(0,0,-1).applyQuaternion(state.camera.quaternion).add(state.camera.position);
    currentLook.lerp(targetLookAt, 0.05);
    state.camera.lookAt(currentLook);
  });
  return null;
};

const WaterEffect: React.FC<{ x: number, z: number }> = ({ x, z }) => {
  const count = 15;
  const dummy = new THREE.Object3D();
  const particles = useRef<THREE.InstancedMesh>(null);
  
  useFrame(({ clock }) => {
    if (!particles.current) return;
    const time = clock.getElapsedTime() * 5;
    for (let i = 0; i < count; i++) {
       const t = (time + i * 0.1) % 1.5;
       const py = 2 - (t * t * 2);
       const px = (Math.sin(i * 132.1) * 0.5) * t;
       const pz = (Math.cos(i * 12.3) * 0.5) * t;
       if (py < 0) dummy.scale.set(0,0,0);
       else {
         dummy.position.set(x + px, py, z + pz);
         dummy.scale.setScalar(0.08);
       }
       dummy.updateMatrix();
       particles.current.setMatrixAt(i, dummy.matrix);
    }
    particles.current.instanceMatrix.needsUpdate = true;
  });
  return (
    <instancedMesh ref={particles} args={[undefined, undefined, count]}>
      <boxGeometry args={[1, 1, 1]} />
      <meshBasicMaterial color="#3b82f6" transparent opacity={0.6} />
    </instancedMesh>
  )
}

const GardenScene: React.FC<GardenSceneProps> = ({ 
  plants, config, mode, viewMode, focusedMonth, onMonthSelect, fullYearCalendar, soilMap, onTileInteract, waterParticles 
}) => {

  const monthNames = [
    "January", "February", "March", "April", "May", "June", 
    "July", "August", "September", "October", "November", "December"
  ];

  return (
    <Canvas
      shadows
      camera={{ position: [0, 50, 40], fov: 35 }} 
      style={{ background: '#f0fdf4' }} // Very light green bg
    >
      <fog attach="fog" args={['#f0fdf4', 30, 90]} />
      <CameraController viewMode={viewMode} focusedMonth={focusedMonth} />
      
      <ambientLight intensity={0.8} />
      <directionalLight 
        position={[20, 50, 20]} 
        intensity={1.2} 
        castShadow 
        shadow-mapSize={[2048, 2048]} 
        shadow-bias={-0.0005}
      >
        <orthographicCamera attach="shadow-camera" args={[-50, 50, 50, -50]} />
      </directionalLight>
      <Environment preset="park" />

      {/* Render 12 Months */}
      {fullYearCalendar.map((days, mIndex) => {
        const origin = getMonthWorldOrigin(mIndex);
        
        return (
          <group key={mIndex} position={origin}>
            {/* Hitbox for zooming into month if in Year view */}
            {viewMode === ViewMode.YEAR && (
              <mesh 
                position={[0, 0, 0]} 
                visible={false} 
                onClick={(e) => { e.stopPropagation(); onMonthSelect(mIndex); }}
              >
                <boxGeometry args={[16, 5, 14]} />
              </mesh>
            )}

            {/* Month Label */}
            <MonthLabel label={monthNames[mIndex]} position={[0, 0, -8]} />

            {/* Tiles */}
            {days.map((day) => (
              <CalendarBlock 
                key={day.dayIndex} 
                dayData={day}
                monthIndex={mIndex}
                viewMode={viewMode}
                soilType={soilMap[`${mIndex}-${day.dayIndex}`] || SoilType.GRASS}
                onClick={(e) => onTileInteract(mIndex, day.dayIndex, e.point)}
              />
            ))}
          </group>
        );
      })}

      <ContactShadows position={[0, -0.1, 0]} opacity={0.4} scale={100} blur={3} far={2} />

      {/* Plants */}
      <Suspense fallback={null}>
        {plants.map((plant) => (
          <Flower key={plant.id} data={plant} config={config} />
        ))}
      </Suspense>

      {/* Water VFX */}
      {waterParticles.map(wp => (
        <WaterEffect key={wp.id} x={wp.x} z={wp.z} />
      ))}

    </Canvas>
  );
};

export default GardenScene;