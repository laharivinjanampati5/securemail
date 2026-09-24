import { Link } from 'react-router-dom';
import { ChevronRight, Eye } from 'lucide-react';
import type { Session } from '@/lib/types';

const riskColors: Record<string, string> = {
  CRITICAL: 'bg-red-500/20 text-red-400 border-red-500/30',
  HIGH: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  MEDIUM: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  LOW: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
};

interface Props {
  sessions: Session[];
  showActions?: boolean;
  maxRows?: number;
}

export default function SessionsTable({ sessions, showActions = true, maxRows }: Props) {
  const rows = maxRows ? sessions.slice(0, maxRows) : sessions;

  if (rows.length === 0) {
    return (
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-8 text-center">
        <p className="text-slate-400">No sessions found. Upload a PCAP file to begin analysis.</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-700 text-slate-400 text-xs uppercase tracking-wider">
              <th className="text-left px-4 py-3 font-medium">Source IP</th>
              <th className="text-left px-4 py-3 font-medium">Dest IP</th>
              <th className="text-left px-4 py-3 font-medium">Protocol</th>
              <th className="text-left px-4 py-3 font-medium">TLS Version</th>
              <th className="text-left px-4 py-3 font-medium">Cipher</th>
              <th className="text-left px-4 py-3 font-medium">Risk</th>
              <th className="text-left px-4 py-3 font-medium">Anomaly</th>
              {showActions && <th className="text-right px-4 py-3 font-medium">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {rows.map((s) => (
              <tr key={s.id} className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors">
                <td className="px-4 py-3 text-slate-200 font-mono text-xs">{s.src_ip}:{s.src_port}</td>
                <td className="px-4 py-3 text-slate-200 font-mono text-xs">{s.dst_ip}:{s.dst_port}</td>
                <td className="px-4 py-3">
                  <span className="text-slate-300 font-medium">{s.protocol}</span>
                </td>
                <td className="px-4 py-3 text-slate-300">{s.tls_version}</td>
                <td className="px-4 py-3 text-slate-400 text-xs font-mono max-w-[200px] truncate" title={s.cipher_suite}>
                  {s.cipher_suite}
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-1 rounded border font-medium ${riskColors[s.risk_level] || ''}`}>
                    {s.risk_level}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {s.anomaly_flag ? (
                    <span className="text-xs px-2 py-1 rounded bg-purple-500/20 text-purple-400 border border-purple-500/30 font-medium">
                      Anomalous
                    </span>
                  ) : (
                    <span className="text-xs text-slate-500">Normal</span>
                  )}
                </td>
                {showActions && (
                  <td className="px-4 py-3 text-right">
                    <Link
                      to={`/sessions/${s.id}`}
                      className="inline-flex items-center gap-1 text-sky-400 hover:text-sky-300 text-xs font-medium"
                    >
                      <Eye size={14} /> View
                      <ChevronRight size={14} />
                    </Link>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
