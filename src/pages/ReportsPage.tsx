import { useEffect, useState } from 'react';
import { Download, FileJson, FileText, FileSpreadsheet, Loader2, FileWarning, Eye } from 'lucide-react';
import { getAllJobs, getSessions, getAllCertificates } from '@/lib/dataService';
import type { AnalysisJob, Session, Certificate } from '@/lib/types';

export default function ReportsPage() {
  const [jobs, setJobs] = useState<AnalysisJob[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedJobId, setSelectedJobId] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [protocolFilter, setProtocolFilter] = useState('all');
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      const [j, s, c] = await Promise.all([getAllJobs(), getSessions({}), getAllCertificates()]);
      setJobs(j);
      setSessions(s);
      setCertificates(c);
    } catch (err) {
      console.error('Reports load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredSessions = sessions.filter((s) => {
    if (selectedJobId !== 'all' && s.job_id !== selectedJobId) return false;
    if (severityFilter !== 'all' && s.risk_level.toLowerCase() !== severityFilter) return false;
    if (protocolFilter !== 'all' && s.protocol !== protocolFilter) return false;
    return true;
  });

  const generateHtmlReport = (): string => {
    const totalSessions = filteredSessions.length;
    const counts = { critical: 0, high: 0, medium: 0, low: 0 };
    filteredSessions.forEach((s) => {
      const level = s.risk_level.toLowerCase() as keyof typeof counts;
      if (level in counts) counts[level]++;
    });

    const postureScore = totalSessions > 0
      ? Math.max(0, 100 - Math.round((counts.critical * 25 + counts.high * 10 + counts.medium * 4 + counts.low * 1) / totalSessions))
      : 100;

    const findingsRows = filteredSessions.map((s) => {
      const recs = (s.recommendations || []).map((r) => `<li><strong>[${r.severity}]</strong> ${r.title}: ${r.recommendation}</li>`).join('');
      return `
        <tr>
          <td>${s.src_ip}:${s.src_port}</td>
          <td>${s.dst_ip}:${s.dst_port}</td>
          <td>${s.protocol}</td>
          <td>${s.tls_version}</td>
          <td>${s.cipher_suite}</td>
          <td class="risk-${s.risk_level.toLowerCase()}">${s.risk_level}</td>
          <td>${s.anomaly_flag ? 'Yes' : 'No'}</td>
          <td><ul>${recs}</ul></td>
        </tr>`;
    }).join('');

    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>SecureMailScope Forensic Report</title>
<style>
  body { font-family: 'Segoe UI', Arial, sans-serif; margin: 40px; color: #1e293b; }
  .header { display: flex; align-items: center; gap: 12px; margin-bottom: 30px; border-bottom: 2px solid #0ea5e9; padding-bottom: 20px; }
  .header h1 { margin: 0; color: #0c4a6e; }
  .header .subtitle { color: #64748b; font-size: 14px; }
  .summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 30px; }
  .summary-card { padding: 16px; border-radius: 8px; text-align: center; }
  .summary-card .num { font-size: 28px; font-weight: bold; }
  .summary-card .label { font-size: 12px; color: #64748b; text-transform: uppercase; }
  .critical { background: #fef2f2; border: 1px solid #ef4444; }
  .critical .num { color: #ef4444; }
  .high { background: #fff7ed; border: 1px solid #f97316; }
  .high .num { color: #f97316; }
  .medium { background: #fefce8; border: 1px solid #f59e0b; }
  .medium .num { color: #f59e0b; }
  .low { background: #f0fdf4; border: 1px solid #10b981; }
  .low .num { color: #10b981; }
  .posture { text-align: center; margin-bottom: 30px; }
  .posture .score { font-size: 48px; font-weight: bold; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  th { background: #1e293b; color: white; padding: 8px; text-align: left; }
  td { padding: 8px; border-bottom: 1px solid #e2e8f0; vertical-align: top; }
  .risk-critical { color: #ef4444; font-weight: bold; }
  .risk-high { color: #f97316; font-weight: bold; }
  .risk-medium { color: #f59e0b; font-weight: bold; }
  .risk-low { color: #10b981; font-weight: bold; }
  .section { margin-bottom: 30px; }
  .section h2 { color: #0c4a6e; border-bottom: 1px solid #cbd5e1; padding-bottom: 8px; }
  .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #cbd5e1; font-size: 12px; color: #64748b; }
  ul { margin: 0; padding-left: 16px; }
  li { margin-bottom: 4px; }
</style>
</head>
<body>
<div class="header">
  <div>
    <h1>SecureMailScope Forensic Report</h1>
    <div class="subtitle">Generated: ${new Date().toLocaleString()} · SIH26159 Prototype</div>
  </div>
</div>

<div class="posture">
  <div class="score" style="color: ${postureScore >= 80 ? '#10b981' : postureScore >= 60 ? '#f59e0b' : postureScore >= 40 ? '#f97316' : '#ef4444'}">${postureScore}</div>
  <div style="color: #64748b;">Overall Security Posture Score (0-100)</div>
</div>

<div class="summary-grid">
  <div class="summary-card critical"><div class="num">${counts.critical}</div><div class="label">Critical</div></div>
  <div class="summary-card high"><div class="num">${counts.high}</div><div class="label">High</div></div>
  <div class="summary-card medium"><div class="num">${counts.medium}</div><div class="label">Medium</div></div>
  <div class="summary-card low"><div class="num">${counts.low}</div><div class="label">Low</div></div>
</div>

<div class="section">
  <h2>Executive Summary</h2>
  <p>Analysis of <strong>${totalSessions}</strong> email sessions from PCAP traffic captures. The security posture score of <strong>${postureScore}/100</strong> indicates ${postureScore >= 80 ? 'a strong' : postureScore >= 60 ? 'a moderate' : postureScore >= 40 ? 'a concerning' : 'a critical'} security posture.</p>
  <p>Detected: ${counts.critical} critical, ${counts.high} high, ${counts.medium} medium, and ${counts.low} low severity findings across SMTP, IMAP, and POP3 protocols.</p>
</div>

<div class="section">
  <h2>Methodology</h2>
  <p>This report was generated by SecureMailScope, a passive network forensic tool that:</p>
  <ul>
    <li>Reconstructs TCP streams from PCAP captures</li>
    <li>Detects STARTTLS upgrades and implicit TLS connections</li>
    <li>Parses TLS handshakes and extracts X.509 certificate chains</li>
    <li>Applies cryptographic weakness detection rules (TLS version, cipher strength, PFS, cert validity)</li>
    <li>Uses ML models (RandomForest + IsolationForest) for risk classification and anomaly detection</li>
  </ul>
</div>

<div class="section">
  <h2>Detailed Findings (${totalSessions} sessions)</h2>
  <table>
    <thead>
      <tr>
        <th>Source</th><th>Destination</th><th>Protocol</th><th>TLS</th><th>Cipher</th><th>Risk</th><th>Anomaly</th><th>Recommendations</th>
      </tr>
    </thead>
    <tbody>${findingsRows}</tbody>
  </table>
</div>

<div class="footer">
  <p>SecureMailScope v1.0 — SIH26159 Prototype · NTRO, Ministry of Education's Innovation Cell</p>
  <p>This report is generated from passive analysis of PCAP files. No active network scanning was performed.</p>
</div>
</body>
</html>`;
  };

  const downloadFile = (content: string, filename: string, mime: string) => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportJson = () => {
    const report = {
      metadata: {
        tool: 'SecureMailScope',
        version: '1.0',
        generated_at: new Date().toISOString(),
        sih_problem: 'SIH26159',
      },
      summary: {
        total_sessions: filteredSessions.length,
        total_certificates: certificates.length,
        posture_score: filteredSessions.length > 0
          ? Math.max(0, 100 - Math.round((filteredSessions.filter(s => s.risk_level === 'CRITICAL').length * 25 + filteredSessions.filter(s => s.risk_level === 'HIGH').length * 10 + filteredSessions.filter(s => s.risk_level === 'MEDIUM').length * 4 + filteredSessions.filter(s => s.risk_level === 'LOW').length * 1) / filteredSessions.length))
          : 100,
      },
      sessions: filteredSessions,
      certificates,
    };
    downloadFile(JSON.stringify(report, null, 2), `securemailscope_report_${Date.now()}.json`, 'application/json');
  };

  const handleExportHtml = () => {
    const html = generateHtmlReport();
    downloadFile(html, `securemailscope_report_${Date.now()}.html`, 'text/html');
    setPreviewHtml(html);
  };

  const handleExportPdf = () => {
    const html = generateHtmlReport();
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.print();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 size={32} className="animate-spin text-sky-400" />
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-center">
        <FileWarning size={48} className="text-slate-600 mb-4" />
        <h2 className="text-xl font-semibold text-slate-300 mb-2">No Data for Reports</h2>
        <p className="text-slate-500">Upload and analyze PCAP files first to generate forensic reports.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Forensic Reports</h1>
        <p className="text-slate-400 text-sm mt-1">Export analysis results in JSON, HTML, or PDF format for forensic documentation.</p>
      </div>

      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
        <h3 className="text-white font-semibold mb-4">Report Filters</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="text-xs text-slate-400 uppercase tracking-wider mb-2 block">PCAP Job</label>
            <select
              value={selectedJobId}
              onChange={(e) => setSelectedJobId(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:border-sky-500 focus:outline-none"
            >
              <option value="all">All Jobs</option>
              {jobs.map((j) => (
                <option key={j.id} value={j.id}>{j.filename}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-slate-400 uppercase tracking-wider mb-2 block">Severity</label>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:border-sky-500 focus:outline-none"
            >
              <option value="all">All Severities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-slate-400 uppercase tracking-wider mb-2 block">Protocol</label>
            <select
              value={protocolFilter}
              onChange={(e) => setProtocolFilter(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:border-sky-500 focus:outline-none"
            >
              <option value="all">All Protocols</option>
              <option value="SMTP">SMTP</option>
              <option value="IMAP">IMAP</option>
              <option value="POP3">POP3</option>
            </select>
          </div>
        </div>
        <div className="mt-3 text-sm text-slate-400">
          {filteredSessions.length} sessions match current filters
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <button
          onClick={handleExportJson}
          className="flex items-center justify-center gap-3 bg-slate-800/50 border border-slate-700 hover:border-sky-500/50 rounded-xl p-6 transition-all group"
        >
          <FileJson size={32} className="text-sky-400 group-hover:scale-110 transition-transform" />
          <div className="text-left">
            <div className="text-white font-semibold">JSON Export</div>
            <div className="text-xs text-slate-500">Raw analysis data</div>
          </div>
          <Download size={18} className="text-slate-600 group-hover:text-sky-400 transition-colors" />
        </button>

        <button
          onClick={handleExportHtml}
          className="flex items-center justify-center gap-3 bg-slate-800/50 border border-slate-700 hover:border-emerald-500/50 rounded-xl p-6 transition-all group"
        >
          <FileText size={32} className="text-emerald-400 group-hover:scale-110 transition-transform" />
          <div className="text-left">
            <div className="text-white font-semibold">HTML Report</div>
            <div className="text-xs text-slate-500">Formatted report</div>
          </div>
          <Download size={18} className="text-slate-600 group-hover:text-emerald-400 transition-colors" />
        </button>

        <button
          onClick={handleExportPdf}
          className="flex items-center justify-center gap-3 bg-slate-800/50 border border-slate-700 hover:border-orange-500/50 rounded-xl p-6 transition-all group"
        >
          <FileSpreadsheet size={32} className="text-orange-400 group-hover:scale-110 transition-transform" />
          <div className="text-left">
            <div className="text-white font-semibold">PDF Export</div>
            <div className="text-xs text-slate-500">Print-ready report</div>
          </div>
          <Download size={18} className="text-slate-600 group-hover:text-orange-400 transition-colors" />
        </button>
      </div>

      {previewHtml && (
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-slate-700">
            <div className="flex items-center gap-2">
              <Eye size={18} className="text-slate-400" />
              <h3 className="text-white font-semibold">HTML Report Preview</h3>
            </div>
            <button
              onClick={() => setPreviewHtml(null)}
              className="text-xs text-slate-400 hover:text-slate-200"
            >
              Close preview
            </button>
          </div>
          <iframe
            srcDoc={previewHtml}
            className="w-full h-[600px] bg-white"
            title="Report Preview"
          />
        </div>
      )}
    </div>
  );
}
