import { ShieldCheck, ShieldX, ShieldAlert, Fingerprint, Key, Calendar, FileText, Link2 } from 'lucide-react';
import type { Certificate } from '@/lib/types';

interface Props {
  certificates: Certificate[];
}

const positionStyles: Record<string, { label: string; color: string }> = {
  leaf: { label: 'Leaf', color: 'bg-sky-500/20 text-sky-400 border-sky-500/30' },
  intermediate: { label: 'Intermediate', color: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30' },
  root: { label: 'Root', color: 'bg-slate-500/20 text-slate-300 border-slate-500/30' },
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function CertCard({ certificates }: Props) {
  if (!certificates || certificates.length === 0) {
    return (
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
        <h3 className="text-white font-semibold mb-2">Certificate Chain</h3>
        <p className="text-slate-400 text-sm">No certificates extracted from this session.</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
      <h3 className="text-white font-semibold mb-4">Certificate Chain</h3>

      <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-2">
        {certificates.map((cert, i) => (
          <div key={cert.id} className="flex items-center gap-2">
            <div className={`text-xs px-2 py-1 rounded border font-medium ${positionStyles[cert.chain_position]?.color || positionStyles.leaf.color}`}>
              {positionStyles[cert.chain_position]?.label || cert.chain_position}
            </div>
            {i < certificates.length - 1 && (
              <Link2 size={16} className="text-slate-600" />
            )}
          </div>
        ))}
      </div>

      <div className="space-y-3">
        {certificates.map((cert) => (
          <div key={cert.id} className="bg-slate-900/50 border border-slate-700/50 rounded-lg p-4">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded border font-medium ${positionStyles[cert.chain_position]?.color || ''}`}>
                    {positionStyles[cert.chain_position]?.label}
                  </span>
                  <span className="text-sm text-slate-200 font-medium">{cert.subject}</span>
                </div>
                <p className="text-xs text-slate-500 mt-1">Issued by: {cert.issuer}</p>
              </div>
              <div className="flex items-center gap-1">
                {cert.is_expired ? (
                  <span className="flex items-center gap-1 text-xs text-red-400">
                    <ShieldX size={16} /> Expired
                  </span>
                ) : cert.is_self_signed ? (
                  <span className="flex items-center gap-1 text-xs text-amber-400">
                    <ShieldAlert size={16} /> Self-signed
                  </span>
                ) : cert.is_valid ? (
                  <span className="flex items-center gap-1 text-xs text-emerald-400">
                    <ShieldCheck size={16} /> Valid
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-xs text-red-400">
                    <ShieldX size={16} /> Invalid
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div className="flex items-center gap-1.5">
                <Key size={12} className="text-slate-500" />
                <div>
                  <span className="text-slate-500 block">Key Algorithm</span>
                  <span className="text-slate-300">{cert.key_algorithm} {cert.key_length}bit</span>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <FileText size={12} className="text-slate-500" />
                <div>
                  <span className="text-slate-500 block">Signature</span>
                  <span className="text-slate-300">{cert.signature_algorithm}</span>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar size={12} className="text-slate-500" />
                <div>
                  <span className="text-slate-500 block">Validity</span>
                  <span className="text-slate-300">{formatDate(cert.not_before)} → {formatDate(cert.not_after)}</span>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar size={12} className="text-slate-500" />
                <div>
                  <span className="text-slate-500 block">Days to Expiry</span>
                  <span className={cert.days_to_expiry < 0 ? 'text-red-400' : cert.days_to_expiry < 30 ? 'text-amber-400' : 'text-slate-300'}>
                    {cert.days_to_expiry}
                  </span>
                </div>
              </div>
            </div>

            {cert.fingerprint && (
              <div className="flex items-center gap-1.5 mt-2 text-xs">
                <Fingerprint size={12} className="text-slate-500" />
                <span className="text-slate-500">SHA-1:</span>
                <span className="text-slate-400 font-mono truncate">{cert.fingerprint}</span>
              </div>
            )}

            {cert.san_entries && cert.san_entries.length > 0 && (
              <div className="mt-2">
                <span className="text-xs text-slate-500">SANs:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {cert.san_entries.map((san, i) => (
                    <span key={i} className="text-xs font-mono px-1.5 py-0.5 rounded bg-slate-700/30 text-slate-400">
                      {san}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
