import { Node, Edge } from '../types/index';

// Lake Tana shoreline in Bahir Dar: land is safely below lat 11.594 in the city center area.
// The lakefront promenade road runs at approximately lat 11.593–11.594.
// St. George Church sits right on the promenade at ~11.5935, 37.3882.

export const BAHIR_DAR_NODES: Node[] = [
  // Lakefront promenade (southernmost safe strip near the lake)
  { id: 'st_george', name: 'St. George Church', lat: 11.5955, lng: 37.3895 },
  { id: 'ghion_hotel', name: 'Ghion Hotel', lat: 11.5932, lng: 37.3848 },
  { id: 'fish_market', name: 'Fish Market', lat: 11.5930, lng: 37.3820 },
  { id: 'tana_hotel', name: 'Tana Hotel Area', lat: 11.5928, lng: 37.3800 },
  { id: 'lake_shore', name: 'Lake Tana Shore', lat: 11.5933, lng: 37.3862 },

  // City center (inland, south of promenade)
  { id: 'meskel', name: 'Meskel Square', lat: 11.5910, lng: 37.3868 },
  { id: 'immigration', name: 'Immigration Office', lat: 11.5918, lng: 37.3858 },
  { id: 'telecom', name: 'Ethio Telecom Office', lat: 11.5920, lng: 37.3872 },
  { id: 'post_office', name: 'Main Post Office', lat: 11.5922, lng: 37.3900 },
  { id: 'commercial_bank', name: 'Commercial Bank Junction', lat: 11.5925, lng: 37.3918 },
  { id: 'bus_station', name: 'Main Bus Station', lat: 11.5915, lng: 37.3912 },
  { id: 'tana_market', name: 'Tana Market', lat: 11.5918, lng: 37.3934 },
  { id: 'police_hq', name: 'Police Headquarters', lat: 11.5895, lng: 37.3870 },

  // East side
  { id: 'court', name: 'High Court', lat: 11.5928, lng: 37.3942 },
  { id: 'kebele01', name: 'Kebele 01 Area', lat: 11.5922, lng: 37.3960 },
  { id: 'kidane_mihret', name: 'Kidane Mihret Church', lat: 11.5925, lng: 37.3975 },
  { id: 'gonder_junction', name: 'Gonder Road Junction', lat: 11.5920, lng: 37.4055 },
  { id: 'customs', name: 'Customs & Revenue Office', lat: 11.5900, lng: 37.4088 },
  { id: 'hospital', name: 'Felege Hiwot Hospital', lat: 11.5870, lng: 37.4012 },
  { id: 'blue_nile', name: 'Blue Nile Bridge', lat: 11.5840, lng: 37.3920 },
  { id: 'science_faculty', name: 'Science Faculty Gate', lat: 11.5800, lng: 37.3960 },

  // West & stadium
  { id: 'stadium', name: 'Bahir Dar Stadium', lat: 11.5895, lng: 37.3830 },
  { id: 'injera_area', name: 'Injera Baking Area', lat: 11.5862, lng: 37.3840 },
  { id: 'kebele08', name: 'Kebele 08 Area', lat: 11.5832, lng: 37.3780 },
  { id: 'airport_road', name: 'Airport Road Junction', lat: 11.5820, lng: 37.3754 },
  { id: 'addis_junction', name: 'Addis Ababa Road Junction', lat: 11.5680, lng: 37.3760 },
  { id: 'abay_bridge', name: 'Abay Falls Road', lat: 11.5620, lng: 37.3700 },

  // South
  { id: 'university', name: 'Bahir Dar University', lat: 11.5796, lng: 37.3951 },
  { id: 'textile', name: 'Textile Factory', lat: 11.5760, lng: 37.4080 },
  { id: 'peda', name: 'PEDA Campus', lat: 11.5700, lng: 37.3990 },
  { id: 'poly', name: 'Poly Campus', lat: 11.5740, lng: 37.3880 },
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
  // Lakefront promenade strip (west → east)
  { source: 'tana_hotel', target: 'fish_market', distance: 350, baseTime: 3, trafficFactor: 1.0 },
  { source: 'fish_market', target: 'ghion_hotel', distance: 300, baseTime: 2, trafficFactor: 1.0 },
  { source: 'ghion_hotel', target: 'lake_shore', distance: 200, baseTime: 2, trafficFactor: 1.0 },
  { source: 'lake_shore', target: 'st_george', distance: 250, baseTime: 2, trafficFactor: 1.0 },

  // Promenade down to city center
  { source: 'tana_hotel', target: 'stadium', distance: 700, baseTime: 5, trafficFactor: 1.1,
    waypoints: [[11.5912, 37.3815]] },
  { source: 'ghion_hotel', target: 'immigration', distance: 400, baseTime: 3, trafficFactor: 1.1 },
  { source: 'ghion_hotel', target: 'meskel', distance: 500, baseTime: 4, trafficFactor: 1.1,
    waypoints: [[11.5920, 37.3858]] },
  { source: 'st_george', target: 'post_office', distance: 350, baseTime: 3, trafficFactor: 1.1,
    waypoints: [[11.5928, 37.3891]] },
  { source: 'st_george', target: 'telecom', distance: 300, baseTime: 2, trafficFactor: 1.2,
    waypoints: [[11.5926, 37.3875]] },

  // City center cluster
  { source: 'meskel', target: 'immigration', distance: 250, baseTime: 2, trafficFactor: 1.2 },
  { source: 'meskel', target: 'telecom', distance: 200, baseTime: 2, trafficFactor: 1.3 },
  { source: 'meskel', target: 'police_hq', distance: 350, baseTime: 3, trafficFactor: 1.2 },
  { source: 'meskel', target: 'stadium', distance: 500, baseTime: 4, trafficFactor: 1.3,
    waypoints: [[11.5902, 37.3850]] },
  { source: 'telecom', target: 'post_office', distance: 250, baseTime: 2, trafficFactor: 1.2 },
  { source: 'post_office', target: 'commercial_bank', distance: 250, baseTime: 2, trafficFactor: 1.3 },
  { source: 'commercial_bank', target: 'bus_station', distance: 300, baseTime: 3, trafficFactor: 1.5 },
  { source: 'commercial_bank', target: 'court', distance: 300, baseTime: 3, trafficFactor: 1.2 },
  { source: 'bus_station', target: 'tana_market', distance: 400, baseTime: 3, trafficFactor: 1.8 },
  { source: 'tana_market', target: 'hospital', distance: 1200, baseTime: 10, trafficFactor: 1.5,
    waypoints: [[11.5905, 37.3960], [11.5885, 37.3990]] },

  // East corridor
  { source: 'court', target: 'kebele01', distance: 300, baseTime: 2, trafficFactor: 1.1 },
  { source: 'kebele01', target: 'kidane_mihret', distance: 300, baseTime: 2, trafficFactor: 1.0 },
  { source: 'kidane_mihret', target: 'gonder_junction', distance: 800, baseTime: 6, trafficFactor: 1.0,
    waypoints: [[11.5922, 37.4015]] },
  { source: 'gonder_junction', target: 'customs', distance: 1100, baseTime: 9, trafficFactor: 1.2,
    waypoints: [[11.5910, 37.4072]] },
  { source: 'gonder_junction', target: 'tana_market', distance: 1200, baseTime: 10, trafficFactor: 1.3,
    waypoints: [[11.5922, 37.3995], [11.5920, 37.3965]] },
  { source: 'customs', target: 'hospital', distance: 700, baseTime: 5, trafficFactor: 1.3,
    waypoints: [[11.5885, 37.4050]] },
  { source: 'customs', target: 'tana_market', distance: 900, baseTime: 7, trafficFactor: 1.5,
    waypoints: [[11.5908, 37.4060]] },

  // Blue Nile & hospital
  { source: 'bus_station', target: 'blue_nile', distance: 800, baseTime: 6, trafficFactor: 1.3,
    waypoints: [[11.5878, 37.3915]] },
  { source: 'blue_nile', target: 'hospital', distance: 500, baseTime: 4, trafficFactor: 1.2,
    waypoints: [[11.5855, 37.3960]] },
  { source: 'blue_nile', target: 'science_faculty', distance: 600, baseTime: 5, trafficFactor: 1.0,
    waypoints: [[11.5820, 37.3938]] },
  { source: 'stadium', target: 'blue_nile', distance: 1100, baseTime: 8, trafficFactor: 1.2,
    waypoints: [[11.5868, 37.3870], [11.5852, 37.3898]] },
  { source: 'police_hq', target: 'blue_nile', distance: 600, baseTime: 5, trafficFactor: 1.1,
    waypoints: [[11.5868, 37.3893]] },

  // University & south
  { source: 'bus_station', target: 'university', distance: 2000, baseTime: 15, trafficFactor: 1.1,
    waypoints: [[11.5878, 37.3928], [11.5838, 37.3938]] },
  { source: 'hospital', target: 'university', distance: 1500, baseTime: 12, trafficFactor: 1.2,
    waypoints: [[11.5838, 37.3998], [11.5815, 37.3975]] },
  { source: 'science_faculty', target: 'university', distance: 400, baseTime: 3, trafficFactor: 1.0 },
  { source: 'university', target: 'poly', distance: 1000, baseTime: 8, trafficFactor: 1.0,
    waypoints: [[11.5768, 37.3918]] },
  { source: 'university', target: 'peda', distance: 900, baseTime: 7, trafficFactor: 1.0,
    waypoints: [[11.5748, 37.3970]] },
  { source: 'textile', target: 'university', distance: 1300, baseTime: 10, trafficFactor: 1.1,
    waypoints: [[11.5778, 37.4018]] },
  { source: 'textile', target: 'hospital', distance: 1500, baseTime: 12, trafficFactor: 1.2,
    waypoints: [[11.5815, 37.4048]] },
  { source: 'textile', target: 'peda', distance: 800, baseTime: 6, trafficFactor: 1.0,
    waypoints: [[11.5728, 37.4033]] },
  { source: 'peda', target: 'poly', distance: 1200, baseTime: 9, trafficFactor: 1.0,
    waypoints: [[11.5718, 37.3933]] },
  { source: 'science_faculty', target: 'textile', distance: 1100, baseTime: 9, trafficFactor: 1.1,
    waypoints: [[11.5780, 37.4018]] },

  // West & airport
  { source: 'meskel', target: 'airport_road', distance: 2500, baseTime: 18, trafficFactor: 1.0,
    waypoints: [[11.5905, 37.3845], [11.5870, 37.3798], [11.5845, 37.3768]] },
  { source: 'stadium', target: 'airport_road', distance: 900, baseTime: 7, trafficFactor: 1.0,
    waypoints: [[11.5858, 37.3808]] },
  { source: 'stadium', target: 'injera_area', distance: 500, baseTime: 4, trafficFactor: 1.1 },
  { source: 'injera_area', target: 'kebele08', distance: 600, baseTime: 5, trafficFactor: 1.0,
    waypoints: [[11.5848, 37.3808]] },
  { source: 'injera_area', target: 'police_hq', distance: 400, baseTime: 3, trafficFactor: 1.1 },
  { source: 'kebele08', target: 'airport_road', distance: 700, baseTime: 5, trafficFactor: 1.0,
    waypoints: [[11.5826, 37.3765]] },
  { source: 'kebele08', target: 'stadium', distance: 800, baseTime: 6, trafficFactor: 1.1,
    waypoints: [[11.5862, 37.3805]] },
  { source: 'airport_road', target: 'poly', distance: 1800, baseTime: 13, trafficFactor: 1.1,
    waypoints: [[11.5788, 37.3798], [11.5758, 37.3838]] },
  { source: 'addis_junction', target: 'airport_road', distance: 1100, baseTime: 8, trafficFactor: 1.0,
    waypoints: [[11.5748, 37.3753]] },
  { source: 'addis_junction', target: 'poly', distance: 1400, baseTime: 11, trafficFactor: 1.1,
    waypoints: [[11.5718, 37.3818]] },
  { source: 'addis_junction', target: 'peda', distance: 1600, baseTime: 13, trafficFactor: 1.0,
    waypoints: [[11.5688, 37.3873]] },
  { source: 'abay_bridge', target: 'addis_junction', distance: 900, baseTime: 7, trafficFactor: 1.0,
    waypoints: [[11.5648, 37.3728]] },
  { source: 'abay_bridge', target: 'airport_road', distance: 1400, baseTime: 11, trafficFactor: 1.0,
    waypoints: [[11.5698, 37.3718], [11.5758, 37.3733]] },
  { source: 'abay_bridge', target: 'kebele08', distance: 1200, baseTime: 9, trafficFactor: 1.0,
    waypoints: [[11.5728, 37.3738]] },
];

export const BAHIR_DAR_EDGES: Edge[] = createBidirectional(BASE_EDGES);
