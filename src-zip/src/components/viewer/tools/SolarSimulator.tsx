'use client';

/**
 * SolarSimulator - Solar shadow simulation tool
 *
 * Simulates sunlight and shadows based on:
 * - Geographic location (latitude/longitude)
 * - Date and time
 * - Real-time shadow visualization
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { motion } from 'framer-motion';
import { Sun, X, Play, Pause, Clock, Calendar, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/i18n/provider';

interface SolarSimulatorProps {
  scene: THREE.Scene;
  isActive: boolean;
  onClose?: () => void;
}

// Calculate sun position based on date, time, and location
function calculateSunPosition(
  date: Date,
  latitude: number,
  longitude: number
): { azimuth: number; elevation: number } {
  const day = Math.floor((date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / 86400000);
  const hour = date.getHours() + date.getMinutes() / 60;

  // Solar declination
  const declination = 23.45 * Math.sin(((360 / 365) * (day - 81)) * (Math.PI / 180));

  // Hour angle
  const hourAngle = 15 * (hour - 12);

  // Solar elevation
  const latRad = latitude * (Math.PI / 180);
  const decRad = declination * (Math.PI / 180);
  const hourRad = hourAngle * (Math.PI / 180);

  const elevation = Math.asin(
    Math.sin(latRad) * Math.sin(decRad) +
    Math.cos(latRad) * Math.cos(decRad) * Math.cos(hourRad)
  ) * (180 / Math.PI);

  // Solar azimuth
  const azimuth = Math.atan2(
    Math.sin(hourRad),
    Math.cos(hourRad) * Math.sin(latRad) - Math.tan(decRad) * Math.cos(latRad)
  ) * (180 / Math.PI) + 180;

  return { azimuth, elevation };
}

// Convert sun position to directional light position
function sunPositionToLightDirection(azimuth: number, elevation: number, distance: number = 100): THREE.Vector3 {
  const azimuthRad = azimuth * (Math.PI / 180);
  const elevationRad = elevation * (Math.PI / 180);

  return new THREE.Vector3(
    -Math.sin(azimuthRad) * Math.cos(elevationRad) * distance,
    Math.sin(elevationRad) * distance,
    -Math.cos(azimuthRad) * Math.cos(elevationRad) * distance
  );
}

// Preset locations
const LOCATIONS = [
  { name: 'Bangkok', lat: 13.7563, lng: 100.5018 },
  { name: 'London', lat: 51.5074, lng: -0.1278 },
  { name: 'New York', lat: 40.7128, lng: -74.0060 },
  { name: 'Tokyo', lat: 35.6762, lng: 139.6503 },
  { name: 'Sydney', lat: -33.8688, lng: 151.2093 },
  { name: 'Dubai', lat: 25.2048, lng: 55.2708 },
];

export function SolarSimulator({
  scene,
  isActive,
  onClose,
}: SolarSimulatorProps) {
  const { t } = useTranslation();
  const [date, setDate] = useState(new Date());
  const [hour, setHour] = useState(12);
  const [minute, setMinute] = useState(0);
  const [latitude, setLatitude] = useState(13.7563); // Bangkok default
  const [longitude, setLongitude] = useState(100.5018);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showShadows, setShowShadows] = useState(true);

  const sunLightRef = useRef<THREE.DirectionalLight | null>(null);
  const sunHelperRef = useRef<THREE.Mesh | null>(null);
  const animationRef = useRef<number | null>(null);

  // Initialize sun light
  useEffect(() => {
    if (!isActive) return;

    // Create sun directional light with shadows
    const sunLight = new THREE.DirectionalLight(0xffffcc, 1.5);
    sunLight.name = 'solar-sun-light';
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 500;
    sunLight.shadow.camera.left = -100;
    sunLight.shadow.camera.right = 100;
    sunLight.shadow.camera.top = 100;
    sunLight.shadow.camera.bottom = -100;

    sunLightRef.current = sunLight;
    scene.add(sunLight);

    // Create sun helper (visual sphere)
    const sunGeometry = new THREE.SphereGeometry(2, 32, 32);
    const sunMaterial = new THREE.MeshBasicMaterial({ color: 0xffdd00 });
    const sunHelper = new THREE.Mesh(sunGeometry, sunMaterial);
    sunHelper.name = 'solar-sun-helper';
    sunHelperRef.current = sunHelper;
    scene.add(sunHelper);

    // Enable shadow rendering on all meshes
    scene.traverse((obj) => {
      if (obj instanceof THREE.Mesh && !obj.name.includes('solar')) {
        obj.castShadow = true;
        obj.receiveShadow = true;
      }
    });

    return () => {
      if (sunLightRef.current) scene.remove(sunLightRef.current);
      if (sunHelperRef.current) scene.remove(sunHelperRef.current);

      // Disable shadows on cleanup
      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.castShadow = false;
          obj.receiveShadow = false;
        }
      });
    };
  }, [isActive, scene]);

  // Update sun position
  const updateSunPosition = useCallback(() => {
    if (!sunLightRef.current || !sunHelperRef.current) return;

    const simulatedDate = new Date(date);
    simulatedDate.setHours(hour, minute, 0);

    const { azimuth, elevation } = calculateSunPosition(simulatedDate, latitude, longitude);
    const lightPosition = sunPositionToLightDirection(azimuth, elevation, 100);

    sunLightRef.current.position.copy(lightPosition);
    sunLightRef.current.target.position.set(0, 0, 0);

    sunHelperRef.current.position.copy(lightPosition);

    // Adjust light intensity based on elevation
    const intensity = Math.max(0, Math.sin(elevation * (Math.PI / 180))) * 1.5;
    sunLightRef.current.intensity = intensity;

    // Change color based on elevation (more orange at sunset/sunrise)
    if (elevation < 15) {
      sunLightRef.current.color.setHex(0xffaa44);
    } else if (elevation < 30) {
      sunLightRef.current.color.setHex(0xffdd88);
    } else {
      sunLightRef.current.color.setHex(0xffffcc);
    }
  }, [date, hour, minute, latitude, longitude]);

  // Update sun when parameters change
  useEffect(() => {
    updateSunPosition();
  }, [updateSunPosition]);

  // Animation loop for time-lapse
  useEffect(() => {
    if (!isPlaying) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      return;
    }

    const animate = () => {
      setMinute((prev) => {
        const next = prev + 5;
        if (next >= 60) {
          setHour((h) => (h + 1) % 24);
          return 0;
        }
        return next;
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    const intervalId = setInterval(animate, 100);

    return () => {
      clearInterval(intervalId);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying]);

  if (!isActive) return null;

  const { azimuth, elevation } = calculateSunPosition(
    new Date(date.setHours(hour, minute)),
    latitude,
    longitude
  );

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="absolute top-20 left-4 bg-card/95 backdrop-blur-sm border border-border rounded-xl shadow-lg p-4 w-80"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sun className="w-5 h-5 text-yellow-500" />
          <h3 className="font-semibold">{t('viewer.solarSimulator')}</h3>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 hover:bg-muted rounded-lg transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Location */}
      <div className="mb-4">
        <label className="flex items-center gap-2 text-sm font-medium mb-2">
          <MapPin className="w-4 h-4 text-primary" />
          {t('viewer.location')}
        </label>
        <select
          value={`${latitude},${longitude}`}
          onChange={(e) => {
            const [lat, lng] = e.target.value.split(',').map(Number);
            setLatitude(lat);
            setLongitude(lng);
          }}
          className="w-full p-2 bg-muted border border-border rounded-lg text-sm"
        >
          {LOCATIONS.map((loc) => (
            <option key={loc.name} value={`${loc.lat},${loc.lng}`}>
              {loc.name}
            </option>
          ))}
        </select>
      </div>

      {/* Date */}
      <div className="mb-4">
        <label className="flex items-center gap-2 text-sm font-medium mb-2">
          <Calendar className="w-4 h-4 text-primary" />
          {t('viewer.date')}
        </label>
        <input
          type="date"
          value={date.toISOString().split('T')[0]}
          onChange={(e) => setDate(new Date(e.target.value))}
          className="w-full p-2 bg-muted border border-border rounded-lg text-sm"
        />
      </div>

      {/* Time */}
      <div className="mb-4">
        <label className="flex items-center gap-2 text-sm font-medium mb-2">
          <Clock className="w-4 h-4 text-primary" />
          {t('viewer.time')}: {hour.toString().padStart(2, '0')}:{minute.toString().padStart(2, '0')}
        </label>
        <input
          type="range"
          min={0}
          max={23}
          value={hour}
          onChange={(e) => setHour(parseInt(e.target.value))}
          className="w-full accent-yellow-500"
        />
        <div className="flex justify-between text-xs text-muted-foreground mt-1">
          <span>00:00</span>
          <span>12:00</span>
          <span>24:00</span>
        </div>
      </div>

      {/* Play/Pause animation */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className={cn(
            'flex-1 flex items-center justify-center gap-2 py-2 rounded-lg font-medium transition-colors',
            isPlaying
              ? 'bg-destructive/10 text-destructive hover:bg-destructive/20'
              : 'bg-primary/10 text-primary hover:bg-primary/20'
          )}
        >
          {isPlaying ? (
            <>
              <Pause className="w-4 h-4" />
              {t('viewer.stop')}
            </>
          ) : (
            <>
              <Play className="w-4 h-4" />
              {t('viewer.animateDay')}
            </>
          )}
        </button>
      </div>

      {/* Sun info */}
      <div className="p-3 bg-muted/50 rounded-lg">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <span className="text-muted-foreground">{t('viewer.azimuth')}</span>
            <p className="font-mono">{azimuth.toFixed(1)}°</p>
          </div>
          <div>
            <span className="text-muted-foreground">{t('viewer.elevation')}</span>
            <p className="font-mono">{elevation.toFixed(1)}°</p>
          </div>
        </div>
        {elevation < 0 && (
          <p className="text-xs text-yellow-600 mt-2 text-center">
            {t('viewer.sunBelowHorizon')}
          </p>
        )}
      </div>
    </motion.div>
  );
}

export default SolarSimulator;
