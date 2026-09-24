import { useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { UploadCloud, FileUp, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { createAnalysisJob, updateJobProgress, generateAndInsertSessions, completeAnalysisJob, seedSampleData } from '@/lib/dataService';
import type { SampleScenario } from '@/lib/analyzer';

const sampleFiles = [
  { filename: 'gov_mail_smtp_2026.pcap', label: 'Gov SMTP Server (Weak TLS)', scenario: 'bad' as SampleScenario, size: '2.4 MB', packets: 12847 },
  { filename: 'defense_imap_tls13.pcap', label: 'Defense IMAP (TLS 1.3, Secure)', scenario: 'good' as SampleScenario, size: '1.8 MB', packets: 9234 },
  { filename: 'embassy_pop3_mixed.pcap', label: 'Embassy POP3 (Mixed Config)', scenario: 'mixed' as SampleScenario, size: '3.1 MB', packets: 18562 },
];

const stages = [
  { label: 'Parsing PCAP...', progress: 15 },
  { label: 'Reconstructing TCP streams...', progress: 30 },
  { label: 'Detecting STARTTLS upgrades...', progress: 45 },
  { label: 'Parsing TLS handshakes...', progress: 60 },
  { label: 'Extracting X.509 certificates...', progress: 72 },
  { label: 'Running crypto weakness rules...', progress: 82 },
  { label: 'Running AI risk model...', progress: 90 },
  { label: 'Generating report...', progress: 96 },
];

export default function UploadPage() {
  const navigate = useNavigate();
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<{ name: string; size: string } | null>(null);
  const [scenario, setScenario] = useState<SampleScenario>('mixed');
  const [sessionCount, setSessionCount] = useState(10);
  const [analyzing, setAnalyzing] = useState(false);
  const [stageIdx, setStageIdx] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [seeding, setSeeding] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      setSelectedFile({ name: file.name, size: `${(file.size / 1024 / 1024).toFixed(2)} MB` });
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile({ name: file.name, size: `${(file.size / 1024 / 1024).toFixed(2)} MB` });
    }
  };

  const handleSampleSelect = (s: typeof sampleFiles[0]) => {
    setSelectedFile({ name: s.filename, size: s.size });
    setScenario(s.scenario);
  };

  const runAnalysis = async (filename: string, sc: SampleScenario, count: number) => {
    setAnalyzing(true);
    setError(null);
    setStageIdx(0);

    try {
      const jobId = await createAnalysisJob({ filename, scenario: sc, sessionCount: count });

      for (let i = 0; i < stages.length; i++) {
        setStageIdx(i);
        await updateJobProgress(jobId, stages[i].progress);
        await new Promise((r) => setTimeout(r, 300 + Math.random() * 200));
      }

      await generateAndInsertSessions(jobId, sc, count);

      await completeAnalysisJob(jobId);

      setStageIdx(stages.length);
      await new Promise((r) => setTimeout(r, 400));

      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed');
      setAnalyzing(false);
    }
  };

  const handleAnalyze = () => {
    if (!selectedFile) return;
    runAnalysis(selectedFile.name, scenario, sessionCount);
  };

  const handleSeedSampleData = async () => {
    setSeeding(true);
    setError(null);
    try {
      await seedSampleData();
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load sample data');
      setSeeding(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-1">Upload PCAP File</h1>
        <p className="text-slate-400 text-sm">Upload a packet capture file containing SMTP, IMAP, or POP3 traffic for forensic analysis.</p>
      </div>

      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all ${
          dragOver ? 'border-sky-500 bg-sky-500/5' : 'border-slate-700 hover:border-slate-600'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pcap,.pcapng,.cap"
          onChange={handleFileSelect}
          className="hidden"
        />
        <UploadCloud size={48} className="mx-auto text-slate-600 mb-3" />
        <p className="text-slate-300 font-medium mb-1">Drag and drop a PCAP file here</p>
        <p className="text-xs text-slate-500">or click to browse · supports .pcap, .pcapng, .cap</p>
        {selectedFile && (
          <div className="mt-4 inline-flex items-center gap-2 bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2">
            <FileUp size={16} className="text-sky-400" />
            <span className="text-sm text-slate-200">{selectedFile.name}</span>
            <span className="text-xs text-slate-500">({selectedFile.size})</span>
          </div>
        )}
      </div>

      <div className="mt-6">
        <h3 className="text-sm font-semibold text-slate-300 mb-3">Or try a sample PCAP:</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {sampleFiles.map((s) => (
            <button
              key={s.filename}
              onClick={() => handleSampleSelect(s)}
              className={`text-left p-3 rounded-lg border transition-all ${
                selectedFile?.name === s.filename
                  ? 'bg-sky-500/10 border-sky-500/30'
                  : 'bg-slate-800/50 border-slate-700 hover:border-slate-600'
              }`}
            >
              <div className="text-sm text-slate-200 font-medium">{s.label}</div>
              <div className="text-xs text-slate-500 mt-1">{s.size} · {s.packets.toLocaleString()} packets</div>
            </button>
          ))}
        </div>
      </div>

      {!analyzing && (
        <div className="mt-6 flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-slate-400 uppercase tracking-wider mb-2 block">Analysis Profile</label>
              <select
                value={scenario}
                onChange={(e) => setScenario(e.target.value as SampleScenario)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:border-sky-500 focus:outline-none"
              >
                <option value="good">Secure (TLS 1.3, strong ciphers)</option>
                <option value="bad">Vulnerable (weak TLS, expired certs)</option>
                <option value="anomalous">Anomalous (unusual patterns)</option>
                <option value="mixed">Mixed (realistic variety)</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-400 uppercase tracking-wider mb-2 block">Sessions to Analyze</label>
              <input
                type="range"
                min="5"
                max="30"
                value={sessionCount}
                onChange={(e) => setSessionCount(Number(e.target.value))}
                className="w-full mt-3 accent-sky-500"
              />
              <span className="text-sm text-slate-300">{sessionCount} sessions</span>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={handleAnalyze}
              disabled={!selectedFile}
              className="flex-1 flex items-center justify-center gap-2 bg-sky-600 hover:bg-sky-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-medium rounded-lg px-4 py-3 transition-colors"
            >
              <FileUp size={18} />
              Analyze PCAP
            </button>
            <button
              onClick={handleSeedSampleData}
              disabled={seeding}
              className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-medium rounded-lg px-4 py-3 transition-colors"
            >
              {seeding ? <Loader2 size={18} className="animate-spin" /> : <UploadCloud size={18} />}
              Load All Samples
            </button>
          </div>
        </div>
      )}

      {analyzing && (
        <div className="mt-6 bg-slate-800/50 border border-slate-700 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            {stageIdx < stages.length ? (
              <Loader2 size={20} className="animate-spin text-sky-400" />
            ) : (
              <CheckCircle size={20} className="text-emerald-400" />
            )}
            <span className="text-slate-200 font-medium">
              {stageIdx < stages.length ? stages[stageIdx].label : 'Analysis complete!'}
            </span>
          </div>
          <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-sky-500 to-emerald-500 transition-all duration-500"
              style={{ width: `${stageIdx < stages.length ? stages[stageIdx].progress : 100}%` }}
            />
          </div>
          <div className="mt-2 flex justify-between text-xs text-slate-500">
            <span>Stage {Math.min(stageIdx + 1, stages.length)} of {stages.length}</span>
            <span>{stageIdx < stages.length ? `${stages[stageIdx].progress}%` : '100%'}</span>
          </div>
        </div>
      )}
    </div>
  );
}
