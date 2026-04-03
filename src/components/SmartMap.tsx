import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Tooltip, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Node, RouteResult, EdgeWithTraffic } from '../types/index';
import { BAHIR_DAR_EDGES } from '../data/bahirdar-graph';
import { computeEdgeTraffic, getTrafficColor } from '../lib/dijkstra';

const createNodeIcon = (isRouteNode: boolean, isStart: boolean, isEnd: boolean) => {
  let color = '#475569';
  let size = 8;
  let border = '#1e293b';

  if (isStart) { color = '#3b82f6'; size = 14; border = '#1d4ed8'; }
  else if (isEnd) { color = '#ef4444'; size = 14; border = '#b91c1c'; }
  else if (isRouteNode) { color = '#60a5fa'; size = 10; border = '#3b82f6'; }

  return L.divIcon({
    className: '',
    html: `<div style="
      width:${size}px;height:${size}px;
      background:${color};
      border:2px solid ${border};
      border-radius:50%;
      box-shadow:0 0 ${isStart || isEnd ? '12' : '6'}px ${color}80;
    "></div>`,
    iconSize: [size + 4, size + 4],
    iconAnchor: [(size + 4) / 2, (size + 4) / 2],
  });
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
  const center: [number, number] = [11.590, 37.388];
  const allEdgesWithTraffic = computeEdgeTraffic(BAHIR_DAR_EDGES);

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
      <MapContainer
        center={center}
        zoom={14}
        scrollWheelZoom={true}
        zoomControl={true}
        style={{ height: '100%', width: '100%' }}
      >
        <MapInitializer />
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
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
                pathOptions={{ color, weight: 10, opacity: 0.15, lineJoin: 'round', lineCap: 'round' }}
              />
              {/* Road */}
              <Polyline
                positions={positions}
                pathOptions={{ color, weight: 4, opacity: 0.7, lineJoin: 'round', lineCap: 'round' }}
              >
                <Tooltip className="traffic-tooltip" sticky>
                  <div style={{ minWidth: 140 }}>
                    <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4 }}>
                      {sourceNode?.name} → {targetNode?.name}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                      <span style={{
                        width: 8, height: 8, borderRadius: '50%', background: color, display: 'inline-block',
                        boxShadow: `0 0 6px ${color}`
                      }} />
                      <span style={{ textTransform: 'capitalize', fontWeight: 600 }}>
                        {edge.trafficLevel} Traffic
                      </span>
                    </div>
                    <div style={{ color: '#94a3b8', fontSize: 11 }}>
                      ETA: <strong style={{ color: '#e2e8f0' }}>{edge.currentTime} min</strong>
                      &nbsp;·&nbsp;{(edge.distance / 1000).toFixed(1)} km
                    </div>
                  </div>
                </Tooltip>
              </Polyline>
            </React.Fragment>
          );
        })}

        {/* Optimized route overlay */}
        {route && route.edges.map((edge, idx) => {
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
        })}

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
                  <div style={{ fontWeight: 700, fontSize: 13 }}>{node.name}</div>
                  <div style={{ color: '#94a3b8', fontSize: 11 }}>
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
