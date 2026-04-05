import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Tooltip, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Node, RouteResult, EdgeWithTraffic } from '../types/index';
import { BAHIR_DAR_EDGES } from '../data/bahirdar-graph';
import { computeEdgeTraffic, getTrafficColor } from '../lib/dijkstra';
import AnimatedCarMarker from './AnimatedCarMarker';

const createNodeIcon = (isRouteNode: boolean, isStart: boolean, isEnd: boolean) => {
  let color = '#64748b';
  let size = 8;
  let border = '#94a3b8';

  if (isStart) { color = '#2563eb'; size = 14; border = '#1d4ed8'; }
  else if (isEnd) { color = '#dc2626'; size = 14; border = '#b91c1c'; }
  else if (isRouteNode) { color = '#3b82f6'; size = 10; border = '#2563eb'; }

  return L.divIcon({
    className: '',
    html: `<div style="
      width:${size}px;height:${size}px;
      background:${color};
      border:2px solid ${border};
      border-radius:50%;
      box-shadow:0 2px ${isStart || isEnd ? '8' : '4'}px ${color}60;
    "></div>`,
    iconSize: [size + 4, size + 4],
    iconAnchor: [(size + 4) / 2, (size + 4) / 2],
  });
};

type MapTheme = 'day' | 'night';

const TILE_LAYERS: Record<MapTheme, { url: string; attribution: string }> = {
  day: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  },
  night: {
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; CARTO',
  },
};

const MapInitializer: React.FC = () => {
  const map = useMap();
  useEffect(() => {
    const container = map.getContainer();
    const observer = new ResizeObserver(() => {
      map.invalidateSize();
    });
    observer.observe(container);
    // Also fire on mount with delays
    const t1 = setTimeout(() => map.invalidateSize(), 100);
    const t2 = setTimeout(() => map.invalidateSize(), 500);
    return () => {
      observer.disconnect();
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [map]);
  return null;
};

const RouteBounds: React.FC<{ route: RouteResult | null }> = ({ route }) => {
  const map = useMap();
  useEffect(() => {
    if (route && route.path.length > 0) {
      const bounds = L.latLngBounds(route.path.map(n => [n.lat, n.lng]));
      map.fitBounds(bounds, { padding: [80, 80], maxZoom: 15 });
    }
  }, [route, map]);
  return null;
};

const getEdgePositions = (edge: EdgeWithTraffic, nodes: Node[]): [number, number][] => {
  const sourceNode = nodes.find(n => n.id === edge.source);
  const targetNode = nodes.find(n => n.id === edge.target);
  if (!sourceNode || !targetNode) return [];

  const positions: [number, number][] = [[sourceNode.lat, sourceNode.lng]];
  if (edge.waypoints) {
    positions.push(...edge.waypoints);
  }
  positions.push([targetNode.lat, targetNode.lng]);
  return positions;
};

interface SmartMapProps {
  route: RouteResult | null;
  allNodes: Node[];
}

const SmartMap: React.FC<SmartMapProps> = ({ route, allNodes }) => {
  const [mapTheme, setMapTheme] = useState<MapTheme>('day');
  const center: [number, number] = [11.5870, 37.3880];
  const allEdgesWithTraffic = computeEdgeTraffic(BAHIR_DAR_EDGES);
  const tileLayer = TILE_LAYERS[mapTheme];
  const mapClass = mapTheme === 'day' ? 'leaflet-map--day' : '';
  const tooltipTextColor = mapTheme === 'night' ? '#f8fafc' : '#0f172a';
  const tooltipSubtextColor = mapTheme === 'night' ? '#cbd5e1' : '#64748b';

  // Deduplicate edges (only show one direction)
  const seenEdges = new Set<string>();
  const uniqueEdges = allEdgesWithTraffic.filter(edge => {
    const key = [edge.source, edge.target].sort().join('-');
    if (seenEdges.has(key)) return false;
    seenEdges.add(key);
    return true;
  });

  const routeNodeIds = new Set(route?.path.map(n => n.id) || []);

  return (
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
      <div className="absolute top-4 right-4 z-[1002] rounded-full border border-border bg-card/85 p-1 shadow-2xl backdrop-blur-md">
        <button
          type="button"
          aria-label={mapTheme === 'day' ? 'Switch to night mode' : 'Switch to day mode'}
          title={mapTheme === 'day' ? 'Night mode' : 'Day mode'}
          onClick={() => setMapTheme(mapTheme === 'day' ? 'night' : 'day')}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-background/90 text-2xl text-foreground transition duration-200 hover:bg-primary hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          {mapTheme === 'day' ? '🌙' : '☀️'}
        </button>
      </div>
      <MapContainer
        center={center}
        zoom={13}
        scrollWheelZoom={true}
        zoomControl={true}
        className={mapClass}
        style={{ height: '100%', width: '100%', background: mapTheme === 'day' ? '#f8fafc' : '#0f172a' }}
      >
        <MapInitializer />
        <TileLayer
          url={tileLayer.url}
          attribution={tileLayer.attribution}
          maxZoom={19}
        />

        {/* All road segments with traffic colors */}
        {uniqueEdges.map((edge, idx) => {
          const positions = getEdgePositions(edge, allNodes);
          if (positions.length < 2) return null;
          const color = getTrafficColor(edge.trafficLevel);
          const sourceNode = allNodes.find(n => n.id === edge.source);
          const targetNode = allNodes.find(n => n.id === edge.target);

          return (
            <React.Fragment key={`road-${idx}`}>
              {/* Glow */}
              <Polyline
                positions={positions}
                pathOptions={{ color, weight: 10, opacity: 0.12, lineJoin: 'round', lineCap: 'round' }}
              />
              {/* Road */}
              <Polyline
                positions={positions}
                pathOptions={{ color, weight: 4, opacity: 0.85, lineJoin: 'round', lineCap: 'round' }}
              >
                <Tooltip className="traffic-tooltip" sticky>
                  <div style={{ minWidth: 140, color: tooltipTextColor }}>
                    <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4, color: tooltipTextColor }}>
                      {sourceNode?.name} → {targetNode?.name}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                      <span style={{
                        width: 8, height: 8, borderRadius: '50%', background: color, display: 'inline-block',
                      }} />
                      <span style={{ textTransform: 'capitalize', fontWeight: 600, color: tooltipSubtextColor }}>
                        {edge.trafficLevel} Traffic
                      </span>
                    </div>
                    <div style={{ color: tooltipSubtextColor, fontSize: 11 }}>
                      ETA: <strong style={{ color: tooltipTextColor }}>{edge.currentTime} min</strong>
                      &nbsp;·&nbsp;{(edge.distance / 1000).toFixed(1)} km
                    </div>
                  </div>
                </Tooltip>
              </Polyline>
            </React.Fragment>
          );
        })}

        {/* Optimized route overlay or Custom Alternates */}
        {route && route.isCustomEgg && route.alternatives ? (
          route.alternatives.map((alt, altIdx) => {
            const allPositions: [number, number][] = [];
            // Build full path positions for this alternative
            alt.edges.forEach((edge) => {
              const positions = getEdgePositions(edge, allNodes);
              if (allPositions.length === 0) {
                allPositions.push(...positions);
              } else {
                allPositions.push(...positions.slice(1));
              }
            });

            const color = alt.style === 'optimal' ? '#3b82f6' : alt.style === 'alternative' ? '#ef4444' : '#94a3b8';
            const weight = alt.style === 'optimal' ? 8 : 4;
            const opacity = alt.style === 'congested' ? 0.4 : 0.9;
            const dashArray = alt.style === 'optimal' ? undefined : '8 6';

            return (
              <React.Fragment key={`alt-route-${altIdx}`}>
                <Polyline
                  positions={allPositions}
                  pathOptions={{ color, weight: weight + 6, opacity: 0.2, lineJoin: 'round', lineCap: 'round' }}
                />
                <Polyline
                  positions={allPositions}
                  pathOptions={{ color, weight, opacity, lineJoin: 'round', lineCap: 'round', dashArray }}
                />
                {/* Spawn animated cars along this path */}
                {Array.from({ length: alt.carCount }).map((_, carIdx) => (
                  <AnimatedCarMarker
                    key={`car-${altIdx}-${carIdx}`}
                    positions={allPositions}
                    color={color}
                    delay={(10000 / alt.carCount) * carIdx} // space out cars
                    duration={10000} // configurable
                  />
                ))}
              </React.Fragment>
            );
          })
        ) : (
          route && route.edges.map((edge, idx) => {
            const positions = getEdgePositions(edge, allNodes);
            if (positions.length < 2) return null;
            return (
              <React.Fragment key={`route-${idx}`}>
                <Polyline
                  positions={positions}
                  pathOptions={{ color: '#3b82f6', weight: 14, opacity: 0.2, lineJoin: 'round', lineCap: 'round' }}
                />
                <Polyline
                  positions={positions}
                  pathOptions={{ color: '#60a5fa', weight: 5, opacity: 0.9, lineJoin: 'round', lineCap: 'round', dashArray: '12 6' }}
                />
              </React.Fragment>
            );
          })
        )}

        {/* Node markers */}
        {allNodes.map((node) => {
          const isStart = route?.path[0]?.id === node.id;
          const isEnd = route?.path[route.path.length - 1]?.id === node.id;
          const isRouteNode = routeNodeIds.has(node.id);

          return (
            <Marker
              key={node.id}
              position={[node.lat, node.lng]}
              icon={createNodeIcon(isRouteNode, isStart, isEnd)}
            >
              <Tooltip direction="top" offset={[0, -8]} className="traffic-tooltip">
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13, color: tooltipTextColor }}>{node.name}</div>
                  <div style={{ color: tooltipSubtextColor, fontSize: 11 }}>
                    {isStart ? '🟢 Origin' : isEnd ? '🔴 Destination' : '📍 Landmark'}
                  </div>
                </div>
              </Tooltip>
            </Marker>
          );
        })}

        <RouteBounds route={route} />
      </MapContainer>
    </div>
  );
};

export default SmartMap;
