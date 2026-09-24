import { AlertOctagon, AlertTriangle, AlertCircle, CheckCircle } from 'lucide-react';
import type { SeverityCounts } from '@/lib/types';

interface Props {
  counts: SeverityCounts;
  onFilter?: (level: string) => void;
}

const config = [
  { key: 'critical', label: 'Critical', color: 'red', icon: AlertOctagon, bg: 'bg-red-500/10', border: 'border-red-500/30', text: 'text-red-400' },
  { key: 'high', label: 'High', color: 'orange', icon: AlertTriangle, bg: 'bg-orange-500/10', border: 'border-orange-500/30', text: 'text-orange-400' },
  { key: 'medium', label: 'Medium', color: 'amber', icon: AlertCircle, bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-400' },
  { key: 'low', label: 'Low', color: 'emerald', icon: CheckCircle, bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-400' },
];

export default function SeverityCards({ counts, onFilter }: Props) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {config.map(({ key, label, bg, border, text, icon: Icon }) => (
        <button
          key={key}
          onClick={() => onFilter?.(key)}
          className={`${bg} ${border} border rounded-xl p-4 text-left transition-all hover:scale-105 hover:border-opacity-60`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className={`text-3xl font-bold ${text}`}>{counts[key as keyof SeverityCounts] || 0}</span>
            <Icon size={24} className={text} />
          </div>
          <span className="text-sm text-slate-300 font-medium">{label}</span>
        </button>
      ))}
    </div>
  );
}
