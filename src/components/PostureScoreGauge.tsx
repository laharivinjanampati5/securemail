import { useEffect, useState } from 'react';
import { ShieldCheck, ShieldAlert, Activity, Mail } from 'lucide-react';

interface Props {
  score: number;
  size?: number;
}

export default function PostureScoreGauge({ score, size = 200 }: Props) {
  const [animatedScore, setAnimatedScore] = useState(0);
  const radius = (size - 20) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (animatedScore / 100) * circumference;

  useEffect(() => {
    const duration = 1000;
    const start = Date.now();
    const startVal = animatedScore;
    const interval = setInterval(() => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimatedScore(Math.round(startVal + (score - startVal) * eased));
      if (progress >= 1) clearInterval(interval);
    }, 16);
    return () => clearInterval(interval);
  }, [score]);

  const color = score >= 80 ? '#10b981' : score >= 60 ? '#f59e0b' : score >= 40 ? '#f97316' : '#ef4444';
  const label = score >= 80 ? 'Secure' : score >= 60 ? 'Moderate' : score >= 40 ? 'At Risk' : 'Critical';
  const Icon = score >= 70 ? ShieldCheck : ShieldAlert;

  return (
    <div className="flex flex-col items-center justify-center" style={{ width: size, height: size }}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#1e293b"
            strokeWidth="12"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 0.3s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <Icon size={32} style={{ color }} />
          <span className="text-4xl font-bold mt-1" style={{ color }}>
            {animatedScore}
          </span>
          <span className="text-xs text-slate-400 uppercase tracking-wider mt-1">/ 100</span>
        </div>
      </div>
      <span className="text-sm font-semibold mt-2" style={{ color }}>
        {label}
      </span>
    </div>
  );
}

export function PostureMiniCard({ score, label, icon: Icon }: { score: number; label: string; icon: typeof Activity }) {
  const color = score >= 80 ? 'text-emerald-400' : score >= 60 ? 'text-amber-400' : score >= 40 ? 'text-orange-400' : 'text-red-400';
  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 flex items-center gap-3">
      <div className={`p-2 rounded-lg bg-slate-700/50 ${color}`}>
        <Icon size={20} />
      </div>
      <div>
        <div className="text-2xl font-bold text-white">{score}</div>
        <div className="text-xs text-slate-400">{label}</div>
      </div>
    </div>
  );
}

export function ProtocolIcon({ protocol }: { protocol: string }) {
  const Icon = protocol === 'SMTP' ? Mail : protocol === 'IMAP' ? Activity : Mail;
  return <Icon size={14} />;
}
