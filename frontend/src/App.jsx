import { useState } from 'react';
import { useAuth } from './hooks/useAuth.js';
import WelcomePage from './components/Welcome/WelcomePage.jsx';
import Navbar from './components/common/Navbar.jsx';
import FlowScreener from './components/Screener/FlowScreener.jsx';
import Portfolio from './components/Portfolio/Portfolio.jsx';
import TradePlan from './components/TradePlan/TradePlan.jsx';
import MultiBaggerScreen from './components/MultiBagger/MultiBaggerScreen.jsx';
import WikiPage from './components/Wiki/WikiPage.jsx';
import ProfilePage from './components/Profile/ProfilePage.jsx';
import DashboardPage from './components/Dashboard/DashboardPage.jsx';
import AlertsPage from './components/Alerts/AlertsPage.jsx';
import AlertMonitor from './components/Alerts/AlertMonitor.jsx';
import LegalModal from './components/Legal/LegalModal.jsx';
import Tour from './components/Onboarding/Tour.jsx';
import FeatureWelcome from './components/Onboarding/FeatureWelcome.jsx';
import StockOverview from './components/Stock/StockOverview.jsx';

export default function App() {
  const { user, sessionSeed, loading, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedTicker, setSelectedTicker] = useState(null);
  const [alertTicker, setAlertTicker] = useState(null);
  const [stockTicker, setStockTicker] = useState(null);
  const [legal, setLegal] = useState(null);

  if (loading) {
    return (
      <div className="bg-black h-screen w-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="spin text-2xl" style={{ color: '#00d4aa' }}>↻</div>
          <p className="text-white/30 text-sm">Loading InvestRite…</p>
        </div>
      </div>
    );
  }

  if (!user) return <WelcomePage onAuth={() => {}} />;

  function handleSelectTicker(ticker) {
    setSelectedTicker(ticker);
    setActiveTab('tradeplan');
  }

  return (
    <div
      className="h-screen w-screen flex flex-col overflow-hidden selection:bg-white selection:text-black"
      style={{ background: 'linear-gradient(160deg, #000 0%, #050810 60%, #000 100%)' }}
    >
      <Navbar
        activeTab={activeTab}
        onTabChange={(tab) => { setActiveTab(tab); if (tab !== 'tradeplan') setSelectedTicker(null); setAlertTicker(null); }}
        user={user}
        onLogout={logout}
        onSearch={(t) => { setStockTicker(t); setActiveTab('stock'); }}
      />

      {/* Screen content */}
      <main className="flex-1 overflow-auto">
        {activeTab === 'screener' && (
          <FlowScreener sessionSeed={sessionSeed} onSelectTicker={handleSelectTicker} />
        )}
        {activeTab === 'multibagger' && <MultiBaggerScreen />}
        {activeTab === 'portfolio'   && <Portfolio onCreateAlert={(t) => { setAlertTicker(t); setActiveTab('alerts'); }} />}
        {activeTab === 'alerts'      && <AlertsPage initialTicker={alertTicker} />}
        {activeTab === 'stock'       && <StockOverview ticker={stockTicker} onBack={() => setActiveTab('dashboard')} onCreateAlert={(t) => { setAlertTicker(t); setActiveTab('alerts'); }} />}
        {activeTab === 'dashboard'   && <DashboardPage onNavigate={tab => { setActiveTab(tab); }} />}
        {activeTab === 'wiki'        && <WikiPage />}
        {activeTab === 'profile'     && <ProfilePage />}
        {activeTab === 'tradeplan'   && (
          <TradePlan
            sessionSeed={sessionSeed}
            initialTicker={selectedTicker}
            onBack={selectedTicker ? () => { setActiveTab('screener'); setSelectedTicker(null); } : null}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="px-6 py-2 flex-shrink-0 flex flex-wrap items-center justify-center gap-x-2 text-[10px] text-white/20" style={{ fontFamily: 'Manrope' }}>
        <span>InvestRite · a free hobby project by Akshat Barjatya · educational only · not investment advice</span>
        <span className="text-white/10">·</span>
        <button onClick={() => setLegal('terms')} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'rgba(167,139,250,0.7)', fontFamily: 'Manrope', fontSize: 10 }}>Terms</button>
        <span className="text-white/10">·</span>
        <button onClick={() => setLegal('privacy')} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'rgba(167,139,250,0.7)', fontFamily: 'Manrope', fontSize: 10 }}>Privacy</button>
      </footer>

      {/* Global price-alert engine — runs on any tab while logged in */}
      <AlertMonitor user={user} />
      <LegalModal doc={legal} onClose={() => setLegal(null)} />

      {/* First-run onboarding walkthrough */}
      <Tour user={user} />

      {/* First-visit welcome card for each feature page */}
      <FeatureWelcome feature={activeTab} user={user} />
    </div>
  );
}
