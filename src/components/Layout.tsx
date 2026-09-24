import { Link, useLocation } from 'react-router-dom';
import { Shield, Upload, LayoutDashboard, Mail, FileText, Activity } from 'lucide-react';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/upload', label: 'Upload', icon: Upload },
  { path: '/sessions', label: 'Sessions', icon: Mail },
  { path: '/reports', label: 'Reports', icon: FileText },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/dashboard" className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-sky-500/10 border border-sky-500/30">
                <Shield size={24} className="text-sky-400" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white tracking-tight">SecureMailScope</h1>
                <p className="text-xs text-slate-500 -mt-1">AI-Assisted Security Posture Assessment</p>
              </div>
            </Link>

            <nav className="flex items-center gap-1">
              {navItems.map(({ path, label, icon: Icon }) => {
                const active = location.pathname === path || (path !== '/dashboard' && location.pathname.startsWith(path));
                return (
                  <Link
                    key={path}
                    to={path}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      active
                        ? 'bg-sky-500/10 text-sky-400 border border-sky-500/30'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                    }`}
                  >
                    <Icon size={16} />
                    <span className="hidden sm:inline">{label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>

      <footer className="border-t border-slate-800 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <Activity size={12} />
            <span>SecureMailScope v1.0 — SIH26159 Prototype</span>
          </div>
          <span>NTRO · Ministry of Education Innovation Cell</span>
        </div>
      </footer>
    </div>
  );
}
