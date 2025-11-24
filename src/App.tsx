import React, { useEffect, useState } from 'react';
import { HashRouter, Routes, Route, useLocation } from 'react-router-dom';
import Navigation from './components/Navigation';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import AddItem from './pages/AddItem';
import Bundles from './pages/Bundles';
import CreateBundle from './pages/CreateBundle';
import Share from './pages/Share';
import { loadData } from './services/storageService';
import type { AppData } from './types';

// Wrapper to conditionally render Navigation
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

const App: React.FC = () => {
  const [data, setData] = useState<AppData>({ items: [], bundles: [] });

  const refreshData = () => {
    setData(loadData());
  };

  useEffect(() => {
    refreshData();
  }, []);

  return (
    <HashRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard data={data} />} />
          <Route path="/inventory" element={<Inventory data={data} refreshData={refreshData} />} />
          <Route path="/add-item" element={<AddItem refreshData={refreshData} />} />
          <Route path="/bundles" element={<Bundles data={data} refreshData={refreshData} />} />
          <Route path="/create-bundle" element={<CreateBundle data={data} refreshData={refreshData} />} />
          <Route path="/share" element={<Share />} />
        </Routes>
      </Layout>
    </HashRouter>
  );
};

export default App;