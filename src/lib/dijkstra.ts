import { Node, Edge, EdgeWithTraffic, RouteResult, TrafficLevel } from '../types';

export function getTrafficLevel(factor: number): TrafficLevel {
  if (factor <= 1.2) return 'low';
  if (factor <= 1.5) return 'medium';
  return 'high';
}

export function getTrafficColor(level: TrafficLevel): string {
  switch (level) {
    case 'low': return '#22c55e';
    case 'medium': return '#eab308';
    case 'high': return '#ef4444';
  }
}

export function computeEdgeTraffic(edges: Edge[]): EdgeWithTraffic[] {
  return edges.map(edge => {
    const trafficLevel = getTrafficLevel(edge.trafficFactor);
    return {
      ...edge,
      trafficLevel,
      currentTime: Math.round(edge.baseTime * edge.trafficFactor * 10) / 10,
    };
  });
}

export function dijkstra(
  nodes: Node[],
  edges: Edge[],
  startNodeId: string,
  endNodeId: string
): RouteResult | null {
  const distances: Record<string, number> = {};
  const previous: Record<string, string | null> = {};
  const unvisited = new Set<string>();

  nodes.forEach((node) => {
    distances[node.id] = Infinity;
    previous[node.id] = null;
    unvisited.add(node.id);
  });

  distances[startNodeId] = 0;

  while (unvisited.size > 0) {
    let currentNodeId: string | null = null;
    let minDistance = Infinity;

    unvisited.forEach((nodeId) => {
      if (distances[nodeId] < minDistance) {
        minDistance = distances[nodeId];
        currentNodeId = nodeId;
      }
    });

    if (currentNodeId === null || currentNodeId === endNodeId) break;

    unvisited.delete(currentNodeId);

    const neighbors = edges.filter((e) => e.source === currentNodeId);
    for (const edge of neighbors) {
      if (!unvisited.has(edge.target)) continue;

      // Penalize high-traffic roads more heavily
      const congestionPenalty = edge.trafficFactor > 1.5 ? edge.trafficFactor * 1.5 : edge.trafficFactor;
      const alt = distances[currentNodeId] + edge.baseTime * congestionPenalty;
      if (alt < distances[edge.target]) {
        distances[edge.target] = alt;
        previous[edge.target] = currentNodeId;
      }
    }
  }

  if (distances[endNodeId] === Infinity) return null;

  const path: Node[] = [];
  let current: string | null = endNodeId;
  while (current !== null) {
    const node = nodes.find((n) => n.id === current);
    if (node) path.unshift(node);
    current = previous[current];
  }

  const routeEdges: EdgeWithTraffic[] = [];
  let totalDistance = 0;
  let totalTime = 0;

  for (let i = 0; i < path.length - 1; i++) {
    const edge = edges.find(
      (e) => e.source === path[i].id && e.target === path[i + 1].id
    );
    if (edge) {
      const trafficLevel = getTrafficLevel(edge.trafficFactor);
      const currentTime = Math.round(edge.baseTime * edge.trafficFactor * 10) / 10;
      routeEdges.push({ ...edge, trafficLevel, currentTime });
      totalDistance += edge.distance;
      totalTime += currentTime;
    }
  }

  const avgFactor = routeEdges.length > 0
    ? routeEdges.reduce((sum, e) => sum + e.trafficFactor, 0) / routeEdges.length
    : 1;
  const trafficStatus = avgFactor <= 1.2 ? 'light' : avgFactor <= 1.5 ? 'moderate' : 'heavy';

  return {
    path,
    totalDistance,
    totalTime: Math.round(totalTime),
    trafficStatus,
    edges: routeEdges,
  };
}
