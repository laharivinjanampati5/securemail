import { Flame, ArrowRight } from 'lucide-react';
import type { Recommendation } from '@/lib/types';

interface Props {
  recommendations: {
    session_id: string;
    severity: string;
    title: string;
    description: string;
    recommendation: string;
    protocol: string;
    src_ip: string;
    dst_ip: string;
  }[];
  onSelect?: (sessionId: string) => void;
}

const severityColors: Record<string, string> = {
  CRITICAL: 'bg-red-500/20 text-red-400 border-red-500/30',
  HIGH: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  MEDIUM: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  LOW: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
};

export default function PriorityFixes({ recommendations, onSelect }: Props) {
  const top = recommendations.slice(0, 5);

  if (top.length === 0) {
    return (
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Flame size={20} className="text-orange-400" />
          <h3 className="text-white font-semibold">Priority Fixes</h3>
        </div>
        <p className="text-slate-400 text-sm">No issues detected. All systems secure.</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
      <div className="flex items-center gap-2 mb-4">
        <Flame size={20} className="text-orange-400" />
        <h3 className="text-white font-semibold">Fix These First</h3>
      </div>
      <div className="space-y-3">
        {top.map((r, i) => (
          <button
            key={i}
            onClick={() => onSelect?.(r.session_id)}
            className="w-full text-left bg-slate-900/50 border border-slate-700/50 rounded-lg p-3 hover:border-slate-600 transition-all group"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs px-2 py-0.5 rounded border font-medium ${severityColors[r.severity] || ''}`}>
                    {r.severity}
                  </span>
                  <span className="text-xs text-slate-500">{r.protocol} {r.dst_ip}</span>
                </div>
                <p className="text-sm text-slate-200 font-medium">{r.title}</p>
                <p className="text-xs text-slate-400 mt-1">{r.recommendation}</p>
              </div>
              <ArrowRight size={16} className="text-slate-600 group-hover:text-slate-300 transition-colors mt-1" />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

export function RecommendationPanel({ recommendations }: { recommendations: Recommendation[] }) {
  if (recommendations.length === 0) {
    return (
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
        <h3 className="text-white font-semibold mb-2">Recommendations</h3>
        <p className="text-slate-400 text-sm">No recommendations — this session passed all security checks.</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
      <h3 className="text-white font-semibold mb-4">Recommendations</h3>
      <div className="space-y-3">
        {recommendations.map((r, i) => (
          <div key={i} className="bg-slate-900/50 border border-slate-700/50 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold text-slate-500">#{i + 1}</span>
              <span className={`text-xs px-2 py-0.5 rounded border font-medium ${severityColors[r.severity] || ''}`}>
                {r.severity}
              </span>
            </div>
            <p className="text-sm text-slate-200 font-medium">{r.title}</p>
            <p className="text-xs text-slate-400 mt-1">{r.description}</p>
            <p className="text-xs text-emerald-400 mt-2 font-medium">→ {r.recommendation}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
