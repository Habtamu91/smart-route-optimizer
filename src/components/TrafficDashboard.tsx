import React, { useState } from 'react';
import { MapPin, Navigation, Clock, Activity, Info, Eye, LayoutDashboard, Zap } from 'lucide-react';
import { BAHIR_DAR_NODES, BAHIR_DAR_EDGES } from '../data/bahirdar-graph';
import { dijkstra } from '../lib/dijkstra';
import { RouteResult } from '../types/index';
import SmartMap from './SmartMap';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

const TrafficDashboard: React.FC = () => {
  const [start, setStart] = useState<string>('');
  const [destination, setDestination] = useState<string>('');
  const [route, setRoute] = useState<RouteResult | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [activeTab, setActiveTab] = useState<'routing' | 'vision'>('routing');

  const handleCalculateRoute = () => {
    if (!start || !destination) {
      toast.error('Please select both origin and destination');
      return;
    }
    if (start === destination) {
      toast.error('Origin and destination cannot be the same');
      return;
    }

    setIsCalculating(true);
    setTimeout(() => {
      const result = dijkstra(BAHIR_DAR_NODES, BAHIR_DAR_EDGES, start, destination);
      if (result) {
        setRoute(result);
        toast.success('Optimized route calculated!');
      } else {
        toast.error('No route found between these locations');
        setRoute(null);
      }
      setIsCalculating(false);
    }, 600);
  };

  return (
    <div className="flex flex-col h-screen bg-background text-foreground overflow-hidden">
      {/* Header */}
      <header className="px-6 py-3.5 bg-card/80 backdrop-blur-xl border-b border-border flex items-center justify-between z-30">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary rounded-xl">
            <Navigation className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight">Smart Traffic BD</h1>
            <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-widest">Bahir Dar • Real-time Intelligence</p>
          </div>
        </div>

        <nav className="hidden md:flex items-center gap-1 bg-secondary/50 p-1 rounded-xl border border-border">
          <button
            onClick={() => setActiveTab('routing')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 ${
              activeTab === 'routing' ? 'bg-primary text-primary-foreground shadow-lg' : 'text-muted-foreground hover:bg-accent'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            Navigation
          </button>
          <button
            onClick={() => setActiveTab('vision')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 ${
              activeTab === 'vision' ? 'bg-primary text-primary-foreground shadow-lg' : 'text-muted-foreground hover:bg-accent'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            Analytics
          </button>
        </nav>

        <div className="hidden md:flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-muted-foreground text-xs font-medium">System Online</span>
        </div>
      </header>

      <main className="flex-1 flex flex-col md:flex-row overflow-hidden relative min-h-0">
        {/* Sidebar */}
        <aside className="w-full md:w-[380px] bg-card border-r border-border flex flex-col overflow-y-auto z-20">
          {activeTab === 'routing' ? (
            <div className="p-5 space-y-6">
              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-bold flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-primary" />
                    Route Finder
                  </h2>
                  <span className="text-[9px] bg-primary/10 text-primary px-2 py-1 rounded-md border border-primary/20 font-bold">AI POWERED</span>
                </div>

                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Origin</label>
                    <select
                      value={start}
                      onChange={(e) => setStart(e.target.value)}
                      className="w-full bg-secondary border border-border rounded-xl p-3 text-sm focus:ring-2 focus:ring-primary focus:outline-none transition-all"
                    >
                      <option value="">Select origin...</option>
                      {BAHIR_DAR_NODES.map(node => (
                        <option key={node.id} value={node.id}>{node.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Destination</label>
                    <select
                      value={destination}
                      onChange={(e) => setDestination(e.target.value)}
                      className="w-full bg-secondary border border-border rounded-xl p-3 text-sm focus:ring-2 focus:ring-primary focus:outline-none transition-all"
                    >
                      <option value="">Select destination...</option>
                      {BAHIR_DAR_NODES.map(node => (
                        <option key={node.id} value={node.id}>{node.name}</option>
                      ))}
                    </select>
                  </div>

                  <button
                    onClick={handleCalculateRoute}
                    disabled={isCalculating}
                    className="w-full bg-primary hover:bg-primary/90 active:scale-[0.98] disabled:opacity-50 text-primary-foreground font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-primary/20"
                  >
                    {isCalculating ? (
                      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
                        <Activity className="w-4 h-4" />
                      </motion.div>
                    ) : (
                      <Zap className="w-4 h-4" />
                    )}
                    {isCalculating ? 'Optimizing...' : 'Optimize Travel Route'}
                  </button>
                </div>
              </section>

              <AnimatePresence mode="wait">
                {route ? (
                  <motion.section
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="space-y-4"
                  >
                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-2">
                      <div className="bg-secondary p-3 rounded-xl border border-border text-center">
                        <Navigation className="w-3 h-3 text-primary mx-auto mb-1" />
                        <div className="text-sm font-black">{(route.totalDistance / 1000).toFixed(1)}</div>
                        <div className="text-[9px] text-muted-foreground font-bold">KM</div>
                      </div>
                      <div className="bg-secondary p-3 rounded-xl border border-border text-center">
                        <Clock className="w-3 h-3 text-yellow-500 mx-auto mb-1" />
                        <div className="text-sm font-black">{route.totalTime}</div>
                        <div className="text-[9px] text-muted-foreground font-bold">MIN</div>
                      </div>
                      <div className="bg-secondary p-3 rounded-xl border border-border text-center">
                        <Activity className="w-3 h-3 mx-auto mb-1" style={{
                          color: route.trafficStatus === 'light' ? '#22c55e' : route.trafficStatus === 'moderate' ? '#eab308' : '#ef4444'
                        }} />
                        <div className="text-sm font-black capitalize">{route.trafficStatus}</div>
                        <div className="text-[9px] text-muted-foreground font-bold">FLOW</div>
                      </div>
                    </div>

                    {/* Traffic bar */}
                    <div className="bg-secondary p-3 rounded-xl border border-border">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase">Congestion Level</span>
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                          route.trafficStatus === 'light' ? 'bg-green-500/15 text-green-400' :
                          route.trafficStatus === 'moderate' ? 'bg-yellow-500/15 text-yellow-400' :
                          'bg-red-500/15 text-red-400'
                        }`}>
                          {route.trafficStatus}
                        </span>
                      </div>
                      <div className="w-full bg-background h-1.5 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: route.trafficStatus === 'light' ? '25%' : route.trafficStatus === 'moderate' ? '60%' : '90%' }}
                          className={`h-full rounded-full ${
                            route.trafficStatus === 'light' ? 'bg-green-500' :
                            route.trafficStatus === 'moderate' ? 'bg-yellow-500' :
                            'bg-red-500'
                          }`}
                        />
                      </div>
                    </div>

                    {/* Itinerary */}
                    <div className="space-y-2">
                      <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Route Steps</h4>
                      <div className="space-y-0 relative ml-1.5">
                        <div className="absolute left-[4px] top-2 bottom-2 w-[1px] bg-border" />
                        {route.path.map((node, idx) => (
                          <div key={node.id} className="flex gap-3 items-start pb-4 last:pb-0 relative">
                            <div className={`w-2.5 h-2.5 rounded-full mt-1.5 z-10 ${
                              idx === 0 ? 'bg-primary ring-2 ring-primary/30' :
                              idx === route.path.length - 1 ? 'bg-destructive ring-2 ring-destructive/30' :
                              'bg-muted-foreground/40'
                            }`} />
                            <div>
                              <p className="text-sm font-semibold">{node.name}</p>
                              <p className="text-[10px] text-muted-foreground">
                                {idx === 0 ? 'Start' : idx === route.path.length - 1 ? 'End' : `Stop ${idx}`}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.section>
                ) : (
                  <div className="flex flex-col items-center justify-center py-10 text-center space-y-3">
                    <div className="p-5 bg-secondary/50 rounded-full">
                      <Navigation className="w-10 h-10 text-muted-foreground/30" />
                    </div>
                    <p className="text-xs text-muted-foreground">Select origin & destination to optimize your route</p>
                  </div>
                )}
              </AnimatePresence>

              {/* Info box */}
              <div className="p-3.5 bg-primary/5 border border-primary/15 rounded-xl">
                <div className="flex items-center gap-2 mb-1.5 text-primary">
                  <Info className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-black uppercase tracking-widest">How it works</span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  AI avoids congested roads and finds the fastest path using real-time traffic data. Hover roads on the map to see traffic levels.
                </p>
              </div>
            </div>
          ) : (
            <div className="p-5 space-y-5">
              <h2 className="text-base font-bold flex items-center gap-2">
                <Eye className="w-4 h-4 text-primary" />
                Traffic Analytics
              </h2>
              <p className="text-xs text-muted-foreground">Live traffic monitoring across Bahir Dar road network.</p>

              <div className="space-y-3">
                <div className="bg-secondary p-4 rounded-xl border border-border">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    <span className="text-xs font-bold">Low Traffic Roads</span>
                  </div>
                  <div className="text-2xl font-black text-green-400">5</div>
                  <div className="text-[10px] text-muted-foreground">segments flowing freely</div>
                </div>
                <div className="bg-secondary p-4 rounded-xl border border-border">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-2 h-2 rounded-full bg-yellow-500" />
                    <span className="text-xs font-bold">Medium Traffic Roads</span>
                  </div>
                  <div className="text-2xl font-black text-yellow-400">7</div>
                  <div className="text-[10px] text-muted-foreground">segments with moderate load</div>
                </div>
                <div className="bg-secondary p-4 rounded-xl border border-border">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-2 h-2 rounded-full bg-red-500" />
                    <span className="text-xs font-bold">High Traffic Roads</span>
                  </div>
                  <div className="text-2xl font-black text-red-400">5</div>
                  <div className="text-[10px] text-muted-foreground">segments congested</div>
                </div>
              </div>
            </div>
          )}
        </aside>

        {/* Map */}
        <section className="flex-1 relative min-h-0 overflow-hidden">
          <SmartMap route={route} allNodes={BAHIR_DAR_NODES} />

          {/* Map legend */}
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-[1000] px-5 py-2.5 bg-card/90 backdrop-blur-md border border-border rounded-xl flex items-center gap-5 text-[10px] font-bold uppercase tracking-wider shadow-2xl">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-1.5 rounded-full bg-green-500" />
              <span className="text-green-400">Low</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-1.5 rounded-full bg-yellow-500" />
              <span className="text-yellow-400">Medium</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-1.5 rounded-full bg-red-500" />
              <span className="text-red-400">High</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-1.5 rounded-full bg-blue-400" style={{ backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 2px, #1e293b 2px, #1e293b 4px)' }} />
              <span className="text-blue-400">Route</span>
            </div>
          </div>

          {/* Coordinates */}
          <div className="absolute top-5 right-5 z-[1000] hidden lg:block">
            <div className="bg-card/80 backdrop-blur-md p-3 rounded-xl border border-border text-[10px] font-mono text-muted-foreground shadow-xl space-y-1">
              <div className="flex justify-between gap-6">
                <span>LAT/LNG:</span>
                <span className="text-primary">11.5973°N, 37.3878°E</span>
              </div>
              <div className="flex justify-between gap-6">
                <span>REGION:</span>
                <span className="text-foreground">Bahir Dar, Amhara</span>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default TrafficDashboard;
