import { Brain, TrendingDown, Zap, Activity } from 'lucide-react';
import type { Session, SessionFeatures } from '@/lib/types';

interface Props {
  session: Session;
}

const featureLabels: { key: keyof SessionFeatures; label: string }[] = [
  { key: 'tls_version_num', label: 'TLS Version' },
  { key: 'cipher_strength_score', label: 'Cipher Strength' },
  { key: 'key_exchange_score', label: 'Key Exchange' },
  { key: 'forward_secrecy', label: 'Forward Secrecy' },
  { key: 'cert_valid', label: 'Cert Valid' },
  { key: 'cert_key_length', label: 'Cert Key Length' },
  { key: 'cert_sig_algo_score', label: 'Signature Algo' },
  { key: 'cert_chain_valid', label: 'Chain Valid' },
  { key: 'starttls_correct', label: 'STARTTLS' },
];

const riskColors: Record<string, string> = {
  CRITICAL: 'text-red-400 bg-red-500/10 border-red-500/30',
  HIGH: 'text-orange-400 bg-orange-500/10 border-orange-500/30',
  MEDIUM: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
  LOW: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
};

function normalizeFeature(key: string, value: number): number {
  if (key === 'tls_version_num') return Math.min((value / 0x0304) * 100, 100);
  if (key === 'cert_key_length') return Math.min((value / 4096) * 100, 100);
  if (key === 'cert_days_to_expiry') return Math.min(Math.max(value / 365, 0) * 100, 100);
  return value * 10;
}

export default function AIAnalysisPanel({ session }: Props) {
  const features = session.features;
  const sortedFeatures = [...featureLabels].sort((a, b) => {
    const aVal = normalizeFeature(a.key, features[a.key]);
    const bVal = normalizeFeature(b.key, features[b.key]);
    return aVal - bVal;
  });

  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 space-y-5">
      <div className="flex items-center gap-2">
        <Brain size={20} className="text-purple-400" />
        <h3 className="text-white font-semibold">AI Analysis</h3>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className={`rounded-lg border p-4 ${riskColors[session.risk_level] || ''}`}>
          <div className="flex items-center gap-2 mb-1">
            <Activity size={16} />
            <span className="text-xs uppercase tracking-wider opacity-80">Risk Classification</span>
          </div>
          <div className="text-2xl font-bold">{session.risk_level}</div>
          <div className="text-xs opacity-70 mt-1">
            RandomForestClassifier · {(session.risk_confidence * 100).toFixed(1)}% confidence
          </div>
        </div>

        <div className={`rounded-lg border p-4 ${session.anomaly_flag ? 'text-purple-400 bg-purple-500/10 border-purple-500/30' : 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'}`}>
          <div className="flex items-center gap-2 mb-1">
            <Zap size={16} />
            <span className="text-xs uppercase tracking-wider opacity-80">Anomaly Detection</span>
          </div>
          <div className="text-2xl font-bold">{session.anomaly_flag ? 'Anomalous' : 'Normal'}</div>
          <div className="text-xs opacity-70 mt-1">
            IsolationForest · score: {session.anomaly_score.toFixed(3)}
          </div>
        </div>
      </div>

      <div>
        <div className="flex items-center gap-1 mb-3">
          <TrendingDown size={14} className="text-slate-500" />
          <span className="text-xs text-slate-400 uppercase tracking-wider">Feature Importance (what drove the prediction)</span>
        </div>
        <div className="space-y-2">
          {sortedFeatures.map(({ key, label }) => {
            const rawVal = features[key];
            const normalized = normalizeFeature(key, rawVal);
            const barColor = normalized < 30 ? 'bg-red-500' : normalized < 50 ? 'bg-orange-500' : normalized < 70 ? 'bg-amber-500' : 'bg-emerald-500';
            return (
              <div key={key} className="flex items-center gap-3">
                <span className="text-xs text-slate-400 w-32 flex-shrink-0">{label}</span>
                <div className="flex-1 h-5 bg-slate-900/70 rounded overflow-hidden">
                  <div
                    className={`h-full ${barColor} transition-all duration-700`}
                    style={{ width: `${normalized}%` }}
                  />
                </div>
                <span className="text-xs text-slate-300 font-mono w-12 text-right">
                  {typeof rawVal === 'number' && rawVal % 1 !== 0 ? rawVal.toFixed(1) : rawVal}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700/50">
        <span className="text-xs text-slate-400 uppercase tracking-wider">Posture Score</span>
        <div className="flex items-center gap-2 mt-1">
          <div className="text-2xl font-bold text-white">{session.posture_score}</div>
          <span className="text-sm text-slate-500">/ 100</span>
        </div>
      </div>
    </div>
  );
}
