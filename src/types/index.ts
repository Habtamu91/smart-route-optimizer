export interface Node {
  id: string;
  name: string;
  lat: number;
  lng: number;
}

export interface Edge {
  source: string;
  target: string;
  distance: number;
  baseTime: number;
  trafficFactor: number;
  waypoints?: [number, number][];
}

export type TrafficLevel = 'low' | 'medium' | 'high';

export interface EdgeWithTraffic extends Edge {
  trafficLevel: TrafficLevel;
  currentTime: number;
}

export interface RouteResult {
  path: Node[];
  totalDistance: number;
  totalTime: number;
  trafficStatus: 'light' | 'moderate' | 'heavy';
  edges: EdgeWithTraffic[];
  isCustomEgg?: boolean;
  alternatives?: {
    path: Node[];
    edges: EdgeWithTraffic[];
    style: 'optimal' | 'alternative' | 'congested';
    carCount: number;
  }[];
}
