import { ArrowRight, ArrowLeft } from 'lucide-react';
import type { TcpTimelineEvent } from '@/lib/types';

interface Props {
  events: TcpTimelineEvent[];
}

const phaseStyles: Record<string, { bg: string; border: string; label: string }> = {
  plaintext: { bg: 'bg-slate-700/40', border: 'border-slate-600', label: 'text-slate-400' },
  starttls: { bg: 'bg-amber-500/10', border: 'border-amber-500/30', label: 'text-amber-400' },
  tls: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', label: 'text-emerald-400' },
};

function formatTime(iso: string): string {
  const d = new Date(iso);
  const ms = String(d.getMilliseconds()).padStart(3, '0');
  return `${d.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}.${ms}`;
}

export default function TcpTimeline({ events }: Props) {
  if (!events || events.length === 0) {
    return (
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
        <h3 className="text-white font-semibold mb-2">TCP Stream Timeline</h3>
        <p className="text-slate-400 text-sm">No TCP stream data available.</p>
      </div>
    );
  }

  const phases = events.reduce((acc, e) => {
    if (!acc.includes(e.phase)) acc.push(e.phase);
    return acc;
  }, [] as string[]);

  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
      <h3 className="text-white font-semibold mb-4">TCP Stream Timeline</h3>

      <div className="flex items-center gap-2 mb-4 text-xs">
        {phases.map((phase) => (
          <div key={phase} className="flex items-center gap-1">
            <div className={`w-3 h-3 rounded ${phaseStyles[phase]?.bg.replace('/40', '').replace('/10', '')}`} />
            <span className={phaseStyles[phase]?.label}>{phase}</span>
          </div>
        ))}
      </div>

      <div className="relative">
        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-slate-700" />
        <div className="space-y-2">
          {events.map((e, i) => {
            const isClient = e.direction === 'client';
            const style = phaseStyles[e.phase] || phaseStyles.plaintext;
            return (
              <div key={i} className="relative flex items-center gap-4">
                <div className={`flex-1 ${isClient ? 'text-right' : ''}`}>
                  {isClient && (
                    <div className={`inline-block ${style.bg} ${style.border} border rounded-lg px-3 py-2 max-w-[80%]`}>
                      <div className="flex items-center gap-2 justify-end">
                        <span className="text-xs text-slate-300 font-medium">{e.event}</span>
                        <ArrowRight size={12} className="text-slate-500" />
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{e.detail}</p>
                    </div>
                  )}
                </div>

                <div className="relative z-10 flex flex-col items-center">
                  <div className={`w-3 h-3 rounded-full ${style.bg.replace('/40', '/80').replace('/10', '/80')} border-2 border-slate-800`} />
                  <span className="text-[10px] text-slate-600 mt-1 font-mono">{formatTime(e.timestamp)}</span>
                </div>

                <div className="flex-1">
                  {!isClient && (
                    <div className={`inline-block ${style.bg} ${style.border} border rounded-lg px-3 py-2 max-w-[80%]`}>
                      <div className="flex items-center gap-2">
                        <ArrowLeft size={12} className="text-slate-500" />
                        <span className="text-xs text-slate-300 font-medium">{e.event}</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{e.detail}</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
