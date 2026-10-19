"use client";

import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { HOME_WEATHER, type IslandWeather } from './weather';

// Applies only to the home preview Canvas. Models and placement controls are untouched.
export default function HomeWeatherLighting({ weather }: { weather: IslandWeather }) {
  const { scene } = useThree();
  const originals = useRef(new Map<string, { intensity: number; color: THREE.Color }>());
  const tint = useRef(new THREE.Color());
  const target = useRef(new THREE.Color());
  useFrame((_, delta) => {
    const settings = HOME_WEATHER[weather];
    tint.current.set(settings.light);
    const transition = 1 - Math.exp(-Math.min(delta, .1) * 4);
    scene.traverse((object) => {
      if (!(object instanceof THREE.Light)) return;
      if (!originals.current.has(object.uuid)) originals.current.set(object.uuid, { intensity: object.intensity, color: object.color.clone() });
      const original = originals.current.get(object.uuid)!;
      object.intensity = THREE.MathUtils.lerp(object.intensity, original.intensity * settings.intensity, transition);
      target.current.copy(original.color).lerp(tint.current, weather === 'sunny' ? 0 : .55);
      object.color.lerp(target.current, transition);
    });
  });
  return null;
}
