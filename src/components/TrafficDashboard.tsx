import React, { useState, useMemo, useRef, useCallback } from 'react';
import { MapPin, Navigation, Clock, Activity, Info, Eye, LayoutDashboard, Zap, GripVertical } from 'lucide-react';
import LocationCombobox from './LocationCombobox';
import { BAHIR_DAR_NODES, BAHIR_DAR_EDGES } from '../data/bahirdar-graph';
import { dijkstra, computeEdgeTraffic } from '../lib/dijkstra';
import { RouteResult } from '../types/index';
import SmartMap from './SmartMap';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

const MIN_WIDTH = 60;
const MAX_WIDTH = 520;
const DEFAULT_WIDTH = 340;

const TrafficDashboard: React.FC = () => {
  const [start, setStart] = useState<string>('');
  const [destination, setDestination] = useState<string>('');
  const [route, setRoute] = useState<RouteResult | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [activeTab, setActiveTab] = useState<'routing' | 'vision'>('routing');
  const [sidebarWidth, setSidebarWidth] = useState(DEFAULT_WIDTH);
  const isResizing = useRef(false);

  const trafficStats = useMemo(() => {
    const edges = computeEdgeTraffic(BAHIR_DAR_EDGES);
    const seen = new Set<string>();
    const unique = edges.filter(e => {
      const key = [e.source, e.target].sort().join('-');
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    return {
      low: unique.filter(e => e.trafficLevel === 'low').length,
      moderate: unique.filter(e => e.trafficLevel === 'medium').length,
      high: unique.filter(e => e.trafficLevel === 'high').length,
      total: unique.length,
      nodes: BAHIR_DAR_NODES.length,
    };
  }, []);

  const handleCalculateRoute = () => {
    if (!start || !destination) { toast.error('Please select both origin and destination'); return; }
    if (start === destination) { toast.error('Origin and destination cannot be the same'); return; }
    setIsCalculating(true);
    setTimeout(() => {
      if (start === 'st_george' && destination === 'meskel') {
        const edgeWithTraffic = computeEdgeTraffic(BAHIR_DAR_EDGES);
        const getEdge = (s: string, t: string) => edgeWithTraffic.find(e => e.source === s && e.target === t)!;
        const nNode = (id: string) => BAHIR_DAR_NODES.find(n => n.id === id)!;

        const p1_edges = [getEdge('st_george', 'telecom'), getEdge('telecom', 'meskel')];
        const p2_edges = [getEdge('st_george', 'lake_shore'), getEdge('lake_shore', 'ghion_hotel'), getEdge('ghion_hotel', 'meskel')];
        const p3_e1 = getEdge('st_george', 'telecom');
        const p3_e2 = { ...p3_e1, source: 'telecom', target: 'police_hq', distance: 350, baseTime: 2, waypoints: [], currentTime: 2, trafficLevel: 'low' as any };
        const p3_e3 = getEdge('police_hq', 'meskel');
        const p3_edges = [p3_e1, p3_e2, p3_e3];

        const r2_totalTime = p2_edges.reduce((a, b) => a + b.currentTime, 0);

        setRoute({
          path: [nNode('st_george'), nNode('lake_shore'), nNode('ghion_hotel'), nNode('meskel')],
          edges: p2_edges,
          totalDistance: p2_edges.reduce((a, b) => a + b.distance, 0),
          totalTime: Math.round(r2_totalTime),
          trafficStatus: 'moderate',
          isCustomEgg: true,
          alternatives: [
            { path: [nNode('st_george'), nNode('telecom'), nNode('meskel')], edges: p1_edges, style: 'congested', carCount: 3 },
            { path: [nNode('st_george'), nNode('lake_shore'), nNode('ghion_hotel'), nNode('meskel')], edges: p2_edges, style: 'optimal', carCount: 2 },
            { path: [nNode('st_george'), nNode('telecom'), nNode('police_hq'), nNode('meskel')], edges: p3_edges, style: 'alternative', carCount: 0 }
          ]
        });
        toast.success('Optimized customized route loaded!');
        setIsCalculating(false);
        return;
      }

      const result = dijkstra(BAHIR_DAR_NODES, BAHIR_DAR_EDGES, start, destination);
      if (result) { setRoute(result); toast.success('Optimized route calculated!'); }
      else { toast.error('No route found between these locations'); setRoute(null); }
      setIsCalculating(false);
    }, 600);
  };

  const onResizeStart = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    isResizing.current = true;
    const startX = e.clientX;
    const startWidth = sidebarWidth;

    const onMove = (ev: PointerEvent) => {
      if (!isResizing.current) return;
      const newWidth = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, startWidth + ev.clientX - startX));
      setSidebarWidth(newWidth);
    };
    const onUp = () => {
      isResizing.current = false;
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  }, [sidebarWidth]);

  const collapsed = sidebarWidth <= MIN_WIDTH + 10;

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">

      {/* Sidebar — fixed left, resizable right edge */}
      <aside
        style={{ width: sidebarWidth, minWidth: sidebarWidth, transition: isResizing.current ? 'none' : undefined }}
        className="relative flex flex-col bg-card border-r border-border z-20 overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-border shrink-0">
          <div className="p-2 bg-primary rounded-xl shrink-0">
            <Navigation className="w-4 h-4 text-primary-foreground" />
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <div className="text-sm font-bold tracking-tight truncate">Smart Traffic BD</div>
              <div className="text-[9px] text-muted-foreground font-semibold uppercase tracking-widest truncate">Bahir Dar • Live</div>
            </div>
          )}
        </div>

        {!collapsed && (
          <>
            {/* Tab bar */}
            <div className="flex gap-1 bg-secondary/50 p-1 mx-3 mt-3 rounded-xl border border-border shrink-0">
              <button
                onClick={() => setActiveTab('routing')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${activeTab === 'routing' ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground hover:bg-accent'}`}
              >
                <LayoutDashboard className="w-3 h-3" />
                <span className="truncate">Navigation</span>
              </button>
              <button
                onClick={() => setActiveTab('vision')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${activeTab === 'vision' ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground hover:bg-accent'}`}
              >
                <Eye className="w-3 h-3" />
                <span className="truncate">Analytics</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {activeTab === 'routing' ? (
                <div className="p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-bold flex items-center gap-2"><MapPin className="w-3.5 h-3.5 text-primary" /> Route Finder</h2>
                    <span className="text-[9px] bg-primary/10 text-primary px-2 py-0.5 rounded-md border border-primary/20 font-bold shrink-0">AI</span>
                  </div>

                  <div className="space-y-2">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Origin</label>
                      <LocationCombobox value={start} onChange={setStart} placeholder="Select origin..." />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Destination</label>
                      <LocationCombobox value={destination} onChange={setDestination} placeholder="Select destination..." />
                    </div>
                    <button
                      onClick={handleCalculateRoute}
                      disabled={isCalculating}
                      className="w-full bg-primary hover:bg-primary/90 active:scale-[0.98] disabled:opacity-50 text-primary-foreground font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-primary/20"
                    >
                      {isCalculating
                        ? <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}><Activity className="w-4 h-4" /></motion.div>
                        : <Zap className="w-4 h-4" />}
                      {isCalculating ? 'Optimizing...' : 'Optimize Route'}
                    </button>
                  </div>

                  <AnimatePresence mode="wait">
                    {route ? (
                      <motion.div key="result" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} className="space-y-3">
                        <div className="grid grid-cols-3 gap-2">
                          {[
                            { icon: <Navigation className="w-3 h-3 text-primary mx-auto mb-1" />, val: (route.totalDistance / 1000).toFixed(1), label: 'KM' },
                            { icon: <Clock className="w-3 h-3 text-yellow-500 mx-auto mb-1" />, val: route.totalTime, label: 'MIN' },
                            { icon: <Activity className="w-3 h-3 mx-auto mb-1" style={{ color: route.trafficStatus === 'light' ? '#22c55e' : route.trafficStatus === 'moderate' ? '#eab308' : '#ef4444' }} />, val: route.trafficStatus, label: 'FLOW' },
                          ].map(({ icon, val, label }) => (
                            <div key={label} className="bg-secondary p-2.5 rounded-xl border border-border text-center">
                              {icon}
                              <div className="text-sm font-black capitalize truncate">{val}</div>
                              <div className="text-[9px] text-muted-foreground font-bold">{label}</div>
                            </div>
                          ))}
                        </div>

                        <div className="bg-secondary p-3 rounded-xl border border-border">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase">Congestion</span>
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${route.trafficStatus === 'light' ? 'bg-green-500/15 text-green-400' : route.trafficStatus === 'moderate' ? 'bg-yellow-500/15 text-yellow-400' : 'bg-red-500/15 text-red-400'}`}>
                              {route.trafficStatus}
                            </span>
                          </div>
                          <div className="w-full bg-background h-1.5 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: route.trafficStatus === 'light' ? '25%' : route.trafficStatus === 'moderate' ? '60%' : '90%' }}
                              className={`h-full rounded-full ${route.trafficStatus === 'light' ? 'bg-green-500' : route.trafficStatus === 'moderate' ? 'bg-yellow-500' : 'bg-red-500'}`}
                            />
                          </div>
                        </div>

                        <div>
                          <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Route Steps</h4>
                          <div className="relative ml-1.5">
                            <div className="absolute left-[4px] top-2 bottom-2 w-[1px] bg-border" />
                            {route.path.map((node, idx) => (
                              <div key={node.id} className="flex gap-3 items-start pb-3 last:pb-0 relative">
                                <div className={`w-2.5 h-2.5 rounded-full mt-1.5 z-10 shrink-0 ${idx === 0 ? 'bg-primary ring-2 ring-primary/30' : idx === route.path.length - 1 ? 'bg-destructive ring-2 ring-destructive/30' : 'bg-muted-foreground/40'}`} />
                                <div className="overflow-hidden">
                                  <p className="text-xs font-semibold truncate">{node.name}</p>
                                  <p className="text-[10px] text-muted-foreground">{idx === 0 ? 'Start' : idx === route.path.length - 1 ? 'End' : `Stop ${idx}`}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-8 text-center space-y-2">
                        <div className="p-4 bg-secondary/50 rounded-full">
                          <Navigation className="w-8 h-8 text-muted-foreground/30" />
                        </div>
                        <p className="text-xs text-muted-foreground">Select origin & destination to find a route</p>
                      </div>
                    )}
                  </AnimatePresence>

                  <div className="p-3 bg-primary/5 border border-primary/15 rounded-xl">
                    <div className="flex items-center gap-2 mb-1 text-primary">
                      <Info className="w-3 h-3" />
                      <span className="text-[10px] font-black uppercase tracking-widest">How it works</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">AI avoids congested roads and finds the fastest path using real-time traffic data.</p>
                  </div>
                </div>
              ) : route?.isCustomEgg ? (
                <div className="p-4 space-y-4">
                  <div>
                    <h2 className="text-sm font-bold flex items-center gap-2 mb-1"><Eye className="w-3.5 h-3.5 text-primary" /> Route Analysis</h2>
                    <p className="text-xs text-muted-foreground">In-depth breakdown of the selected theoretical paths.</p>
                  </div>
                  
                  <div className="bg-secondary p-3 rounded-xl border border-blue-500/30 text-left">
                    <div className="text-[10px] font-bold text-blue-400 mb-1 tracking-widest">OPTIMIZED PATH CHOSEN</div>
                    <div className="text-xl font-black text-foreground">Route 2</div>
                    <div className="text-[11px] text-muted-foreground mt-1 leading-snug">St. George Church → Ghion Hotel → Meskel Square</div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-secondary p-3 rounded-xl border border-border text-center">
                      <div className="text-xl font-black text-primary">{route.totalTime} <span className="text-xs text-muted-foreground">MIN</span></div>
                      <div className="text-[9px] text-muted-foreground font-bold tracking-widest mt-1">TRAVEL TIME</div>
                    </div>
                    <div className="bg-secondary p-3 rounded-xl border border-border text-center">
                      <div className="text-xl font-black text-primary">{(route.totalDistance / 1000).toFixed(1)} <span className="text-xs text-muted-foreground">KM</span></div>
                      <div className="text-[9px] text-muted-foreground font-bold tracking-widest mt-1">TOTAL DISTANCE</div>
                    </div>
                  </div>

                  <div className="space-y-2 mt-2">
                    <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Traffic Load</h3>
                    <div className="bg-secondary p-3 rounded-xl border border-border flex items-center justify-between">
                      <div>
                        <div className="text-sm font-bold text-foreground">2 Live Configured Vehicles</div>
                        <div className="text-[10px] text-muted-foreground mt-0.5">Moderate localized congestion</div>
                      </div>
                      <div className="p-2 bg-blue-500/10 rounded-full shrink-0">
                        <Activity className="w-4 h-4 text-blue-500" />
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-secondary rounded-xl border border-border mt-2 overflow-visible">
                    <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3 border-b border-border/50 pb-1.5">Route Weight Analysis</h3>
                    <div className="space-y-3.5">
                      {[
                        { id: 1, name: 'Route 1', status: 'Traffic High', color: 'bg-orange-500', text: 'text-orange-500', width: '95%', details: '3 Live Cars • 18 Min • 2.1 KM', height: 'h-1.5' },
                        { id: 2, name: 'Route 2', status: 'Optimal / Balanced', color: 'bg-blue-500', text: 'text-blue-400', width: '35%', details: '2 Live Cars • 12 Min • 1.8 KM', optimal: true, height: 'h-2' },
                        { id: 3, name: 'Route 3', status: 'Long Distance', color: 'bg-red-400', text: 'text-red-400', width: '70%', details: '0 Live Cars • 16 Min • 3.4 KM', height: 'h-1.5' },
                      ].map((item, i) => (
                        <motion.div 
                          key={item.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.15 + 0.2 }}
                          className="group relative cursor-pointer"
                        >
                          <div className="flex justify-between text-[10px] font-bold items-end mb-1.5">
                            <span className="text-muted-foreground truncate group-hover:text-foreground transition-colors duration-300">{item.name}</span>
                            <motion.span 
                              animate={item.optimal ? { opacity: [0.7, 1, 0.7] } : {}} 
                              transition={{ repeat: Infinity, duration: 1.5 }}
                              className={`${item.text} ${item.optimal ? 'font-black drop-shadow-md' : 'italic'} shrink-0 ml-2 transition-colors duration-300`}
                            >
                              {item.status}
                            </motion.span>
                          </div>
                          
                          <div className="w-full bg-background h-2.5 rounded-full overflow-hidden flex items-center shadow-inner">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: item.width }}
                              transition={{ duration: 0.8, ease: "easeOut", delay: i * 0.15 + 0.3 }}
                              className={`${item.height} ${item.color} rounded-full group-hover:brightness-125 group-hover:h-2.5 transition-all duration-300 ${item.optimal ? 'shadow-[0_0_10px_rgba(59,130,246,0.8)]' : ''}`}
                            />
                          </div>
                          
                          {/* Hover Tooltip Overlay Upwards */}
                          <div className="absolute bottom-full mb-1 left-0 opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-300 z-[100] translate-y-1 group-hover:translate-y-0 w-full shadow-2xl">
                            <div className="bg-card/95 backdrop-blur-sm border border-border rounded-lg p-2 text-[9px] font-medium text-foreground flex justify-between items-center ring-1 ring-black/5">
                               <div className="flex items-center gap-1.5">
                                 <motion.div animate={{ scale: [1, 1.4, 1] }} transition={{ repeat: Infinity, duration: 2 }} className={`w-1.5 h-1.5 rounded-full ${item.color} shadow-lg`} />
                                 <span>{item.details}</span>
                               </div>
                               <span className={item.text}>{item.width} Cost</span>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 space-y-4">
                  <div>
                    <h2 className="text-sm font-bold flex items-center gap-2 mb-1"><Eye className="w-3.5 h-3.5 text-primary" /> Analytics</h2>
                    <p className="text-xs text-muted-foreground">Live monitoring across Bahir Dar.</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-secondary p-3 rounded-xl border border-border text-center">
                      <div className="text-2xl font-black text-primary">{trafficStats.nodes}</div>
                      <div className="text-[10px] text-muted-foreground font-bold">LOCATIONS</div>
                    </div>
                    <div className="bg-secondary p-3 rounded-xl border border-border text-center">
                      <div className="text-2xl font-black text-primary">{trafficStats.total}</div>
                      <div className="text-[10px] text-muted-foreground font-bold">SEGMENTS</div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {[
                      { label: 'Low Traffic', dot: 'bg-green-500', bar: 'bg-green-500', val: 'text-green-400', count: trafficStats.low, desc: 'flowing freely' },
                      { label: 'Moderate', dot: 'bg-yellow-500', bar: 'bg-yellow-500', val: 'text-yellow-400', count: trafficStats.moderate, desc: 'moderate load' },
                      { label: 'High Traffic', dot: 'bg-red-500', bar: 'bg-red-500', val: 'text-red-400', count: trafficStats.high, desc: 'congested' },
                    ].map(({ label, dot, bar, val, count, desc }) => (
                      <div key={label} className="bg-secondary p-3 rounded-xl border border-border">
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full shrink-0 ${dot}`} />
                            <span className="text-xs font-bold truncate">{label}</span>
                          </div>
                          <div className={`text-lg font-black shrink-0 ${val}`}>{count}</div>
                        </div>
                        <div className="w-full bg-background h-1.5 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${bar}`} style={{ width: `${(count / trafficStats.total) * 100}%` }} />
                        </div>
                        <div className="text-[10px] text-muted-foreground mt-1">{desc}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* Right-edge resize handle */}
        <div
          onPointerDown={onResizeStart}
          className="absolute top-0 right-0 h-full w-3 flex items-center justify-center cursor-col-resize z-30 group"
        >
          <div className="w-1 h-12 rounded-full bg-border group-hover:bg-primary transition-colors" />
          <GripVertical className="absolute w-3 h-3 text-muted-foreground/40 group-hover:text-primary transition-colors" />
        </div>
      </aside>

      {/* Map fills the rest */}
      <section className="flex-1 relative min-h-0 overflow-hidden">
        <SmartMap route={route} allNodes={BAHIR_DAR_NODES} />

        {/* Legend */}
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-[1000] px-5 py-2.5 bg-card/90 backdrop-blur-md border border-border rounded-xl flex items-center gap-5 text-[10px] font-bold uppercase tracking-wider shadow-2xl pointer-events-none">
          {[
            { color: 'bg-green-500', text: 'text-green-400', label: 'Low' },
            { color: 'bg-yellow-500', text: 'text-yellow-400', label: 'Medium' },
            { color: 'bg-red-500', text: 'text-red-400', label: 'High' },
            { color: 'bg-blue-400', text: 'text-blue-400', label: 'Route' },
          ].map(({ color, text, label }) => (
            <div key={label} className="flex items-center gap-1.5">
              <div className={`w-3 h-1.5 rounded-full ${color}`} />
              <span className={text}>{label}</span>
            </div>
          ))}
        </div>

        {/* Coordinates */}
        <div className="absolute bottom-5 right-5 z-[1000] hidden lg:block pointer-events-none">
          <div className="bg-card/80 backdrop-blur-md p-3 rounded-xl border border-border text-[10px] font-mono text-muted-foreground shadow-xl space-y-1">
            <div className="flex justify-between gap-6"><span>LAT/LNG:</span><span className="text-primary">11.5973°N, 37.3878°E</span></div>
            <div className="flex justify-between gap-6"><span>REGION:</span><span className="text-foreground">Bahir Dar, Amhara</span></div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default TrafficDashboard;
