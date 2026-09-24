import { Lock, Unlock, ArrowRight, Code } from 'lucide-react';
import type { ClientHello, ServerHello } from '@/lib/types';

interface Props {
  clientHello: ClientHello;
  serverHello: ServerHello;
  starttls: boolean;
  forwardSecrecy: boolean;
}

const phaseColors: Record<string, string> = {
  plaintext: 'bg-slate-600',
  starttls: 'bg-amber-500',
  tls: 'bg-emerald-500',
};

export default function TLSHandshakeView({ clientHello, serverHello, starttls, forwardSecrecy }: Props) {
  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-white font-semibold">TLS Handshake</h3>
        <div className="flex items-center gap-2">
          {forwardSecrecy ? (
            <span className="flex items-center gap-1 text-xs text-emerald-400">
              <Lock size={14} /> Forward Secrecy
            </span>
          ) : (
            <span className="flex items-center gap-1 text-xs text-red-400">
              <Unlock size={14} /> No PFS
            </span>
          )}
          <span className={`text-xs px-2 py-0.5 rounded border ${starttls ? 'text-amber-400 border-amber-500/30 bg-amber-500/10' : 'text-slate-400 border-slate-600 bg-slate-700/30'}`}>
            {starttls ? 'STARTTLS' : 'Implicit TLS'}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs text-slate-400 mb-4">
        <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-slate-600" /> Plaintext</div>
        <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-amber-500" /> STARTTLS</div>
        <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-emerald-500" /> TLS</div>
      </div>

      <div>
        <div className="text-xs text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
          <Code size={14} /> ClientHello
        </div>
        <div className="bg-slate-900/70 rounded-lg p-4 space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-xs text-slate-500">TLS Version</span>
              <p className="text-slate-200 font-medium">{clientHello.tls_version}</p>
            </div>
            <div>
              <span className="text-xs text-slate-500">SNI</span>
              <p className="text-slate-200 font-mono text-xs">{clientHello.sni}</p>
            </div>
          </div>
          <div>
            <span className="text-xs text-slate-500">Cipher Suites Offered ({clientHello.cipher_suites.length})</span>
            <div className="flex flex-wrap gap-1 mt-1">
              {clientHello.cipher_suites.map((c, i) => (
                <span key={i} className="text-xs font-mono px-2 py-0.5 rounded bg-slate-700/50 text-slate-300 border border-slate-600/50">
                  {c}
                </span>
              ))}
            </div>
          </div>
          <div>
            <span className="text-xs text-slate-500">Extensions ({clientHello.extensions.length})</span>
            <div className="flex flex-wrap gap-1 mt-1">
              {clientHello.extensions.map((e, i) => (
                <span key={i} className="text-xs px-2 py-0.5 rounded bg-slate-700/30 text-slate-400">
                  {e}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-center">
        <ArrowRight size={20} className="text-slate-600 rotate-90" />
      </div>

      <div>
        <div className="text-xs text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
          <Code size={14} /> ServerHello
        </div>
        <div className="bg-slate-900/70 rounded-lg p-4 space-y-3">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <span className="text-xs text-slate-500">Negotiated Version</span>
              <p className="text-slate-200 font-medium">{serverHello.tls_version}</p>
            </div>
            <div>
              <span className="text-xs text-slate-500">Key Exchange</span>
              <p className="text-slate-200 font-medium">{serverHello.key_exchange}</p>
            </div>
            <div>
              <span className="text-xs text-slate-500">Forward Secrecy</span>
              <p className={forwardSecrecy ? 'text-emerald-400 font-medium' : 'text-red-400 font-medium'}>
                {forwardSecrecy ? 'Yes' : 'No'}
              </p>
            </div>
          </div>
          <div>
            <span className="text-xs text-slate-500">Selected Cipher Suite</span>
            <p className="text-slate-200 font-mono text-sm mt-1">{serverHello.selected_cipher}</p>
          </div>
          <div>
            <span className="text-xs text-slate-500">Extensions ({serverHello.extensions.length})</span>
            <div className="flex flex-wrap gap-1 mt-1">
              {serverHello.extensions.map((e, i) => (
                <span key={i} className="text-xs px-2 py-0.5 rounded bg-slate-700/30 text-slate-400">
                  {e}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
