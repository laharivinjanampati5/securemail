import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Loader2, AlertTriangle, Zap, Code2, ChevronDown, ChevronUp } from 'lucide-react';
import TcpTimeline from '@/components/TcpTimeline';
import TLSHandshakeView from '@/components/TLSHandshakeView';
import CertCard from '@/components/CertCard';
import AIAnalysisPanel from '@/components/AIAnalysisPanel';
import { RecommendationPanel } from '@/components/PriorityFixes';
import { getSessionById } from '@/lib/dataService';
import type { Session } from '@/lib/types';

const riskColors: Record<string, string> = {
  CRITICAL: 'bg-red-500/20 text-red-400 border-red-500/30',
  HIGH: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  MEDIUM: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  LOW: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
};

export default function SessionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [showRawJson, setShowRawJson] = useState(false);

  useEffect(() => {
    if (!id) return;
    load();
  }, [id]);

  const load = async () => {
    setLoading(true);
    try {
      const data = await getSessionById(id!);
      setSession(data);
    } catch (err) {
      console.error('Session load error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 size={32} className="animate-spin text-sky-400" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-center">
        <AlertTriangle size={48} className="text-slate-600 mb-4" />
        <h2 className="text-xl font-semibold text-slate-300 mb-2">Session Not Found</h2>
        <button
          onClick={() => navigate('/sessions')}
          className="text-sky-400 hover:text-sky-300 text-sm"
        >
          ← Back to Sessions
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate('/sessions')}
        className="flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200 transition-colors"
      >
        <ArrowLeft size={16} /> Back to Sessions
      </button>

      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-white font-mono">
              {session.src_ip}:{session.src_port} → {session.dst_ip}:{session.dst_port}
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              {session.protocol} · {session.tls_version} · {session.cipher_suite}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-sm px-3 py-1 rounded-lg border font-medium ${riskColors[session.risk_level] || ''}`}>
              {session.risk_level}
            </span>
            {session.anomaly_flag && (
              <span className="flex items-center gap-1 text-sm px-3 py-1 rounded-lg border font-medium bg-purple-500/20 text-purple-400 border-purple-500/30">
                <Zap size={14} /> Anomalous
              </span>
            )}
          </div>
        </div>
      </div>

      <TcpTimeline events={session.tcp_timeline} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TLSHandshakeView
          clientHello={session.client_hello}
          serverHello={session.server_hello}
          starttls={session.starttls_upgraded}
          forwardSecrecy={session.forward_secrecy}
        />
        <AIAnalysisPanel session={session} />
      </div>

      <CertCard certificates={session.certificates || []} />

      <RecommendationPanel recommendations={session.recommendations || []} />

      <div className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden">
        <button
          onClick={() => setShowRawJson(!showRawJson)}
          className="w-full flex items-center justify-between p-4 hover:bg-slate-700/30 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Code2 size={18} className="text-slate-400" />
            <span className="text-white font-semibold">Raw JSON (Forensic Export)</span>
          </div>
          {showRawJson ? <ChevronUp size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />}
        </button>
        {showRawJson && (
          <div className="border-t border-slate-700">
            <pre className="text-xs text-slate-300 font-mono p-4 overflow-x-auto max-h-96 bg-slate-950/50">
              {JSON.stringify(session, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
