"use client";

import React, { useState } from 'react';
import { Search, Activity, Clock, Server } from 'lucide-react';

export default function TracesExplorer() {
  const [query, setQuery] = useState('');
  const [traces, setTraces] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // This would ideally connect to the fastify backend we just created in alert-ingestion
  // /api/traces
  const searchTraces = async () => {
    setLoading(true);
    
    // Simulating network delay
    setTimeout(() => {
      setTraces([
        { id: '1a2b3c4d5e6f7g8h', service: 'checkout-service', duration: '120ms', status: 'ok', timestamp: '2 mins ago', spans: 24 },
        { id: '9h8g7f6e5d4c3b2a', service: 'auth-service', duration: '45ms', status: 'error', timestamp: '5 mins ago', spans: 8 },
        { id: '4x5y6z7w8v9u0t', service: 'inventory-api', duration: '810ms', status: 'ok', timestamp: '12 mins ago', spans: 122 }
      ]);
      setLoading(false);
    }, 800);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-slate-950 text-slate-200">
      {/* Header */}
      <div className="border-b border-slate-800 p-4 flex items-center justify-between px-6">
        <div className="flex items-center space-x-3">
          <Activity className="w-6 h-6 text-indigo-400" />
          <h1 className="text-xl font-bold">Trace Explorer</h1>
        </div>
      </div>

      {/* Query Bar */}
      <div className="p-4 border-b border-slate-800 bg-slate-900/40 px-6">
        <div className="flex gap-4 max-w-5xl">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input 
              type="text"
              placeholder="Enter Trace ID, Service Name, or duration (e.g. >100ms)"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-md py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-mono"
            />
          </div>
          <button 
            onClick={searchTraces}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-2 rounded-md text-sm font-medium transition-colors shadow-sm shadow-indigo-900/20"
            disabled={loading}
          >
            {loading ? 'Searching...' : 'Run Query'}
          </button>
        </div>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-auto p-6">
        {traces.length === 0 && !loading ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-4">
            <div className="bg-slate-900 p-4 rounded-full">
              <Server className="w-8 h-8 text-slate-600" />
            </div>
            <p className="text-sm">Enter a trace ID or service name to view distributed traces</p>
          </div>
        ) : (
          <div className="max-w-5xl space-y-3">
            <h2 className="text-sm font-medium text-slate-400 mb-4">{traces.length} Traces found</h2>
            {traces.map((trace) => (
              <div key={trace.id} className="bg-slate-900 border border-slate-800 flex items-center justify-between p-4 rounded-lg hover:border-slate-700 cursor-pointer transition-colors group shadow-sm">
                <div className="flex flex-col gap-1.5 w-1/3">
                  <div className="flex items-center space-x-2">
                    <span className={`w-2 h-2 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.5)] ${trace.status === 'error' ? 'bg-red-500 shadow-red-500/40' : 'bg-emerald-500 shadow-emerald-500/40'}`}></span>
                    <span className="font-mono text-sm text-slate-300 group-hover:text-indigo-400 transition-colors">{trace.id}</span>
                  </div>
                  <span className="text-xs font-semibold text-slate-400 ml-4">{trace.service}</span>
                </div>
                
                {/* Timeline Visualization mock */}
                <div className="flex-1 px-8 hidden md:block">
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden relative">
                    <div 
                      className={`h-full absolute left-0 rounded-full ${trace.status === 'error' ? 'bg-red-500/50' : 'bg-indigo-500/50'}`}
                      style={{ 
                        width: trace.duration === '120ms' ? '40%' : trace.duration === '45ms' ? '15%' : '80%',
                        left: trace.duration === '120ms' ? '10%' : '0%'
                      }}
                    ></div>
                  </div>
                  <span className="text-[10px] text-slate-500 mt-1 inline-block">{trace.spans} spans analyzed</span>
                </div>

                <div className="flex items-center space-x-6 (min-width: 200px) justify-end">
                  <div className="flex items-center space-x-1.5 bg-slate-950 px-2.5 py-1 rounded border border-slate-800">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-xs font-mono">{trace.duration}</span>
                  </div>
                  <span className="text-xs text-slate-500 min-w-[80px] text-right">{trace.timestamp}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
