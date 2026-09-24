import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, LineChart, Line, CartesianGrid, Legend } from 'recharts';
import { Activity, Zap, Server, TrendingUp, FileWarning, Loader2 } from 'lucide-react';
import PostureScoreGauge, { PostureMiniCard } from '@/components/PostureScoreGauge';
import SeverityCards from '@/components/SeverityCards';
import PriorityFixes from '@/components/PriorityFixes';
import SessionsTable from '@/components/SessionsTable';
import { getDashboardStats, getSessions, getRecommendations } from '@/lib/dataService';
import type { DashboardStats, Session } from '@/lib/types';

const PIE_COLORS = ['#0ea5e9', '#8b5cf6', '#f59e0b'];
const TLS_COLORS: Record<string, string> = {
  'SSLv3': '#ef4444',
  'TLS 1.0': '#f97316',
  'TLS 1.1': '#f59e0b',
  'TLS 1.2': '#0ea5e9',
  'TLS 1.3': '#10b981',
  'Unknown': '#64748b',
};

export default function DashboardPage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterLevel, setFilterLevel] = useState<string | null>(null);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      const [s, sess, recs] = await Promise.all([
        getDashboardStats(),
        getSessions({}),
        getRecommendations(),
      ]);
      setStats(s);
      setSessions(sess);
      setRecommendations(recs);
    } catch (err) {
      console.error('Dashboard load error:', err);
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

  if (!stats || stats.total_sessions === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-center">
        <FileWarning size={48} className="text-slate-600 mb-4" />
        <h2 className="text-xl font-semibold text-slate-300 mb-2">No Analysis Data</h2>
        <p className="text-slate-500 mb-4">Upload a PCAP file to start analyzing email security posture.</p>
        <button
          onClick={() => navigate('/upload')}
          className="bg-sky-600 hover:bg-sky-500 text-white font-medium rounded-lg px-4 py-2 transition-colors"
        >
          Go to Upload
        </button>
      </div>
    );
  }

  const protocolData = Object.entries(stats.protocol_breakdown).map(([name, value]) => ({ name, value }));
  const tlsData = Object.entries(stats.tls_version_distribution).map(([name, value]) => ({ name, value }));
  const trendData = stats.trend.map((t) => ({
    name: t.filename.length > 20 ? t.filename.slice(0, 20) + '...' : t.filename,
    score: t.posture_score,
  }));

  const filteredSessions = filterLevel
    ? sessions.filter((s) => s.risk_level.toLowerCase() === filterLevel)
    : sessions;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Security Posture Dashboard</h1>
          <p className="text-slate-400 text-sm mt-1">
            {stats.total_sessions} sessions analyzed across {stats.total_jobs} PCAP files
          </p>
        </div>
        <div className="flex gap-3">
          <PostureMiniCard score={stats.total_sessions} label="Sessions" icon={Activity} />
          <PostureMiniCard score={stats.anomaly_count} label="Anomalies" icon={Zap} />
          <PostureMiniCard score={stats.total_jobs} label="PCAP Jobs" icon={Server} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 flex flex-col items-center justify-center">
          <PostureScoreGauge score={stats.posture_score} />
          <p className="text-xs text-slate-500 mt-2">Overall Posture Score</p>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <SeverityCards
            counts={stats.severity_counts}
            onFilter={(level) => setFilterLevel(filterLevel === level ? null : level)}
          />
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-slate-300 mb-3">Protocol Breakdown</h3>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={protocolData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={55} innerRadius={30}>
                    {protocolData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#f1f5f9' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-slate-300 mb-3">TLS Version Distribution</h3>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={tlsData} layout="vertical" margin={{ left: 10, right: 10 }}>
                  <XAxis type="number" tick={{ fill: '#64748b', fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} width={60} />
                  <Tooltip
                    contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#f1f5f9' }}
                  />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {tlsData.map((entry, i) => (
                      <Cell key={i} fill={TLS_COLORS[entry.name] || '#64748b'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {trendData.length > 1 && (
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={18} className="text-sky-400" />
            <h3 className="text-white font-semibold">Posture Score Trend</h3>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} />
              <YAxis domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 11 }} />
              <Tooltip
                contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#f1f5f9' }}
              />
              <Line type="monotone" dataKey="score" stroke="#0ea5e9" strokeWidth={2} dot={{ fill: '#0ea5e9', r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PriorityFixes recommendations={recommendations} onSelect={(id) => navigate(`/sessions/${id}`)} />
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-white font-semibold">
              Riskiest Sessions
              {filterLevel && <span className="text-xs text-sky-400 ml-2">filtered: {filterLevel}</span>}
            </h3>
            <button onClick={() => navigate('/sessions')} className="text-xs text-sky-400 hover:text-sky-300">
              View all →
            </button>
          </div>
          <SessionsTable sessions={filteredSessions} maxRows={10} />
        </div>
      </div>
    </div>
  );
}
