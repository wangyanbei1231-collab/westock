import React, { useEffect, useState } from 'react';
import { HashRouter, Routes, Route, useLocation } from 'react-router-dom';
import { Lock, ArrowRight, Loader2 } from 'lucide-react';
import Navigation from './components/Navigation';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import AddItem from './pages/AddItem';
import Bundles from './pages/Bundles';
import CreateBundle from './pages/CreateBundle';
import Share from './pages/Share';
import { loadData, hasAppPin, checkAppPin } from './services/storageService';
import type { AppData } from './types';
import { ToastProvider } from './contexts/ToastContext';
import { AuthProvider } from './contexts/AuthContext';

const LockScreen = ({ onUnlock }: { onUnlock: () => void }) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const handleUnlock = () => {
    if (checkAppPin(pin)) { onUnlock(); } else { setError(true); setPin(''); setTimeout(() => setError(false), 500); }
  };
  return (
    <div className="h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-8">
      <div className="mb-8 p-6 bg-gray-800 rounded-full"><Lock size={48} className="text-brand-500" /></div>
      <h2 className="text-2xl font-bold mb-8">WeStock 安全锁</h2>
      <div className="w-full max-w-xs relative">
        <input type="password" value={pin} onChange={(e) => setPin(e.target.value)} placeholder="PIN" maxLength={6} className={`w-full bg-gray-800 border-2 ${error ? 'border-red-500 animate-pulse' : 'border-gray-700'} rounded-xl px-4 py-4 text-center text-2xl tracking-[0.5em] focus:outline-none focus:border-brand-500`} />
        <button onClick={handleUnlock} className="absolute right-2 top-2 bottom-2 bg-brand-600 px-4 rounded-lg flex items-center justify-center"><ArrowRight /></button>
      </div>
    </div>
  );
};

const Layout = ({ children }: { children?: React.ReactNode }) => {
  const location = useLocation();
  const hideNavPaths = ['/add-item', '/create-bundle'];
  const showNav = !hideNavPaths.includes(location.pathname);
  return (
    <div className="font-sans text-gray-900 bg-gray-50 min-h-screen">
      <main className={showNav ? 'pb-16' : ''}>{children}</main>
      {showNav && <Navigation />}
    </div>
  );
};

const AppContent = () => {
  const [data, setData] = useState<AppData>({ items: [], bundles: [] });
  const [isLocked, setIsLocked] = useState(hasAppPin());
  const [isLoading, setIsLoading] = useState(true);

  const refreshData = async () => {
    const d = await loadData();
    setData(d);
    setIsLoading(false);
  };

  useEffect(() => { refreshData(); }, []);

  if (isLocked) return <LockScreen onUnlock={() => setIsLocked(false)} />;
  if (isLoading) return <div className="h-screen flex items-center justify-center bg-gray-50"><Loader2 className="animate-spin text-brand-600" size={40} /></div>;

  return (
    <HashRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard data={data} />} />
          <Route path="/inventory" element={<Inventory data={data} refreshData={refreshData} />} />
          <Route path="/add-item" element={<AddItem refreshData={refreshData} />} />
          <Route path="/bundles" element={<Bundles data={data} refreshData={refreshData} />} />
          <Route path="/create-bundle" element={<CreateBundle data={data} refreshData={refreshData} />} />
          <Route path="/share" element={<Share refreshData={refreshData} />} />
        </Routes>
      </Layout>
    </HashRouter>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
        <ToastProvider>
            <AppContent />
        </ToastProvider>
    </AuthProvider>
  );
};

export default App;