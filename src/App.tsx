import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import UploadPage from '@/pages/UploadPage';
import DashboardPage from '@/pages/DashboardPage';
import SessionsPage from '@/pages/SessionsPage';
import SessionDetailPage from '@/pages/SessionDetailPage';
import ReportsPage from '@/pages/ReportsPage';
import { seedSampleData } from '@/lib/dataService';

function App() {
  const [seeding, setSeeding] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        await seedSampleData();
      } catch (err) {
        console.error('Seed error:', err);
      } finally {
        setSeeding(false);
      }
    })();
  }, []);

  if (seeding) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-slate-400 text-sm">Initializing SecureMailScope...</p>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/upload" element={<UploadPage />} />
          <Route path="/sessions" element={<SessionsPage />} />
          <Route path="/sessions/:id" element={<SessionDetailPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
