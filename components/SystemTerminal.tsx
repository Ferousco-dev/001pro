import React, { useEffect, useRef } from 'react';
import { SystemLog } from '../types';

interface SystemTerminalProps {
  logs: SystemLog[];
}

const SystemTerminal: React.FC<SystemTerminalProps> = ({ logs }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="bg-slate-950 border border-slate-900 rounded-[32px] overflow-hidden shadow-2xl font-mono text-[10px]">
      <div className="bg-slate-900/50 px-6 py-3 border-b border-slate-900 flex items-center justify-between">
        <div className="flex gap-1.5">
          <div className="w-2 h-2 rounded-full bg-red-500/50" />
          <div className="w-2 h-2 rounded-full bg-yellow-500/50" />
          <div className="w-2 h-2 rounded-full bg-green-500/50" />
        </div>
        <div className="text-slate-600 font-bold tracking-widest uppercase text-[8px]">Protocol Terminal v4.2</div>
      </div>
      <div 
        ref={scrollRef}
        className="h-48 overflow-y-auto p-6 space-y-1.5 custom-scrollbar bg-[radial-gradient(circle_at_50%_50%,rgba(30,58,138,0.05),transparent)]"
      >
        {logs.map(log => (
          <div key={log.id} className="flex gap-4 group">
            <span className="text-slate-700 shrink-0">[{log.timestamp.toLocaleTimeString()}]</span>
            <span className={`shrink-0 font-bold ${log.type === 'SECURITY' ? 'text-red-500' : log.type === 'TRANSMISSION' ? 'text-blue-500' : 'text-slate-500'}`}>
              {log.type}
            </span>
            <span className="text-slate-400 group-hover:text-slate-200 transition-colors">{log.event}</span>
          </div>
        ))}
        {logs.length === 0 && <div className="text-slate-800 italic animate-pulse">Awaiting network handshake...</div>}
      </div>
    </div>
  );
};

export default SystemTerminal;