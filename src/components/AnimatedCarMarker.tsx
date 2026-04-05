import React, { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

export interface AnimatedCarMarkerProps {
  positions: [number, number][];
  duration?: number; // total duration in ms to traverse the whole path
  delay?: number;
  color?: string;
  size?: number;
}

const interpolatePosition = (
  segments: { p1: [number, number]; p2: [number, number]; dist: number; accumulated: number }[],
  totalDist: number,
  progress: number
): [number, number] => {
  const targetDist = progress * totalDist;
  
  // Find which segment we are in
  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    if (targetDist <= seg.accumulated || i === segments.length - 1) {
      const segStartDist = seg.accumulated - seg.dist;
      const progressInSeg = seg.dist === 0 ? 0 : (targetDist - segStartDist) / seg.dist;
      
      const lat = seg.p1[0] + (seg.p2[0] - seg.p1[0]) * progressInSeg;
      const lng = seg.p1[1] + (seg.p2[1] - seg.p1[1]) * progressInSeg;
      return [lat, lng];
    }
  }
  return segments[segments.length - 1].p2;
};

const AnimatedCarMarker: React.FC<AnimatedCarMarkerProps> = ({ 
  positions, 
  duration = 10000, 
  delay = 0,
  color = '#ffffff',
  size = 12
}) => {
  const map = useMap();
  const markerRef = useRef<L.Marker | null>(null);
  
  useEffect(() => {
    if (positions.length < 2) return;

    // Calculate segments and euclidean distances
    let totalDist = 0;
    const segments: { p1: [number, number]; p2: [number, number]; dist: number; accumulated: number }[] = [];
    
    for (let i = 0; i < positions.length - 1; i++) {
      const p1 = positions[i];
      const p2 = positions[i + 1];
      const dist = Math.sqrt(Math.pow(p2[0] - p1[0], 2) + Math.pow(p2[1] - p1[1], 2));
      totalDist += dist;
      segments.push({ p1, p2, dist, accumulated: totalDist });
    }

    const icon = L.divIcon({
      className: '',
      html: `<div style="
        width: ${size}px; 
        height: ${size}px; 
        background: #ffffff;
        border: 2.5px solid ${color};
        border-radius: 50%;
        box-shadow: 0 0 12px ${color}, 0 2px 6px rgba(0,0,0,0.8);
      "></div>`,
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
    });

    const marker = L.marker(positions[0], { icon, zIndexOffset: 1000 }).addTo(map);
    markerRef.current = marker;

    let startTime = performance.now() + delay;
    let animationFrameId: number;

    const animate = (time: number) => {
      let elapsed = time - startTime;
      if (elapsed < 0) {
        // Still in delay phase
        animationFrameId = requestAnimationFrame(animate);
        return;
      }
      
      // Loop the animation
      elapsed = elapsed % duration;
      const progress = elapsed / duration;
      
      const currentPos = interpolatePosition(segments, totalDist, progress);
      marker.setLatLng(currentPos);
      
      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationFrameId);
      marker.remove();
    };
  }, [map, positions, duration, delay, color, size]);

  return null;
};

export default AnimatedCarMarker;
