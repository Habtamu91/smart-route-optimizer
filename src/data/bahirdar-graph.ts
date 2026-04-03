import { Node, Edge } from '../types/index';

export const BAHIR_DAR_NODES: Node[] = [
  { id: 'meskel', name: 'Meskel Square', lat: 11.5973, lng: 37.3878 },
  { id: 'bus_station', name: 'Main Bus Station', lat: 11.5936, lng: 37.3912 },
  { id: 'lake_shore', name: 'Lake Tana Shore', lat: 11.6033, lng: 37.3842 },
  { id: 'st_george', name: 'St. George Church', lat: 11.5992, lng: 37.3895 },
  { id: 'university', name: 'Bahir Dar University', lat: 11.5796, lng: 37.3951 },
  { id: 'tana_market', name: 'Tana Market', lat: 11.5955, lng: 37.3934 },
  { id: 'hospital', name: 'Felege Hiwot Hospital', lat: 11.5882, lng: 37.4012 },
  { id: 'airport_road', name: 'Airport Road Junction', lat: 11.5831, lng: 37.3754 },
  { id: 'poly', name: 'Poly Campus', lat: 11.5740, lng: 37.3880 },
  { id: 'stadium', name: 'Bahir Dar Stadium', lat: 11.5910, lng: 37.3830 },
  { id: 'blue_nile', name: 'Blue Nile Bridge', lat: 11.5850, lng: 37.3920 },
];

const createBidirectional = (edges: Edge[]): Edge[] => {
  const result: Edge[] = [];
  for (const edge of edges) {
    result.push(edge);
    result.push({
      ...edge,
      source: edge.target,
      target: edge.source,
      waypoints: edge.waypoints ? [...edge.waypoints].reverse() : undefined,
    });
  }
  return result;
};

const BASE_EDGES: Edge[] = [
  { source: 'meskel', target: 'bus_station', distance: 650, baseTime: 5, trafficFactor: 1.4,
    waypoints: [[11.5965, 37.3885], [11.5950, 37.3900]] },
  { source: 'meskel', target: 'st_george', distance: 300, baseTime: 2, trafficFactor: 1.0,
    waypoints: [[11.5980, 37.3885]] },
  { source: 'st_george', target: 'lake_shore', distance: 800, baseTime: 6, trafficFactor: 1.1,
    waypoints: [[11.6005, 37.3875], [11.6020, 37.3860]] },
  { source: 'bus_station', target: 'tana_market', distance: 400, baseTime: 3, trafficFactor: 1.8,
    waypoints: [[11.5945, 37.3920]] },
  { source: 'tana_market', target: 'hospital', distance: 1200, baseTime: 10, trafficFactor: 1.5,
    waypoints: [[11.5940, 37.3960], [11.5910, 37.3990]] },
  { source: 'bus_station', target: 'university', distance: 2000, baseTime: 15, trafficFactor: 1.1,
    waypoints: [[11.5900, 37.3930], [11.5850, 37.3940]] },
  { source: 'hospital', target: 'university', distance: 1500, baseTime: 12, trafficFactor: 1.2,
    waypoints: [[11.5850, 37.4000], [11.5820, 37.3975]] },
  { source: 'meskel', target: 'airport_road', distance: 2500, baseTime: 18, trafficFactor: 1.0,
    waypoints: [[11.5950, 37.3850], [11.5900, 37.3800], [11.5860, 37.3770]] },
  { source: 'meskel', target: 'stadium', distance: 600, baseTime: 4, trafficFactor: 1.3,
    waypoints: [[11.5950, 37.3860]] },
  { source: 'stadium', target: 'airport_road', distance: 900, baseTime: 7, trafficFactor: 1.0,
    waypoints: [[11.5880, 37.3810]] },
  { source: 'bus_station', target: 'blue_nile', distance: 800, baseTime: 6, trafficFactor: 1.3,
    waypoints: [[11.5920, 37.3915]] },
  { source: 'blue_nile', target: 'hospital', distance: 500, baseTime: 4, trafficFactor: 1.2,
    waypoints: [[11.5865, 37.3960]] },
  { source: 'blue_nile', target: 'university', distance: 1200, baseTime: 9, trafficFactor: 1.0,
    waypoints: [[11.5830, 37.3910], [11.5810, 37.3930]] },
  { source: 'university', target: 'poly', distance: 1000, baseTime: 8, trafficFactor: 1.0,
    waypoints: [[11.5770, 37.3920]] },
  { source: 'airport_road', target: 'poly', distance: 1800, baseTime: 13, trafficFactor: 1.1,
    waypoints: [[11.5800, 37.3800], [11.5770, 37.3840]] },
  { source: 'st_george', target: 'tana_market', distance: 500, baseTime: 4, trafficFactor: 1.6,
    waypoints: [[11.5975, 37.3910]] },
  { source: 'stadium', target: 'blue_nile', distance: 1100, baseTime: 8, trafficFactor: 1.2,
    waypoints: [[11.5890, 37.3870], [11.5870, 37.3900]] },
];

export const BAHIR_DAR_EDGES: Edge[] = createBidirectional(BASE_EDGES);
