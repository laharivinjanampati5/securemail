import { useEffect, useState } from 'react';
import { Search, Filter, Loader2, FileWarning } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import SessionsTable from '@/components/SessionsTable';
import { getSessions } from '@/lib/dataService';
import type { Session } from '@/lib/types';

export default function SessionsPage() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [protocol, setProtocol] = useState('all');
  const [riskLevel, setRiskLevel] = useState('all');
  const [tlsVersion, setTlsVersion] = useState('all');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');

  useEffect(() => {
    load();
  }, [protocol, riskLevel, tlsVersion, search]);

  const load = async () => {
    setLoading(true);
    try {
      const data = await getSessions({
        protocol: protocol !== 'all' ? protocol : undefined,
        riskLevel: riskLevel !== 'all' ? riskLevel.toUpperCase() : undefined,
        tlsVersion: tlsVersion !== 'all' ? tlsVersion : undefined,
        search: search || undefined,
      });
      setSessions(data);
    } catch (err) {
      console.error('Sessions load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 size={32} className="animate-spin text-sky-400" />
      </div>
    );
  }

  if (sessions.length === 0 && !search && protocol === 'all' && riskLevel === 'all' && tlsVersion === 'all') {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-center">
        <FileWarning size={48} className="text-slate-600 mb-4" />
        <h2 className="text-xl font-semibold text-slate-300 mb-2">No Sessions Found</h2>
        <p className="text-slate-500 mb-4">Upload a PCAP file to start analyzing email sessions.</p>
        <button
          onClick={() => navigate('/upload')}
          className="bg-sky-600 hover:bg-sky-500 text-white font-medium rounded-lg px-4 py-2 transition-colors"
        >
          Go to Upload
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-white">Email Sessions</h1>
        <p className="text-slate-400 text-sm mt-1">{sessions.length} sessions reconstructed from PCAP analysis</p>
      </div>

      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-slate-400">
            <Filter size={16} />
            <span className="text-sm font-medium">Filters:</span>
          </div>

          <select
            value={protocol}
            onChange={(e) => setProtocol(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-slate-200 focus:border-sky-500 focus:outline-none"
          >
            <option value="all">All Protocols</option>
            <option value="SMTP">SMTP</option>
            <option value="IMAP">IMAP</option>
            <option value="POP3">POP3</option>
          </select>

          <select
            value={riskLevel}
            onChange={(e) => setRiskLevel(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-slate-200 focus:border-sky-500 focus:outline-none"
          >
            <option value="all">All Risk Levels</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          <select
            value={tlsVersion}
            onChange={(e) => setTlsVersion(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-slate-200 focus:border-sky-500 focus:outline-none"
          >
            <option value="all">All TLS Versions</option>
            <option value="SSLv3">SSLv3</option>
            <option value="TLS 1.0">TLS 1.0</option>
            <option value="TLS 1.1">TLS 1.1</option>
            <option value="TLS 1.2">TLS 1.2</option>
            <option value="TLS 1.3">TLS 1.3</option>
          </select>

          <form onSubmit={handleSearch} className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search by IP address..."
                className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-sm text-slate-200 focus:border-sky-500 focus:outline-none"
              />
            </div>
          </form>
        </div>
      </div>

      <SessionsTable sessions={sessions} />
    </div>
  );
}
